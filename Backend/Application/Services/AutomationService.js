
const nunjucks = require('nunjucks');
const axios = require('axios');

const LeadService = require('./LeadService');
const leadRepo = require('../../Infrastructure/Repositories/LeadRepository');
const flowsRepo = require('../../Infrastructure/Repositories/AutomationFlowRepository');

const emailSvc = require('../../Infrastructure/external/EmailService');
const scheduler = require('../../Infrastructure/scheduler/automationCron');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');

const CampaignService = require('./CampaignService');
const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');

const ZaloService = require('../Services/campaign_runners/ZaloRunner');
const FacebookService = require('../Services/campaign_runners/FacebookRunner');
const { createPaymentLink } = require('../../Infrastructure/utils/paymentLink');
class AutomationService {
  render(str, ctx) {
    if (!str || typeof str !== 'string') return str;
    try {
      return nunjucks.renderString(str, { ...ctx, env: process.env });
    } catch (err) {
      console.error('[Automation] Render error:', err.message);
      return str;
    }
  }

  renderConditions(obj, ctx) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
      if (v == null) {
        out[k] = v;
        continue;
      }
      if (typeof v === 'string') out[k] = this.render(v, ctx);
      else if (Array.isArray(v))
        out[k] = v.map((it) =>
          typeof it === 'string' ? this.render(it, ctx) : this.renderConditions(it, ctx)
        );
      else if (typeof v === 'object') out[k] = this.renderConditions(v, ctx);
      else out[k] = v;
    }
    return out;
  }

  setByPath(obj, path, value) {
    if (!path || typeof path !== 'string') return;
    const parts = path.split('.').filter(Boolean);
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  }

  getByPath(obj, path) {
    if (!path || typeof path !== 'string') return undefined;
    const parts = path.split('.').filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return cur;
  }

  evalCondition(expr, ctx, defaultValue = false) {
    if (expr == null) return defaultValue;
    const rendered = this.render(String(expr), ctx);
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('ctx', `return (${rendered});`);
      return !!fn(ctx);
    } catch (e) {
      console.warn('[Automation] Invalid condition expression:', e.message);
      return defaultValue;
    }
  }

  // ---------------------------
  // Core flow runner
  // ---------------------------
  async runFlow(flow, ctx) {
    const sortedActions = (flow.actions || []).slice().sort((a, b) => (a.index || 0) - (b.index || 0));
    for (const action of sortedActions) {
      const type = action.action_type || action.type;
      console.log(`[Automation] Running action #${action.index}: ${type}`);
      await this.execAction(action, ctx);
    }
  }

  async execAction(action, ctx) {
    const type = action.action_type || action.type;
    if (!type) {
      console.warn('[Automation] execAction: missing action.type');
      return;
    }

    // Optional per-action guard condition (if you want):
    if (action.condition && !this.evalCondition(action.condition, ctx, false)) return;

    const handler = ACTION_HANDLERS[type];
    if (!handler) {
      console.warn(`[Automation] Unknown action type: ${type}`);
      return;
    }

    try {
      console.log(`[Automation] Executing action: ${type}`);
      await handler(this, action, ctx);
    } catch (err) {
      console.error(`[Automation] Action failed (${type}):`, err);
    }
  }

  // ---------------------------
  // Trigger entrypoint (registry-based, no switch-case)
  // ---------------------------
  async trigger(eventName, triggerPayload) {
    console.log(`[Automation] Trigger received: ${eventName}`);

    const route = EVENT_ROUTER[eventName];
    if (!route) {
      console.warn(`[Automation] Unknown trigger event: ${eventName}`);
      return;
    }

    // --- Build ctx depending on route
    // For FLOW events we typically want lead/order/customer loaded if ids exist
    // For TAG events we build ctx inside handleTagEvent (entity is target_type)
    // For CAMPAIGN events we don't need ctx from lead/order/customer by default

    if (route === 'flows') {
      const ctx = await this.buildDefaultCtx(triggerPayload);
      await this.runEventFlows(eventName, ctx);
      return;
    }

    if (route === 'tag') {
      await this.handleTagEvent(eventName, triggerPayload);
      return;
    }

    if (route === 'campaign') {
      await this.handleCampaignEvent(eventName, triggerPayload);
      return;
    }

    console.warn(`[Automation] Unknown route mapping for event: ${eventName} -> ${route}`);
  }

  async buildDefaultCtx(triggerPayload) {
    let lead = null;
    if (triggerPayload.lead_id) {
      lead = await leadRepo.findById(triggerPayload.lead_id);
      if (!lead) {
        console.warn('[Automation] No lead found for trigger:', triggerPayload.lead_id);
      }
    }

    let order = null;
    if (triggerPayload.order_id) {
      order = await OrderRepo.findById(triggerPayload.order_id);
    }

    let customer = null;
    if (triggerPayload.customer_id) {
      customer = await customerRepository.findById(triggerPayload.customer_id);
    }
    let payment = null;
    if (order?.order_id) {
      payment = createPaymentLink(order.order_id, { ttlMinutes: 60 });
    }

    return {
      lead: lead?.toJSON?.() ?? lead,
      customer: customer?.toJSON?.() ?? customer,
      order: order?.toJSON?.() ?? order,
      payment,
      trigger: triggerPayload,
      brand: { name: 'MyShop' },
      now: new Date(),
    };
  }

  // ---------------------------
  // Event flows
  // ---------------------------
  async runEventFlows(eventName, ctx) {
    const flows = await flowsRepo.findByEvent(eventName);
    if (!flows?.length) {
      console.log(`[Automation] No flows found for event: ${eventName}`);
      return;
    }

    for (const flow of flows) {
      const flowName = flow.name || '(no-name)';
      const trigger = flow.trigger;

      // Optional: flow-level conditions (JSON-Logic recommended)
      // if (trigger?.conditions && !this.matchConditions(ctx, trigger.conditions)) continue;

      console.log(`[Automation] Running flow: ${flowName} (trigger: ${trigger?.event_type})`);
      await this.runFlow(flow, ctx);
    }
  }

  // ---------------------------
  // Tag events (data-driven + optional tag conditions)
  // ---------------------------
  async handleTagEvent(eventName, triggerPayload) {
    const { target_type, target_id } = triggerPayload;
    if (!target_type || !target_id) {
      console.warn('[Automation] Tag event missing target_type/target_id');
      return;
    }

    let entity = null;
    if (target_type === 'lead') entity = await leadRepo.findById(target_id);
    // If later you allow customer tags: if (target_type === 'customer') entity = await customerRepository.findById(target_id);

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
    if (!flows?.length) return;

    for (const flow of flows) {
      const cond = flow.trigger?.conditions || {};
      const allTags = entity.tags || [];

      if (cond.tags_in && !cond.tags_in.some((t) => allTags.includes(t))) continue;
      if (cond.tags_not_in && cond.tags_not_in.some((t) => allTags.includes(t))) continue;

      console.log(`[Automation] Running tag flow: ${flow.name}`);
      await this.runFlow(flow, ctx);
    }
  }

  // ---------------------------
  // Campaign events
  // ---------------------------
  async handleCampaignEvent(eventName, payload) {
    const campaignId = payload?.campaign_id || payload?.campaignId;
    if (!campaignId) {
      console.warn('[Automation] Missing campaign_id for campaign event:', eventName);
      return;
    }

    console.log(`[Automation] Handling campaign event: ${eventName} (campaign_id=${campaignId})`);

    try {
      switch (eventName) {
        case 'campaign.run':
        case 'campaign.approved': {
          const result = await CampaignService.runCampaign(campaignId);
          console.log('[Automation] Campaign run result:', result);
          return result;
        }

        case 'campaign.pause': {
          if (CampaignService.pauseCampaign) {
            const result = await CampaignService.pauseCampaign(campaignId);
            console.log('[Automation] Campaign pause result:', result);
            return result;
          }
          console.warn('[Automation] pauseCampaign not implemented in CampaignService');
          return;
        }

        case 'campaign.end': {
          if (CampaignService.endCampaign) {
            const result = await CampaignService.endCampaign(campaignId);
            console.log('[Automation] Campaign end result:', result);
            return result;
          }
          console.warn('[Automation] endCampaign not implemented in CampaignService');
          return;
        }

        default:
          console.warn('[Automation] Unknown campaign event:', eventName);
          return;
      }
    } catch (err) {
      console.error('[Automation] handleCampaignEvent error:', err);
      throw err;
    }
  }

  // ---------------------------------------------------
  // Scheduled automation (your existing design kept)
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
            flow_id: flow.flow_id || flow._id || flow.id,
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

// ---------------------------
// EVENT_ROUTER (primitive trigger routing)
// ---------------------------
const EVENT_ROUTER = Object.freeze({
  // flow-driven events
  'lead.created': 'flows',
  'lead.updated': 'flows',
  'order.paid': 'flows',
  'order.created': 'flows',
  'order.refunded': 'flows',
  'zalo.message': 'flows',
  'segment.scheduled': 'flows',
  'engagement.email_opened': 'flows',
  'engagement.link_clicked': 'flows',
  'engagement.video_played': 'flows',

  // NEW: cron trigger
  'cron.daily': 'flows',

  // tag-driven
  'tag.added': 'tag',
  'tag.removed': 'tag',

  // campaign-driven
  'campaign.run': 'campaign',
  'campaign.approved': 'campaign',
  'campaign.pause': 'campaign',
  'campaign.end': 'campaign',
});

// ---------------------------
// ACTION_HANDLERS (primitive action registry)
// signature: async (svc, action, ctx) => void
// ---------------------------
const ACTION_HANDLERS = Object.freeze({
  // -------------------
  // Email
  // -------------------
  send_email: async (svc, action, ctx) => {
    const cfg = action.content || {};

    // 1) Resolve recipient (single)
    const to = svc.render(
      cfg.to ||
      action.to ||
      ctx.lead?.email ||
      ctx.customer?.email ||
      ctx.order?.email ||
      ctx.item?.email ||            // nếu đang chạy trong for_each (item là customer/lead)
      ctx.item?.customer?.email,    // fallback
      ctx
    );

    if (!to) {
      return console.warn('[Automation] send_email: missing recipient `to`');
    }

    // 2) Subject
    const subject = svc.render(cfg.subject || '', ctx);
    const templateName = cfg.template?.name || null;
    // 4) Template context (đưa mọi thứ cần thiết cho template)
    const templateCtx = {
      ...ctx, // lead/customer/order/trigger/now...
      to,
      subject,
      preheader: svc.render(cfg.preheader || '', ctx),
      headline: svc.render(cfg.headline || '', ctx),
      subheadline: svc.render(cfg.subheadline || '', ctx),
      body_text: svc.render(cfg.body_text || '', ctx),
      cta_url: svc.render(cfg.cta_url || ctx.trigger?.campaign_link || '#', ctx),
      cta_text: svc.render(cfg.cta_text || 'Xem ưu đãi', ctx),
      image_url: svc.render(cfg.image_url || '', ctx),
      product_name: svc.render(cfg.product_name || ctx.lead?.product_interest || '', ctx),
      footnote: svc.render(cfg.footnote || '', ctx),
      now_year: new Date().getFullYear(),
    };
    const fallbackBody =
      svc.render(cfg.body || '', ctx) ||
      (templateCtx.body_text
        ? `<div style="font-family:Arial,sans-serif;line-height:1.5">
           ${templateCtx.image_url ? `<img src="${templateCtx.image_url}" alt="" style="max-width:100%;border-radius:12px;margin-bottom:12px"/>` : ''}
           ${templateCtx.headline ? `<h2 style="margin:0 0 8px">${templateCtx.headline}</h2>` : ''}
           ${templateCtx.subheadline ? `<p style="margin:0 0 12px;color:#555">${templateCtx.subheadline}</p>` : ''}
           <div style="white-space:pre-wrap">${templateCtx.body_text}</div>
           ${templateCtx.cta_url && templateCtx.cta_url !== '#'
          ? `<p style="margin-top:16px">
                  <a href="${templateCtx.cta_url}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#111;color:#fff">
                    ${templateCtx.cta_text || 'Xem ưu đãi'}
                  </a>
                </p>`
          : ''
        }
           ${templateCtx.footnote ? `<p style="margin-top:16px;color:#777;font-size:12px">${templateCtx.footnote}</p>` : ''}
         </div>`
        : ''
      );

    // 6) Send (single)
    return await emailSvc.send({
      to,
      subject,
      body: fallbackBody,
      channel: action.channel || cfg.channel || 'email',
      template: templateName ? { name: templateName, ctx: templateCtx } : null,
    });
  },

  // -------------------
  // Zalo
  // content: { to?, message?, template_id?, params? }
  // -------------------
  send_zalo: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const to = svc.render(cfg.to || ctx.lead?.zalo_id || ctx.customer?.zalo_id, ctx);
    if (!to) return console.warn('[Automation] send_zalo: missing zalo recipient (zalo_id)');

    const message = svc.render(cfg.message || '', ctx);
    const templateId = cfg.template_id || null;
    const params = cfg.params ? svc.renderConditions(cfg.params, ctx) : {};

    await ZaloService.sendMessage({ to, message, template_id: templateId, params });
    console.log('[Automation] send_zalo ->', to);
  },

  // -------------------
  // Facebook Page post
  // content: { page_id?, message, link?, image_url? }
  // -------------------
  post_facebook: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const pageId = cfg.page_id || process.env.FB_PAGE_ID;
    if (!pageId) return console.warn('[Automation] post_facebook: missing page_id');

    const message = svc.render(cfg.message || '', ctx);
    const link = cfg.link ? svc.render(cfg.link, ctx) : null;
    const imageUrl = cfg.image_url ? svc.render(cfg.image_url, ctx) : null;

    await FacebookService.createPost({
      page_id: pageId,
      message,
      link,
      image_url: imageUrl,
    });

    console.log('[Automation] post_facebook -> page', pageId);
  },

  // -------------------
  // Lead interaction
  // -------------------
  add_interaction: async (svc, action, ctx) => {
    const payload = JSON.parse(svc.render(JSON.stringify(action.content || {}), ctx));
    const leadId = ctx?.lead?.lead_id || ctx?.lead?.id || ctx?.item?.lead_id || ctx?.item?.id;
    if (!leadId) return console.warn('[Automation] add_interaction: missing lead_id in ctx');
    await leadRepo.addInteraction(leadId, payload);
  },

  // -------------------
  // Conditional status update
  // action.condition is JS expression using ctx
  // -------------------
  update_status_if: async (svc, action, ctx) => {
    const ok = svc.evalCondition(action.condition || 'true', ctx, true);
    if (!ok) return;

    const leadId = ctx?.lead?.lead_id || ctx?.lead?.id || ctx?.item?.lead_id || ctx?.item?.id;
    if (!leadId) return console.warn('[Automation] update_status_if: missing lead_id');

    await leadRepo.updateById(
      leadId,
      { status: action.to_status },
      { reason: svc.render(action.reason || 'auto_by_flow', ctx) }
    );
  },

  // -------------------
  // Tags
  // -------------------
  tag_update: async (svc, action, ctx) => {
    const mode = action.mode || action.op || action.content?.mode || action.content?.op || 'add';
    const tags = action.content?.tags ?? action.tags ?? [];
    const leadId = ctx?.lead?.lead_id || ctx?.lead?.id || ctx?.item?.lead_id || ctx?.item?.id;

    if (!leadId || !Array.isArray(tags) || !tags.length) return;

    await leadRepo.updateTags(leadId, tags, mode);
    console.log(`[Automation] tag_update(${mode}) -> ${leadId}:`, tags);
  },

  // -------------------
  // Tasks
  // -------------------
  create_task: async (svc, action, ctx) => {
    const dueIn = Number(action.content?.due_in_minutes || 0);
    const dueAt = dueIn > 0 ? new Date(Date.now() + dueIn * 60000).toISOString() : null;

    const leadId = ctx.lead?.lead_id || ctx.lead?.id || ctx.item?.lead_id || null;
    const customerId = ctx.lead?.customer_id || ctx.customer?.customer_id || ctx.customer?.id || null;

    const taskPayload = {
      type: action.content?.type || 'follow_up',
      lead_id: leadId,
      customer_id: customerId,
      title: svc.render(action.content?.title || 'Follow-up lead', ctx),
      description: svc.render(action.content?.description || '', ctx),
      assignee: action.content?.assignee || null,
      due_at: dueAt,
      source_flow_id: ctx.trigger?.flow_id || null,
    };

    await Rabbit.publish('task.create', taskPayload);
  },

  // -------------------
  // Scheduling (delayed next_action)
  // -------------------
  schedule: async (svc, action, ctx) => {
    const delay = action.delay_iso || `PT${action.delay_minutes || 5}M`;
    const nextAction = action.next_action || { type: 'send_email' };
    await scheduler.enqueueIn(delay, 'automation.runAction', { action: nextAction, ctx });
  },

  // -------------------
  // Logging
  // -------------------
  log: async (svc, action, ctx) => {
    const level = action.level || action.content?.level || 'info';
    const message = svc.render(action.message || action.content?.message || '', ctx);
    const meta = action.content?.meta || {};
    console[level] ? console[level](`[Automation][log] ${message}`, meta) : console.log(`[Automation][log] ${message}`, meta);
  },

  // -------------------
  // Campaign run/stop as actions (optional)
  // -------------------
  'campaign.run': async (svc, action, ctx) => {
    const campaignId = action.content?.campaign_id || ctx.campaign?.campaign_id;
    if (!campaignId) return console.warn('[Automation] campaign.run: missing campaign_id');
    await Rabbit.publish('campaign.run', { campaign_id: campaignId, ctx });
  },

  'campaign.stop': async (svc, action, ctx) => {
    const campaignId = action.content?.campaign_id || ctx.campaign?.campaign_id;
    if (!campaignId) return console.warn('[Automation] campaign.stop: missing campaign_id');
    await Rabbit.publish('campaign.stop', { campaign_id: campaignId, ctx });
  },

  send_internal_report: async (svc, action, ctx) => {
    const to = action.content?.to || process.env.INTERNAL_REPORT_TO;
    if (!to) return console.warn('[Automation] send_internal_report: missing to');

    const subject = svc.render(action.content?.subject || 'Campaign summary', ctx);
    const body = svc.render(action.content?.body || '', ctx);

    await emailSvc.send({ to, subject, body, channel: action.channel || 'email' });
  },

  // -------------------
  // Generic HTTP request (AI/integration)
  // content: { method,url,headers?,params?,body?,timeout_ms?,save_to_ctx? }
  // save_to_ctx: "ai.result" or "ai"
  // -------------------
  'http.request': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const method = String(cfg.method || 'POST').toUpperCase();
    const url = svc.render(cfg.url || '', ctx);
    if (!url) return console.warn('[Automation] http.request: missing url');

    const headers = cfg.headers ? svc.renderConditions(cfg.headers, ctx) : {};
    const params = cfg.params ? svc.renderConditions(cfg.params, ctx) : undefined;
    const data = cfg.body ? svc.renderConditions(cfg.body, ctx) : undefined;
    const timeout = Number(cfg.timeout_ms || 10000);

    const res = await axios({ method, url, headers, params, data, timeout });

    if (cfg.save_to_ctx) {
      svc.setByPath(ctx, cfg.save_to_ctx, res.data);
    }
  },

  // -------------------
  // set_ctx
  // content: { path, value } OR { values: { "x.y": "...", ... } }
  // -------------------
  set_ctx: async (svc, action, ctx) => {
    const cfg = action.content || {};
    if (cfg.values && typeof cfg.values === 'object') {
      const rendered = svc.renderConditions(cfg.values, ctx);
      for (const [path, val] of Object.entries(rendered)) svc.setByPath(ctx, path, val);
      return;
    }
    if (!cfg.path) return console.warn('[Automation] set_ctx: missing path');
    const val = typeof cfg.value === 'string' ? svc.render(cfg.value, ctx) : svc.renderConditions(cfg.value, ctx);
    svc.setByPath(ctx, cfg.path, val);
  },

  // -------------------
  // branch: { condition, then_action, else_action }
  // condition uses ctx (JS expression)
  // -------------------
  branch: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const ok = svc.evalCondition(cfg.condition || 'false', ctx, false);
    const next = ok ? cfg.then_action : cfg.else_action;
    if (next) await svc.execAction(next, ctx);
  },

  // -------------------
  // query.leads: { conditions, limit, save_to_ctx? } default save_to_ctx="batch"
  // ctx.batch.items -> for_each
  // -------------------
  'query.leads': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const cond = svc.renderConditions(cfg.conditions || {}, ctx);
    const limit = Number(cfg.limit || 5000);
    const rows = await leadRepo.findByConditions({ ...cond, limit });

    const out = {
      entity: 'leads',
      items: (rows || []).map((x) => x?.toJSON?.() ?? x),
    };

    if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, out);
    else ctx.batch = out;
  },

  // -------------------
  // query.orders: { conditions, limit, save_to_ctx? }
  // -------------------
  'query.orders': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const cond = svc.renderConditions(cfg.conditions || {}, ctx);
    const limit = Number(cfg.limit || 5000);

    if (!OrderRepo.findByConditions) {
      console.warn('[Automation] query.orders: OrderRepo.findByConditions not implemented');
      const out = { entity: 'orders', items: [] };
      if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, out);
      else ctx.batch = out;
      return;
    }

    const rows = await OrderRepo.findByConditions({ ...cond, limit });
    const out = {
      entity: 'orders',
      items: (rows || []).map((x) => x?.toJSON?.() ?? x),
    };

    if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, out);
    else ctx.batch = out;
  },
  'query.customers': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const cond = svc.renderConditions(cfg.conditions || {}, ctx);
    const limit = Number(cfg.limit || 5000);
    let rows = [];
    if (customerRepository.findByConditions) {
      rows = await customerRepository.findByConditions({ ...cond, limit });
      console.log('[Automation] query.customers: used findByConditions, total customers=', rows.length);
      console.log('[Automation] query.customers items sample:', rows.map(x => ({ id: x.customer_id, email: x.email })));
    } else if (customerRepository.findAll) {
      const all = await customerRepository.findAll();
      rows = Array.isArray(all) ? all.slice(0, limit) : [];
      console.log('[Automation] query.customers: used findAll fallback, total customers=', all.length);
      console.log('[Automation] query.customers items sample:', rows.map(x => ({ id: x.customer_id, email: x.email })));
    } else {
      console.warn('[Automation] query.customers: customerRepository.findByConditions/findAll not implemented');
      rows = [];
    }
    const out = {
      entity: 'customers',
      items: (rows || []).map((x) => x?.toJSON?.() ?? x),
    };
    if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, out);
    else ctx.batch = out;
  },
  for_each: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const fromPath = cfg.from_path;
    const batch = fromPath ? svc.getByPath(ctx, fromPath) : ctx.batch;

    const items = batch?.items || [];
    const itemKey = cfg.item_key || 'item';
    const next = cfg.next_action;

    if (!next) return console.warn('[Automation] for_each: missing next_action');

    for (const it of items) {
      const childCtx = { ...ctx, [itemKey]: it };
      await svc.execAction(next, childCtx);
    }
  },
});

module.exports = new AutomationService();
