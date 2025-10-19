const nunjucks = require('nunjucks');
const LeadService = require('./LeadService');
const leadRepo = require('../../Infrastructure/Repositories/LeadRepository');
const flowsRepo = require('../../Infrastructure/Repositories/AutomationFlowRepository');
const emailSvc = require('../../Infrastructure/external/EmailService');
const scheduler = require('../../Infrastructure/scheduler/automationCron');

class AutomationService {
    // ---------------------------
    // UTILITIES
    // ---------------------------
    matchConditions(lead, cond = {}, trigger = {}) {
        if (!cond) return true;

        // Điều kiện đơn giản theo campaign / status
        if (cond.campaign_id_in && !cond.campaign_id_in.includes(lead.campaign_id)) return false;
        if (cond.status_in && !cond.status_in.includes(lead.status)) return false;

        // Kiểm tra theo trigger payload (nếu có)
        if (cond.source && trigger?.payload?.source !== cond.source) return false;
        if (cond.country && trigger?.payload?.country !== cond.country) return false;

        return true;
    }

    render(str, ctx) {
        if (!str || typeof str !== 'string') return str;
        try {
            return nunjucks.renderString(str, ctx);
        } catch (err) {
            console.error('[Automation] Render error:', err.message);
            return str;
        }
    }

    // ---------------------------
    // EXECUTE ACTION
    // ---------------------------
    async execAction(action, ctx) {
        const type = action.action_type || action.type;

        console.log(`[Automation] Executing action: ${type}`);

        try {
            switch (type) {
                case 'send_email': {
                    const to = this.render(action.to || ctx.lead.email, ctx);
                    const subject = this.render(action.content?.subject || '', ctx);
                    const body = this.render(action.content?.body || '', ctx);
                    await emailSvc.send({ to, subject, body, channel: action.channel || 'email' });
                    break;
                }

                case 'add_interaction': {
                    const payload = JSON.parse(this.render(JSON.stringify(action.content || {}), ctx));
                    await leadRepo.addInteraction(ctx.lead.lead_id, payload);
                    break;
                }

                case 'update_status_if': {
                    const condExpr = action.condition ? this.render(action.condition, ctx) : 'true';
                    let shouldUpdate = false;
                    try {
                        // ⚠️ Dùng eval tạm thời, sau nên thay bằng safe-eval
                        shouldUpdate = eval(condExpr);
                    } catch (e) {
                        console.warn('[Automation] Invalid condition expression:', e.message);
                    }
                    if (shouldUpdate) {
                        await leadRepo.updateById(
                            ctx.lead.lead_id,
                            { status: action.to_status },
                            { reason: this.render(action.reason || 'auto_by_flow', ctx) }
                        );
                    }
                    break;
                }

                case 'schedule': {
                    const delay = action.delay_iso || `PT${action.delay_minutes || 5}M`;
                    const nextAction = action.next_action || { type: 'send_email' };
                    await scheduler.enqueueIn(delay, 'automation.runAction', { action: nextAction, ctx });
                    break;
                }

                default:
                    console.warn(`[Automation] Unknown action type: ${type}`);
            }
        } catch (err) {
            console.error(`[Automation] Action failed (${type}):`, err);
        }
    }

    // ---------------------------
    //  TRIGGER FLOW
    // ---------------------------
    async trigger(eventName, triggerPayload) {
        console.log(`[Automation] Trigger received: ${eventName}`);

        const lead = await leadRepo.findById(triggerPayload.lead_id);
        if (!lead) {
            console.warn('[Automation] No lead found for trigger:', triggerPayload.lead_id);
            return;
        }

        // Trả về danh sách: { flow, trigger, actions[] } đã hydrate theo event
        const items = await flowsRepo.findByEvent(eventName);

        const ctx = {
            lead: lead.toJSON?.() ?? lead,
            trigger: triggerPayload,
            brand: { name: 'MyShop' },
        };

        for (const it of items) {
            const flowName = it.name || it.flow?.name || '(no-name)';
            const trigger = it.trigger;              // trigger riêng
            const actions = it.actions || [];        //action đã lọc theo flow & trigger

            // ⚠️ match điều kiện theo trigger.conditions (KHÔNG phải flow)
            if (!this.matchConditions(lead, trigger?.conditions, triggerPayload)) {
                console.log(`[Automation] Flow skipped by conditions: ${flowName}`);
                continue;
            }

            console.log(`[Automation] Running flow: ${flowName} (trigger: ${trigger?.event_type})`);
            for (const action of actions) {
                await this.execAction(action, ctx);
            }
        }
    }

    // ---------------------------
    //  DAILY AUTOMATION
    // ---------------------------
    async runDailyAutomation() {
        console.log('[Automation] Running daily automation tasks...');

        try {
            // 1️⃣ Dự báo xác suất chuyển đổi
            const predictionResult = await LeadService.predictBatch(500);
            console.log('[Automation] Lead prediction done:', predictionResult);

            // 2️⃣ Tự động convert lead đủ điều kiện
            if (typeof LeadService.autoConvertEligibleLeads === 'function') {
                const convertResult = await LeadService.autoConvertEligibleLeads();
                console.log('[Automation] Auto convert leads done:', convertResult);
            }

            // 3️⃣ Các automation bổ sung khác
            // await notificationService.sendDailyReminders();
        } catch (err) {
            console.error('[Automation] Error in daily automation:', err);
        }

        console.log('[Automation] All tasks completed.');
        return { ok: true, message: 'Daily automation finished.' };
    }

    // ---------------------------
    //  MANUAL TRIGGER (UI / Admin)
    // ---------------------------
    async triggerNow() {
        return await this.runDailyAutomation();
    }
}

module.exports = new AutomationService();
