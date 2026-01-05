
// ============================
// Imports
// ============================
const nunjucks = require('nunjucks');
const axios = require('axios');
const { randomUUID } = require('crypto');
const { URLSearchParams } = require('url');

// Repos
const leadRepo = require('../../Infrastructure/Repositories/LeadRepository');
const flowsRepo = require('../../Infrastructure/Repositories/AutomationFlowRepository');
const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');
const customerInteractionRepo = require('../../Infrastructure/Repositories/CustomerInteractionRepository');
const CampaignRepository = require('../../Infrastructure/Repositories/CampaignRepository');
const CampaignChannelRepository = require('../../Infrastructure/Repositories/CampaignChannelRepository');
const CampaignChannelFlowRepository = require('../../Infrastructure/Repositories/CampaignChannelFlowRepository');
const ProductRepository = require('../../Infrastructure/Repositories/ProductRepository');
const CampaignChannelRepo = require('../../Infrastructure/Repositories/CampaignChannelRepository');
// const TaskRepository = require('../../Infrastructure/Repositories/TaskRepository');

// Services / infra
const emailSvc = require('../../Infrastructure/external/EmailService');
const scheduler = require('../../Infrastructure/scheduler/automationCron');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');
const { createPaymentLink } = require('../../Infrastructure/utils/paymentLink');
const { renderTemplate } = require('../../Infrastructure/external/email_templates/TemplateRenderer');

// ============================
// Constants
// ============================
const BRAND_FALLBACK = 'CChain';

// 1) Event routing (hiện tại còn hardcode)
// - Khi bạn chuyển sang DB routing thì thay block này bằng lookup DB
const EVENT_ROUTER = Object.freeze({
  // flows
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
  'cron.daily': 'flows',
  // tag
  'tag.added': 'tag',
  'tag.removed': 'tag',
  // campaign
  'campaign.run': 'campaign',
  'campaign.approved': 'campaign',
  'campaign.pause': 'campaign',
  'campaign.end': 'campaign',
  // campaign channel
  'campaign.channel.run': 'campaign_channel',
  'campaign.channel.pause': 'campaign_channel',
  'campaign.channel.end': 'campaign_channel',
});

// ============================
// Small helpers
// ============================
function pickFirst(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== '') return v;
  return null;
}

function toJson(x) {
  return x?.toJSON?.() ?? x ?? null;
}

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function safeObj(x) {
  return x && typeof x === 'object' ? x : {};
}

// ============================
// Tracking helpers
// ============================
function trackUrl({ mid, to, url, templateKey, ctx }) {
  const base = process.env.TRACK_BASE_URL;
  if (!base) return url;

  const q = new URLSearchParams({
    mid,
    to,
    url,
    template_key: templateKey || '',
    flow_id: String(ctx?.trigger?.flow_id || ''),
    order_id: String(ctx?.order?.order_id || ''),
    customer_id: String(ctx?.customer?.customer_id || ''),
    lead_id: String(ctx?.lead?.lead_id || ''),
    campaign_id: String(ctx?.campaign?.campaign_id || ctx?.campaign?.id || ''),
    channel_id: String(ctx?.campaign_channel?.channel_id || ctx?.campaign_channel?.id || ''),
  });

  return `${base}/v1/track/click?${q.toString()}`;
}

function injectOpenPixel({ html, mid, to, templateKey, ctx }) {
  const base = process.env.TRACK_BASE_URL;
  if (!base) return html;

  const q = new URLSearchParams({
    mid,
    to: to || '',
    template_key: templateKey || '',
    flow_id: String(ctx?.trigger?.flow_id || ''),
    order_id: String(ctx?.order?.order_id || ''),
    customer_id: String(ctx?.customer?.customer_id || ''),
    lead_id: String(ctx?.lead?.lead_id || ''),
    campaign_id: String(ctx?.campaign?.campaign_id || ctx?.campaign?.id || ''),
    channel_id: String(ctx?.campaign_channel?.channel_id || ctx?.campaign_channel?.id || ''),
    source: 'pixel',
  });

  const src = `${base}/v1/track/o/${mid}.gif?${q.toString()}`;
  const pixel =
    `<img src="${src}" width="1" height="1" ` +
    `style="display:block;border:0;opacity:0;max-width:1px;max-height:1px" alt="">`;

  if (!html) return pixel;
  if (html.includes('</body>')) return html.replace('</body>', `${pixel}</body>`);
  if (html.includes('</html>')) return html.replace('</html>', `${pixel}</html>`);
  return html + pixel;
}

function rewriteLinksForClickTracking({ html, mid, to, templateKey, ctx }) {
  if (!process.env.TRACK_BASE_URL) return html;
  if (!html || typeof html !== 'string') return html;

  return html.replace(/href\s*=\s*"(.*?)"/gi, (m, href) => {
    if (!href) return m;
    const v = String(href).trim();
    if (!/^https?:\/\//i.test(v)) return m;
    const tracked = trackUrl({ mid, to, url: v, templateKey, ctx });
    return `href="${tracked}"`;
  });
}

// ============================
// Automation Service
// ============================
class AutomationService {
  // ---------------------------
  // Render utils
  // ---------------------------
  render(str, ctx) {
    if (!str || typeof str !== 'string') return str;
    try {
      return nunjucks.renderString(str, { ...ctx, env: process.env });
    } catch (err) {
      console.error('[Automation] Render error:', err.message);
      return str;
    }
  }

  renderDeep(value, ctx) {
    if (value == null) return value;

    if (typeof value === 'string') return this.render(value, ctx);
    if (Array.isArray(value)) return value.map((x) => this.renderDeep(x, ctx));
    if (typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = this.renderDeep(v, ctx);
      return out;
    }
    return value;
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
  // Trigger condition gating
  // ---------------------------
  isFlowRunnable(flow, ctx) {
    const isEnabled = flow.enabled !== false && flow.is_active !== false;
    const isActive = String(flow.status || '').toLowerCase() === 'active';

    if (!isEnabled || !isActive) {
      console.log(
        `[Automation] Skip flow (enabled=${isEnabled}, status=${flow.status}): ${flow.name || flow.flow_id}`
      );
      return false;
    }

    if (!this.matchFlowTriggerConditions(flow, ctx)) {
      console.log(
        `[Automation] Skip flow (conditions not matched): ${flow.name || flow.flow_id}`
      );
      return false;
    }

    return true;
  }

  matchFlowTriggerConditions(flow, ctx) {
    const trig = flow?.trigger || {};
    const cond = trig?.conditions || trig?.condition || null;
    if (!cond) return true;

    // expression-based
    const expr = cond.expression || cond.expr || trig.expression || trig.expr;
    if (expr) return this.evalCondition(expr, ctx, true);

    // filter-based
    const filters = Array.isArray(cond.filters) ? cond.filters : null;
    if (filters?.length) return this.matchFilters(filters, ctx);

    // tags-based
    if (cond.tags_in || cond.tags_not_in) {
      const ent = ctx?.item || ctx?.customer || ctx?.lead || null;
      const tags = Array.isArray(ent?.tags) ? ent.tags : [];

      if (Array.isArray(cond.tags_in) && cond.tags_in.length) {
        if (!cond.tags_in.some((t) => tags.includes(t))) return false;
      }
      if (Array.isArray(cond.tags_not_in) && cond.tags_not_in.length) {
        if (cond.tags_not_in.some((t) => tags.includes(t))) return false;
      }
      return true;
    }

    return true;
  }

  matchFilters(filters, ctx) {
    for (const f of filters) {
      if (!f || typeof f !== 'object') continue;

      const path = f.path || f.field || f.key;
      const op = String(f.op || f.operator || 'eq').toLowerCase();
      const rawVal = f.value;

      const left = path ? this.getByPath(ctx, path) : undefined;
      const right = this.renderDeep(rawVal, ctx);

      const ok = (() => {
        switch (op) {
          case 'exists':
            return left !== undefined && left !== null;
          case 'eq':
          case '==':
            return left == right; // eslint-disable-line eqeqeq
          case 'neq':
          case '!=':
            return left != right; // eslint-disable-line eqeqeq
          case 'in':
            return Array.isArray(right) ? right.includes(left) : false;
          case 'nin':
          case 'not_in':
            return Array.isArray(right) ? !right.includes(left) : true;
          case 'gt':
            return Number(left) > Number(right);
          case 'gte':
            return Number(left) >= Number(right);
          case 'lt':
            return Number(left) < Number(right);
          case 'lte':
            return Number(left) <= Number(right);
          case 'contains':
            if (typeof left === 'string') return String(left).includes(String(right));
            if (Array.isArray(left)) return left.includes(right);
            return false;
          default:
            return true;
        }
      })();

      if (!ok) return false;
    }
    return true;
  }

  // ---------------------------
  // Entrypoint: Trigger dispatcher
  // ---------------------------
  async trigger(eventName, triggerPayload) {
    console.log(`[Automation] Trigger received: ${eventName}`);
    if (eventName === 'automation.runAction') {
      const { action, ctx } = triggerPayload || {};
      if (!action || !ctx) {
        console.warn('[Automation] automation.runAction missing action/ctx');
        return;
      }
      await this.execAction(action, ctx);
      return;
    }
    const route = EVENT_ROUTER[eventName];
    if (!route) {
      console.warn(`[Automation] Unknown trigger event: ${eventName}`);
      return;
    }

    switch (route) {
      case 'flows': {
        const ctx = await this.buildDefaultCtx(eventName, triggerPayload);
        await this.runEventFlows(eventName, ctx);
        return;
      }
      case 'tag':
        await this.handleTagEvent(eventName, triggerPayload);
        return;
      case 'campaign':
        await this.handleCampaignEvent(eventName, triggerPayload);
        return;
      case 'campaign_channel':
        await this.handleCampaignChannelEvent(eventName, triggerPayload);
        return;
      default:
        console.warn(`[Automation] Unknown route mapping for event: ${eventName} -> ${route}`);
    }
  }

  // ---------------------------
  // Context builder
  // ---------------------------
  async buildDefaultCtx(eventName, triggerPayload) {
    const now = new Date();

    const leadId = pickFirst(triggerPayload.lead_id, triggerPayload.leadId);
    const orderId = pickFirst(triggerPayload.order_id, triggerPayload.orderId);
    const customerId = pickFirst(triggerPayload.customer_id, triggerPayload.customerId);

    const campaignId = pickFirst(triggerPayload.campaign_id, triggerPayload.campaignId);
    const channelId = pickFirst(triggerPayload.channel_id, triggerPayload.channelId);

    const productId = pickFirst(
      triggerPayload.product_id,
      triggerPayload.productId,
      triggerPayload?.item?.product_id
    );

    const productIds = pickFirst(triggerPayload.product_ids, triggerPayload.productIds);

    // 1) fetch primary entities
    const [lead, order, customer] = await Promise.all([
      leadId ? leadRepo.findById(leadId).catch(() => null) : null,
      orderId ? OrderRepo.findById(orderId).catch(() => null) : null,
      customerId ? customerRepository.findById(customerId).catch(() => null) : null,
    ]);

    if (leadId && !lead) console.warn('[Automation] No lead found for trigger:', leadId);

    // 2) campaign + channel
    let campaign = null;
    if (campaignId && CampaignRepository?.findById) {
      try {
        campaign = await CampaignRepository.findById(campaignId);
      } catch (e) {
        console.warn('[Automation] Campaign lookup failed:', e?.message || e);
      }
    }
    const campaignJson = toJson(campaign);

    let campaign_channel = null;
    if (channelId) {
      try {
        if (CampaignChannelRepository?.findById) {
          campaign_channel = await CampaignChannelRepository.findById(channelId);
        } else if (CampaignChannelRepository?.findOne) {
          campaign_channel = await CampaignChannelRepository.findOne({ where: { channel_id: channelId } });
        } else if (CampaignChannelRepository?.findByCampaignId && campaignId) {
          const channels = await CampaignChannelRepository.findByCampaignId(campaignId);
          campaign_channel = (channels || []).find((c) => (c.channel_id || c.id) === channelId) || null;
        }
      } catch (e) {
        console.warn('[Automation] Channel lookup failed:', e?.message || e);
      }
    }
    const channelJson = toJson(campaign_channel);

    // 3) resolve effective products
    let effectiveProductIds = [];
    if (Array.isArray(productIds) && productIds.length) effectiveProductIds = productIds;
    else if (productId) effectiveProductIds = [productId];
    else if (Array.isArray(campaignJson?.products)) {
      effectiveProductIds = campaignJson.products
        .map((p) => (typeof p === 'string' ? p : (p?.product_id || p?.id)))
        .filter(Boolean);
    }
    effectiveProductIds = uniq(effectiveProductIds);

    // 4) fetch products
    let product = null;
    let products = [];
    try {
      if (productId && ProductRepository?.findById) product = await ProductRepository.findById(productId);
      if (effectiveProductIds.length && ProductRepository?.findByIds) products = await ProductRepository.findByIds(effectiveProductIds);
      if (product && (!products || products.length === 0)) products = [product];

      // fallback to campaign-stored products if lookup returns nothing (or partial)
      if ((!products || products.length === 0) && Array.isArray(campaignJson?.products) && campaignJson.products.length > 0) {
        products = campaignJson.products;
      }
    } catch (e) {
      console.warn('[Automation] Product lookup failed:', e?.message || e);
      if (Array.isArray(campaignJson?.products)) products = campaignJson.products;
    }

    // 5) payment link
    let payment = null;
    if (order?.order_id) payment = createPaymentLink(order.order_id, { ttlMinutes: 60 });

    // 6) settings merge + brand
    const campaignSettings = safeObj(campaignJson?.settings);
    const channelSettings = safeObj(channelJson?.settings);
    const mergedSettings = { ...(campaignSettings || {}), ...(channelSettings || {}) };
    const brandName = mergedSettings.brand_name || BRAND_FALLBACK;

    // 7) target filter -> ctx.conditions
    const targetFilter = pickFirst(campaignJson?.target_filter, campaignJson?.targetFilter, campaignJson?.target);
    const normalizedTargetFilter = safeObj(targetFilter);

    const ctx = {
      lead: toJson(lead),
      customer: toJson(customer),
      order: toJson(order),

      product: toJson(product),
      products: Array.isArray(products) ? products.map(toJson) : [],

      payment,

      campaign: campaignJson,
      campaign_channel: channelJson,

      condition: normalizedTargetFilter,
      conditions: normalizedTargetFilter,
      target_filter: normalizedTargetFilter,

      run_id: pickFirst(triggerPayload.run_id, triggerPayload.trace_id),

      settings: {
        campaign: campaignSettings,
        channel: channelSettings,
        merged: mergedSettings,
      },

      trigger: { event: eventName, ...triggerPayload },

      brand: { name: brandName },
      now: now.toISOString(),
    };

    if (triggerPayload?.options && typeof triggerPayload.options === 'object') {
      ctx.options = triggerPayload.options;
    }

    return ctx;
  }

  // ---------------------------
  // Run flows
  // ---------------------------
  async runEventFlows(eventName, ctx) {
    const flows = await flowsRepo.findByEvent(eventName);
    if (!flows?.length) {
      console.log(`[Automation] No flows found for event: ${eventName}`);
      return;
    }

    for (const flow of flows) {
      if (!this.isFlowRunnable(flow, ctx)) continue;

      console.log(`[Automation] Running flow: ${flow.name} (event=${eventName})`);
      await this.runFlow(flow, ctx);
    }
  }

  async runFlow(flow, ctx) {
    const sorted = (flow.actions || [])
      .slice()
      .sort((a, b) => (a.order_index ?? a.index ?? 0) - (b.order_index ?? b.index ?? 0));

    for (const action of sorted) {
      const idx = action.order_index ?? action.index ?? 0;
      console.log(`[Automation] Running action #${idx}: ${action.action_type}`);
      await this.execAction(action, ctx);
    }
  }

  async execAction(action, ctx) {
    const type = action?.action_type;
    if (!type) {
      console.warn('[Automation] execAction: missing action_type');
      return;
    }

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
  // Tag events
  // ---------------------------
  async handleTagEvent(eventName, triggerPayload) {
    const { target_type, target_id } = triggerPayload || {};
    if (!target_type || !target_id) {
      console.warn('[Automation] Tag event missing target_type/target_id');
      return;
    }

    let entity = null;
    if (target_type === 'lead') entity = await leadRepo.findById(target_id);

    if (!entity) {
      console.warn(`[Automation] No ${target_type} found for tag event`);
      return;
    }

    const ctx = {
      [target_type]: toJson(entity),
      trigger: { event: eventName, ...triggerPayload },
      brand: { name: BRAND_FALLBACK },
      now: new Date(),
    };

    const flows = await flowsRepo.findByEvent(eventName);
    if (!flows?.length) return;

    for (const flow of flows) {
      if (!this.isFlowRunnable(flow, ctx)) continue;
      console.log(`[Automation] Running tag flow: ${flow.name}`);
      await this.runFlow(flow, ctx);
    }
  }

  // ---------------------------
  // Campaign events -> fan out to channel events
  // ---------------------------
  async handleCampaignEvent(eventName, payload) {
    const campaignId = payload?.campaign_id || payload?.campaignId;
    if (!campaignId) {
      console.warn('[Automation] Missing campaign_id for campaign event:', eventName);
      return;
    }

    console.log(`[Automation] Handling campaign event: ${eventName} (campaign_id=${campaignId})`);

    const channels = await CampaignChannelRepository.findByCampaignId(campaignId);
    if (!channels?.length) {
      console.warn(`[Automation] No channels found for campaign_id=${campaignId}`);
      return;
    }

    const run_id = payload?.run_id || randomUUID();

    if (eventName === 'campaign.run' || eventName === 'campaign.approved') {
      for (const ch of channels) {
        const chJson = toJson(ch);
        const channelId = chJson.channel_id || chJson.id;

        const maps = await CampaignChannelFlowRepository.findByChannelId(channelId);
        const hasActive = (maps || []).some((m) => m.is_active !== false);
        if (!hasActive) continue;

        const st = String(chJson.status || '').toLowerCase();
        if (st && !['draft', 'paused', 'active', 'running'].includes(st)) continue;

        await Rabbit.publish('campaign.channel.run', {
          campaign_id: campaignId,
          channel_id: channelId,
          run_id,
          options: payload?.options || {},
        });
      }
      return;
    }

    if (eventName === 'campaign.pause') {
      for (const ch of channels) {
        const channelId = (ch.channel_id || ch.id);
        await Rabbit.publish('campaign.channel.pause', {
          campaign_id: campaignId,
          channel_id: channelId,
          run_id,
          options: payload?.options || {},
        });
      }
      return;
    }

    if (eventName === 'campaign.end') {
      for (const ch of channels) {
        const channelId = (ch.channel_id || ch.id);
        await Rabbit.publish('campaign.channel.end', {
          campaign_id: campaignId,
          channel_id: channelId,
          run_id,
          options: payload?.options || {},
        });
      }
      return;
    }

    console.warn('[Automation] Unknown campaign event:', eventName);
  }

  // ---------------------------
  // Campaign channel events -> run mapped flows
  // ---------------------------
  async handleCampaignChannelEvent(eventName, payload) {
    const campaign_id = payload?.campaign_id;
    const channel_id = payload?.channel_id;
    if (!campaign_id || !channel_id) {
      console.warn('[Automation] Missing campaign_id/channel_id for channel event');
      return;
    }

    if (eventName === 'campaign.channel.pause') {
      console.log('[Automation] campaign.channel.pause received:', { campaign_id, channel_id });
      return;
    }

    if (eventName === 'campaign.channel.end') {
      console.log('[Automation] campaign.channel.end received:', { campaign_id, channel_id });
      return;
    }

    const ctx = await this.buildDefaultCtx(eventName, payload);

    const maps = await CampaignChannelFlowRepository.findByChannelId(channel_id);
    const activeMaps = (maps || [])
      .filter((m) => m.is_active !== false)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    if (!activeMaps.length) {
      console.log(`[Automation] No mapped flows for channel_id=${channel_id}`);
      return;
    }

    if (!flowsRepo.findById) {
      console.warn('[Automation] flowsRepo.findById is missing. Please implement it to run mapped flows.');
      return;
    }

    for (const m of activeMaps) {
      const mapJson = toJson(m);
      const flowId = mapJson.flow_id;

      const flow = await flowsRepo.findById(flowId);
      if (!flow) {
        console.warn(`[Automation] Flow not found: ${flowId}`);
        continue;
      }

      const ctx2 = {
        ...ctx,
        channel_flow: mapJson,
        trigger: { ...(ctx.trigger || {}), flow_id: flowId },
      };

      if (!this.isFlowRunnable(flow, ctx2)) continue;

      console.log(`[Automation] Running mapped flow ${flowId} (order_index=${mapJson.order_index ?? 0})`);
      await this.runFlow(flow, ctx2);
    }
  }

  // ---------------------------
  // Scheduled automation (legacy)
  // ---------------------------
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
    const renderedCond = this.renderDeep(trigger.conditions || {}, baseCtx);
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
        const baseCtx = { brand: { name: BRAND_FALLBACK }, now };

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
        // placeholder
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

// ============================
// Action handlers registry
// ============================
const ACTION_HANDLERS = Object.freeze({
  // -------------------
  // Email
  // -------------------
  send_email: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const merged = ctx?.settings?.merged || {};

    const currentEntity =
      ctx.item ||
      ctx.customer ||
      ctx.lead ||
      ctx.order ||
      (cfg.item_key ? ctx?.[cfg.item_key] : null) ||
      null;

    const rawTo =
      cfg.to ||
      action.to ||
      currentEntity?.email ||
      ctx.customer?.email ||
      ctx.lead?.email ||
      ctx.order?.email;

    const to = svc.render(rawTo, ctx);
    if (!to) return console.warn('[Automation] send_email: missing recipient `to`');

    const subjectPrefix = merged.subject_prefix || merged.subjectPrefix || '';
    const rawSubject = cfg.subject || merged.subject || '';
    const subject = svc.render(`${subjectPrefix}${rawSubject}`, ctx) || '(no-subject)';

    const templateKey =
      cfg.template_key ||
      cfg.template?.key ||
      merged.template_key ||
      null;

    const from_name = merged.from_name || merged.fromName || null;
    const from_email = merged.from_email || merged.fromEmail || null;
    const reply_to = merged.reply_to || merged.replyTo || null;

    const email = cfg.email ? svc.renderDeep(cfg.email, ctx) : {};
    const theme = cfg.theme ? svc.renderDeep(cfg.theme, ctx) : {};

    const templateCtx = {
      ...ctx,
      to,
      subject,
      email,
      theme,
      now: (ctx.now instanceof Date ? ctx.now.toISOString() : (ctx.now || new Date().toISOString())),
      brand: ctx.brand || { name: BRAND_FALLBACK },
      item: currentEntity,
    };

    let bodyHtml = '';
    if (templateKey) {
      try {
        bodyHtml = renderTemplate(templateKey, templateCtx);
      } catch (e) {
        console.error('[Automation] renderTemplate failed:', e?.message || e);
        bodyHtml = '';
      }
    }

    if (!bodyHtml || String(bodyHtml).trim() === '') {
      const bodySource = cfg.body || merged.body || '';
      const legacy = svc.render(bodySource, templateCtx);
      bodyHtml = legacy?.trim()
        ? legacy
        : `<!doctype html><html><body>${subject}</body></html>`;
    }

    // Ensure theme/email data from UI can be used even if using template_key
    // If templateKey is used, we've already rendered bodyHtml.
    // However, we want to allow the template to access email.intro, email.message, etc.
    // which are already in templateCtx.

    // INTEGRATION: If cfg.body exists but email.body_html is missing (legacy UI content),
    // we inject it into email object for template use.
    if (cfg.body && !templateCtx.email.body_html) {
      templateCtx.email.body_html = svc.render(cfg.body, templateCtx);
    }

    const mid = randomUUID();

    bodyHtml = rewriteLinksForClickTracking({
      html: bodyHtml,
      mid,
      to,
      templateKey,
      ctx: templateCtx,
    });

    bodyHtml = injectOpenPixel({
      html: bodyHtml,
      mid,
      to,
      templateKey,
      ctx: templateCtx,
    });

    const result = await emailSvc.send({
      to,
      subject,
      body: bodyHtml,
      channel: action.channel || cfg.channel || 'email',
      template: templateKey ? { key: templateKey } : null,
      from_name,
      from_email,
      reply_to,
    });

    const channelId =
      ctx?.campaign_channel?.channel_id ||
      ctx?.campaign_channel?.id ||
      ctx?.trigger?.channel_id ||
      ctx?.trigger?.channelId ||
      null;

    if (channelId) {
      try {
        await CampaignChannelRepo.incById(channelId, { sent: 1, delivered: 1 });
      } catch (e) {
        console.warn('[Automation] Failed to inc sent/delivered:', e?.message || e);
      }
    } else {
      console.warn('[Automation] send_email: missing channel_id → cannot inc sent/delivered');
    }

    return result;
  },

  // -------------------
  // Interaction
  // -------------------
  add_interaction: async (svc, action, ctx) => {
    const payload = JSON.parse(svc.render(JSON.stringify(action.content || {}), ctx));

    const customerId =
      ctx?.customer?.customer_id ||
      ctx?.customer?.id ||
      ctx?.order?.customer_id ||
      ctx?.lead?.customer_id ||
      ctx?.trigger?.customer_id ||
      ctx?.item?.customer_id ||
      null;

    let leadId =
      ctx?.lead?.lead_id ||
      ctx?.lead?.id ||
      ctx?.item?.lead_id ||
      ctx?.item?.id ||
      ctx?.trigger?.lead_id ||
      null;

    if (!leadId && customerId && leadRepo.getLeadIDbyCustommerID) {
      try {
        leadId = await leadRepo.getLeadIDbyCustommerID(customerId);
      } catch {
        // ignore
      }
    }

    if (customerId) {
      try {
        await customerInteractionRepo.addInteraction(customerId, payload);
      } catch (e) {
        console.warn('[Automation] add_interaction: failed customer_interactions:', e?.message || e);
      }
    }

    if (leadId) {
      try {
        await leadRepo.addInteraction(leadId, payload);
      } catch (e) {
        console.warn('[Automation] add_interaction: failed lead_interactions:', e?.message || e);
      }
    }

    if (!customerId && !leadId) console.warn('[Automation] add_interaction: missing both customer_id and lead_id');
  },

  // -------------------
  // set_ctx
  // -------------------
  set_ctx: async (svc, action, ctx) => {
    const cfg = action.content || {};
    if (cfg.values && typeof cfg.values === 'object') {
      const rendered = svc.renderDeep(cfg.values, ctx);
      for (const [path, val] of Object.entries(rendered)) svc.setByPath(ctx, path, val);
      return;
    }
    if (!cfg.path) return console.warn('[Automation] set_ctx: missing path');

    const val = svc.renderDeep(cfg.value, ctx);
    svc.setByPath(ctx, cfg.path, val);
  },

  // -------------------
  // query.leads
  // -------------------
  'query.leads': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const condFromCtx = (ctx?.conditions || ctx?.condition || ctx?.target_filter || ctx?.campaign?.target_filter || ctx?.campaign_channel?.target_filter || {});
    const cond = svc.renderDeep({ ...condFromCtx, ...(cfg.conditions || {}) }, ctx);
    const limit = Number(cfg.limit || 5000);

    console.log('[Automation] query.leads: conditions=', JSON.stringify(cond));
    const rows = await leadRepo.findByConditions({ ...cond, limit });
    console.log(`[Automation] query.leads: found ${rows?.length || 0} leads`);

    const out = { entity: 'leads', items: (rows || []).map(toJson) };
    if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, out);
    else ctx.batch = out;
  },

  // -------------------
  // query.customers
  // -------------------
  'query.customers': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const condFromCtx = (ctx?.conditions || ctx?.condition || ctx?.target_filter || ctx?.campaign?.target_filter || ctx?.campaign_channel?.target_filter || {});
    const cond = svc.renderDeep({ ...condFromCtx, ...(cfg.conditions || {}) }, ctx);
    const limit = Number(cfg.limit || 5000);
    const hasCond = cond && Object.keys(cond).length > 0;

    console.log('[Automation] query.customers: conditions=', JSON.stringify(cond));
    let rows = [];
    if (customerRepository.findByConditions) {
      if (!hasCond) {
        console.warn('[Automation] query.customers: EMPTY conditions → BLOCKED');
        rows = [];
      } else {
        rows = await customerRepository.findByConditions({ ...cond, limit });
        console.log(`[Automation] query.customers: found ${rows?.length || 0} customers`);
      }
    } else {
      console.warn('[Automation] customerRepository.findByConditions missing');
      rows = [];
    }

    const out = { entity: 'customers', items: (rows || []).map(toJson) };
    if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, out);
    else ctx.batch = out;
  },

  // -------------------
  // query.orders
  // -------------------
  'query.orders': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const cond = svc.renderDeep(cfg.conditions || {}, ctx);
    const limit = Number(cfg.limit || 5000);

    let rows = [];
    if (OrderRepo.findByConditions) {
      rows = await OrderRepo.findByConditions({ ...cond, limit });
    }

    const out = { entity: 'orders', items: (rows || []).map(toJson) };
    if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, out);
    else ctx.batch = out;
  },

  // -------------------
  // for_each (Enhanced Concurrency)
  // -------------------
  for_each: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const fromPath = cfg.from_path;
    const batch = fromPath ? svc.getByPath(ctx, fromPath) : ctx.batch;

    const items = batch?.items || [];
    const itemKey = cfg.item_key || 'item';
    const next = cfg.next_action;

    if (!next) return console.warn('[Automation] for_each: missing next_action');

    const mode = cfg.mode || 'sequential';

    if (mode === 'distributed') {
      console.log(`[Automation] for_each (distributed): dispatching ${items.length} items to RabbitMQ`);
      const pArr = items.map(async (it) => {
        const childCtx = { ...ctx, [itemKey]: it };
        const singleBatch = { items: [it], entity: batch?.entity };
        if (fromPath) svc.setByPath(childCtx, fromPath, singleBatch);
        else childCtx.batch = singleBatch;
        return Rabbit.publish('automation.runAction', { action: next, ctx: childCtx });
      });
      await Promise.all(pArr);
    } else if (mode === 'parallel') {
      const concurrency = Number(cfg.concurrency || process.env.AUTOMATION_FOR_EACH_LIMIT || 5);
      console.log(`[Automation] for_each (parallel): concurrency=${concurrency}`);
      const executing = new Set();
      const results = [];
      for (const it of items) {
        const childCtx = { ...ctx, [itemKey]: it };
        const p = svc.execAction(next, childCtx);
        results.push(p);
        executing.add(p);
        p.finally(() => executing.delete(p));
        if (executing.size >= concurrency) await Promise.race(executing);
      }
      await Promise.all(results);
    } else {
      // Sequential (Default)
      for (const it of items) {
        const childCtx = { ...ctx, [itemKey]: it };
        await svc.execAction(next, childCtx);
      }
    }
  },

  // -------------------
  // log
  // -------------------
  log: async (svc, action, ctx) => {
    const level = action.level || action.content?.level || 'info';
    const message = svc.render(action.message || action.content?.message || '', ctx);
    const meta = action.content?.meta || {};
    console[level] ? console[level](`[Automation][log] ${message}`, meta) : console.log(`[Automation][log] ${message}`, meta);
  },

  // -------------------
  // schedule
  // -------------------
  schedule: async (svc, action, ctx) => {
    const delay = action.delay_iso || `PT${action.delay_minutes || 5}M`;
    const nextAction = action.next_action || { type: 'send_email' };
    await scheduler.enqueueIn(delay, 'automation.runAction', { action: nextAction, ctx });
  },

  // -------------------
  // branch
  // -------------------
  branch: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const ok = svc.evalCondition(cfg.condition || 'false', ctx, false);
    const next = ok ? cfg.then_action : cfg.else_action;
    if (next) await svc.execAction(next, ctx);
  },

  // -------------------
  // http.request
  // -------------------
  'http.request': async (svc, action, ctx) => {
    const cfg = action.content || {};
    const method = String(cfg.method || 'POST').toUpperCase();
    const url = svc.render(cfg.url || '', ctx);
    if (!url) return console.warn('[Automation] http.request: missing url');

    const headers = cfg.headers ? svc.renderDeep(cfg.headers, ctx) : {};
    const params = cfg.params ? svc.renderDeep(cfg.params, ctx) : undefined;
    const data = cfg.body ? svc.renderDeep(cfg.body, ctx) : undefined;
    const timeout = Number(cfg.timeout_ms || 10000);

    const res = await axios({ method, url, headers, params, data, timeout });

    if (cfg.save_to_ctx) svc.setByPath(ctx, cfg.save_to_ctx, res.data);
  },

  // -------------------
  // tag_update
  // -------------------
  tag_update: async (svc, action, ctx) => {
    const cfg = action.content || {};
    const op = cfg.op || 'add';
    const tags = Array.isArray(cfg.tags) ? cfg.tags : (cfg.tags ? [cfg.tags] : []);

    if (!tags.length) return;

    // Determine target (Lead or Customer)
    let lead = ctx.lead;
    let customer = ctx.customer;

    // Try to resolve if missing
    if (!lead && ctx.leadId) lead = await leadRepo.findById(ctx.leadId);
    if (!customer && ctx.customerId) customer = await customerRepository.findById(ctx.customerId);

    // Apply to Lead
    if (lead && leadRepo.addTags && leadRepo.removeTags) {
      try {
        if (op === 'add') await leadRepo.addTags(lead.lead_id || lead.id, tags);
        else if (op === 'remove') await leadRepo.removeTags(lead.lead_id || lead.id, tags);
        console.log(`[Automation] tag_update(${op}) on Lead ${lead.lead_id || lead.id}:`, tags);
      } catch (e) {
        console.warn('[Automation] tag_update lead failed:', e.message);
      }
    }

    // Apply to Customer
    if (customer && customerRepository.addTags && customerRepository.removeTags) {
      try {
        const cid = customer.customer_id || customer.id;
        if (op === 'add') await customerRepository.addTags(cid, tags);
        else if (op === 'remove') await customerRepository.removeTags(cid, tags);
        console.log(`[Automation] tag_update(${op}) on Customer ${cid}:`, tags);
      } catch (e) {
        console.warn('[Automation] tag_update customer failed:', e.message);
      }
    }
  },

  // -------------------
  // create_task
  // -------------------
  create_task: async (svc, action, ctx) => {
    // const cfg = action.content || {};
    // if (!TaskRepository?.create) return console.warn('[Automation] TaskRepository.create missing');

    // const title = svc.render(cfg.title || 'New Task', ctx);
    // const desc = svc.render(cfg.description || '', ctx);
    // const dueMin = Number(cfg.due_in_minutes || 0);

    // const dueDate = new Date();
    // if (dueMin > 0) dueDate.setMinutes(dueDate.getMinutes() + dueMin);

    // const related = {};
    // if (ctx.lead && (ctx.lead.lead_id || ctx.lead.id)) {
    //   related.related_id = ctx.lead.lead_id || ctx.lead.id;
    //   related.related_type = 'lead';
    // } else if (ctx.customer && (ctx.customer.customer_id || ctx.customer.id)) {
    //   related.related_id = ctx.customer.customer_id || ctx.customer.id;
    //   related.related_type = 'customer';
    // }

    // try {
    //   await TaskRepository.create({
    //     title,
    //     description: desc,
    //     due_date: dueDate.toISOString(),
    //     type: cfg.type || 'todo',
    //     priority: cfg.priority || 'medium',
    //     status: 'todo',
    //     ...related
    //   });
    //   console.log(`[Automation] Task created: ${title}`);
    // } catch (e) {
    //   console.warn('[Automation] create_task failed:', e.message);
    // }
  },

  // -------------------
  // update_status_if
  // -------------------
  update_status_if: async (svc, action, ctx) => {
    const cfg = action.content || {};
    // Condition check
    if (cfg.condition && !svc.evalCondition(cfg.condition, ctx, false)) {
      return;
    }
    const newStatus = cfg.to_status;
    if (!newStatus) return;

    // Usually applies to Lead
    const leadId = ctx.lead?.lead_id || ctx.lead?.id;
    if (leadId && leadRepo.updateStatus) {
      try {
        await leadRepo.updateStatus(leadId, newStatus, cfg.reason || 'Automation');
        console.log(`[Automation] Lead ${leadId} status updated to ${newStatus}`);
      } catch (e) {
        console.warn('[Automation] update_status_if failed:', e.message);
      }
    }
  },
});

// ============================
// Export
// ============================
module.exports = new AutomationService();
