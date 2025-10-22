const nunjucks = require('nunjucks');
const LeadService = require('./LeadService');
const leadRepo = require('../../Infrastructure/Repositories/LeadRepository');
const flowsRepo = require('../../Infrastructure/Repositories/AutomationFlowRepository');
const emailSvc = require('../../Infrastructure/external/EmailService');
const scheduler = require('../../Infrastructure/scheduler/automationCron');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');

class AutomationService {

    // matchConditions(lead, cond = {}, trigger = {}) {
    //     if (!cond) return true;

    //     if (cond.campaign_id_in && !cond.campaign_id_in.includes(lead.campaign_id)) return false;
    //     if (cond.status_in && !cond.status_in.includes(lead.status)) return false;
    //     if (cond.source && trigger?.payload?.source !== cond.source) return false;
    //     // if (cond.country && trigger?.payload?.country !== cond.country) return false;

    //     const allTags = [
    //         ...(lead.tags || []),
    //         ...(lead.customer?.tags || []),
    //         ...(lead.product?.tags || []),
    //     ];

    //     if (cond.tags_in && !cond.tags_in.some(tag => allTags.includes(tag))) return false;
    //     if (cond.tags_not_in && cond.tags_not_in.some(tag => allTags.includes(tag))) return false;

    //     if (cond.birthday_between) {
    //         const [start, end] = cond.birthday_between.map(d => new Date(d));
    //         const birthDate = new Date(lead.birthday);
    //         if (birthDate < start || birthDate > end) return false;
    //     }

    //     if (cond.last_interaction_before) {
    //         const cutoff = new Date(cond.last_interaction_before);
    //         const last = new Date(lead.last_interaction_at || 0);
    //         if (!(last < cutoff)) return false;
    //     }

    //     if (cond.created_after) {
    //         const ca = new Date(cond.created_after);
    //         const created = new Date(lead.created_at || 0);
    //         if (!(created > ca)) return false;
    //     }

    //     if (typeof cond.loyalty_score_gte === 'number') {
    //         const score = Number(lead.loyalty_score || 0);
    //         if (!(score >= cond.loyalty_score_gte)) return false;
    //     }

    //     return true;
    // }

    render(str, ctx) {
        if (!str || typeof str !== 'string') return str;
        try {
            return nunjucks.renderString(str, ctx);
        } catch (err) {
            console.error('[Automation] Render error:', err.message);
            return str;
        }
    }

    renderConditions(obj, ctx) {
        if (!obj || typeof obj !== 'object') return obj;
        const out = Array.isArray(obj) ? [] : {};
        for (const [k, v] of Object.entries(obj)) {
            if (v == null) { out[k] = v; continue; }
            if (typeof v === 'string') out[k] = this.render(v, ctx);
            else if (Array.isArray(v)) out[k] = v.map(it => typeof it === 'string' ? this.render(it, ctx) : this.renderConditions(it, ctx));
            else if (typeof v === 'object') out[k] = this.renderConditions(v, ctx);
            else out[k] = v;
        }
        return out;
    }

    async runFlow(flow, ctx) {
        const sortedActions = (flow.actions || []).sort((a, b) => a.index - b.index);
        for (const action of sortedActions) {
            console.log(`[Automation] Running action #${action.index}: ${action.type}`);
            await this.execAction(action, ctx);
        }
    }

    async execAction(action, ctx) {
        const type = action.action_type || action.type;
        console.log(`[Automation] Executing action: ${type}`);

        try {
            switch (type) {
                case 'send_email': {
                    const to = this.render(action.to || ctx.lead?.email, ctx);
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
                        shouldUpdate = eval(condExpr); // Có thể thay bằng parser an toàn như filtrex
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

    async trigger(eventName, triggerPayload) {
        console.log(`[Automation] Trigger received: ${eventName}`);

        let lead = null;
        if (triggerPayload.lead_id) {
            lead = await leadRepo.findById(triggerPayload.lead_id);
            if (!lead) {
                console.warn('[Automation] No lead found for trigger:', triggerPayload.lead_id);
                return;
            }
        }

        const ctx = {
            lead: lead?.toJSON?.() ?? lead,
            trigger: triggerPayload,
            brand: { name: 'MyShop' },
            now: new Date(),
        };

        switch (eventName) {
            case 'lead_created':
                await this.runEventFlows(eventName, ctx);
                break;
            case 'lead_updated':
            case 'order_paid':
            case 'order_refunded':
            case 'zalo_message':
            case 'segment.scheduled':
                await this.runEventFlows(eventName, ctx);
                break;

            case 'tag_added':
            case 'tag_removed':
                await this.handleTagEvent(eventName, triggerPayload);
                break;

            default:
                console.warn(`[Automation] Unknown trigger event: ${eventName}`);
        }
    }

    async runEventFlows(eventName, ctx) {
        const flows = await flowsRepo.findByEvent(eventName);
        if (!flows?.length) {
            console.log(`[Automation] No flows found for event: ${eventName}`);
            return;
        }

        for (const flow of flows) {
            const flowName = flow.name || '(no-name)';
            const trigger = flow.trigger;
            // if (ctx.lead && !this.matchConditions(ctx.lead, trigger?.conditions, ctx.trigger)) {
            //     console.log(`[Automation] Flow skipped by conditions: ${flowName}`);
            //     continue;
            // }
            console.log(`[Automation] Running flow: ${flowName} (trigger: ${trigger?.event_type})`);
            await this.runFlow(flow, ctx);
        }
    }

    async handleTagEvent(eventName, triggerPayload) {
        const { target_type, target_id } = triggerPayload;
        let entity = null;
        if (target_type === 'lead') entity = await leadRepo.findById(target_id);
        if (!entity) {
            console.warn(`[Automation] No ${target_type} found for tag event`);
            return;
        }

        const ctx = {
            [target_type]: entity.toJSON?.() ?? entity,
            trigger: triggerPayload,
            brand: { name: 'MyShop' },
            now: new Date(),
        };

        const flows = await flowsRepo.findByEvent(eventName);
        for (const flow of flows) {
            const cond = flow.trigger?.conditions || {};
            const allTags = entity.tags || [];
            if (cond.tags_in && !cond.tags_in.some(t => allTags.includes(t))) continue;
            if (cond.tags_not_in && cond.tags_not_in.some(t => allTags.includes(t))) continue;
            console.log(`[Automation] Running tag flow: ${flow.name}`);
            await this.runFlow(flow, ctx);
        }
    }

    // ---------------------------------------------------
    // Scheduled automation triggers
    // ---------------------------------------------------
    async resolveScheduledLeadsByType(type, cond, ctx) {
        switch (type) {
            case 'birthday': {
                const month = ctx.now.getMonth() + 1;
                return leadRepo.findByConditions({ birthday_month: month, ...cond });
            }
            case 'inactive_lead': {
                const days = Number(cond.days_inactive || 30);
                const cutoff = new Date(ctx.now);
                cutoff.setDate(cutoff.getDate() - days);
                return leadRepo.findByConditions({ last_interaction_before: cutoff.toISOString(), ...cond });
            }
            case 'new_customer': {
                const days = Number(cond.days_since_created || 7);
                const since = new Date(ctx.now);
                since.setDate(since.getDate() - days);
                return leadRepo.findByConditions({ created_after: since.toISOString(), ...cond });
            }
            case 'loyal_customer': {
                return leadRepo.findByConditions({ loyalty_score_gte: cond.min_score || 80, ...cond });
            }
            default:
                return leadRepo.findByConditions(cond || {});
        }
    }

    async collectLeadsForFlow(flow, baseCtx) {
        const trigger = flow.trigger || {};
        const type = trigger.type || 'default';
        const renderedCond = this.renderConditions(trigger.conditions || {}, baseCtx);
        return this.resolveScheduledLeadsByType(type, renderedCond, baseCtx);
    }

    async runDailyAutomation(options = {}) {
        const now = new Date();
        const { dryRun = false, limitPerFlow = 5000, runLegacyJobs = false } = options;

        console.log('[Automation] Running scheduled automation...');

        try {
            const scheduledFlows = await (flowsRepo.findScheduled?.() || flowsRepo.findByEvent('segment.scheduled'));

            for (const flow of (scheduledFlows || [])) {
                const flowName = flow.name || '(no-name)';
                const baseCtx = { brand: { name: 'MyShop' }, now };

                console.log(`[Automation] Scanning flow: ${flowName}`);
                let leads = [];

                try {
                    leads = await this.collectLeadsForFlow(flow, baseCtx);
                } catch (e) {
                    console.error(`[Automation] collectLeadsForFlow failed for ${flowName}:`, e);
                    continue;
                }

                if (!Array.isArray(leads) || leads.length === 0) {
                    console.log(`[Automation] No leads matched for flow: ${flowName}`);
                    continue;
                }

                if (limitPerFlow && leads.length > limitPerFlow) {
                    console.warn(`[Automation] Matched ${leads.length} leads but capped to ${limitPerFlow} for flow: ${flowName}`);
                    leads = leads.slice(0, limitPerFlow);
                }

                for (const lead of leads) {
                    const payload = {
                        segment: flow.trigger?.segment_key || flow.slug || flowName,
                        lead_id: lead.lead_id,
                        flow_id: flow._id || flow.id,
                        flow_name: flowName,
                        ...(flow.trigger?.extra_payload || {}),
                    };

                    if (dryRun) console.log('[Automation][DRYRUN] Would publish:', payload);
                    else await Rabbit.publish('segment.scheduled', payload);
                }
            }

            if (runLegacyJobs) {
                if (LeadService.predictBatch) await LeadService.predictBatch(500);
                if (LeadService.autoConvertEligibleLeads) await LeadService.autoConvertEligibleLeads();
            }

        } catch (err) {
            console.error('[Automation] Error in scheduled automation:', err);
        }

        console.log('[Automation] Scheduled automation tick completed.');
        return { ok: true, message: 'Scheduled automation finished.' };
    }

    async triggerNow() {
        return this.runDailyAutomation();
    }
}

module.exports = new AutomationService();
