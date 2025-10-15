// backend/src/Application/services/AutomationFlowService.js
/* eslint-disable camelcase */
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

const AutomationFlowRepository = require('../../Infrastructure/Repositories/AutomationFlowRepository.js');
const AutomationTriggerRepository = require('../../Infrastructure/Repositories/AutomationTriggerRepository.js');
const AutomationActionRepository = require('../../Infrastructure/Repositories/AutomationActionRepository.js');

class AutomationFlowService {
  constructor() {
    this.flows = AutomationFlowRepository;
    this.triggers = AutomationTriggerRepository;
    this.actions = AutomationActionRepository;
  }
  async createFlow(dto = {}) {
    const {
      trigger_type,
      trigger_config,
      action_type,
      action_config,
      ...rest 
    } = dto;

    // 1) kiểm tra tối thiểu
    if (!rest?.name || !String(rest.name).trim()) {
      throw new Error('name is required');
    }
    // 2) sanitize payload theo model AutomationFlow
    const flowPayload = this._pickFlowPayload(rest);
    // 3) transaction để atomic
    return await sequelize.transaction(async (t) => {
      // 3.1 tạo flow
      const flow = await this.flows.create(flowPayload, { transaction: t });
      if (!flow) throw new Error('Tạo flow thất bại');
      const flow_id = flow.flow_id || flow.id;

      const created = { flow, triggers: [], actions: [] };

      // 3.2 tạo trigger nếu có
      let newTriggerId = null;
      if (trigger_type) {
        const triggerPayload = this._buildTriggerForSchema({
          flow_id,
          trigger_type,
          trigger_config,
        });
        const trigger = await this.triggers.create(triggerPayload, { transaction: t });
        if (!trigger) throw new Error('Tạo trigger thất bại');
        newTriggerId = trigger.trigger_id || trigger.id;
        created.triggers.push(trigger);
      }

      // 3.3 tạo action nếu có
      if (action_type) {
        const actionPayload = this._buildActionForSchema({
          flow_id,
          action_type,
          action_config,
        });
        if (!actionPayload.trigger_id && newTriggerId) {
          actionPayload.trigger_id = newTriggerId;
        }

        const action = await this.actions.create(actionPayload, { transaction: t });
        if (!action) throw new Error('Tạo action thất bại');
        created.actions.push(action);
      }
      return created;
    });
  }
  async saveEditor(flow_id, dto = {}) {
  const { flow_meta = {}, upserts = {}, deletes = {} } = dto;
  return sequelize.transaction(async (t) => {
    const flow = await this.flows.findById(flow_id, { transaction: t });
    if (!flow) throw Object.assign(new Error('Flow not found'), { status: 404 });
    const patch = {};
    if (typeof flow_meta.name === 'string') patch.name = flow_meta.name;
    if (typeof flow_meta.description === 'string') patch.description = flow_meta.description;
    if (Array.isArray(flow_meta.tags)) patch.tags = flow_meta.tags;
    let updatedFlow = flow;
    if (Object.keys(patch).length) {
      updatedFlow = await this.flows.update(flow_id, patch, { transaction: t });
    }
    // 3) deletes
    if (Array.isArray(deletes.action_ids) && deletes.action_ids.length) {
      await this.actions.bulkDeleteByIds(deletes.action_ids, { transaction: t });
    }
    if (Array.isArray(deletes.trigger_ids) && deletes.trigger_ids.length) {
      await this.triggers.bulkDeleteByIds(deletes.trigger_ids, { transaction: t });
    }
    // 4) upserts TRIGGERS
    const outTriggers = [];
    const triggerIdMap = new Map(); // oldId -> newId (nếu create mới)

    if (Array.isArray(upserts.triggers)) {
      for (const tItem of upserts.triggers) {
        const payload = {
          flow_id,
          event_type: tItem.event_type || 'event',
          conditions: tItem.conditions || {},
          is_active: tItem.is_active !== false,
        };

        if (tItem.trigger_id) {
          const updated = await this.triggers.update(tItem.trigger_id, payload, { transaction: t });
          if (updated) {
            outTriggers.push(updated);
            triggerIdMap.set(tItem.trigger_id, updated.trigger_id);
          }
        } else {
          const created = await this.triggers.create(payload, { transaction: t });
          outTriggers.push(created);
          triggerIdMap.set(tItem.trigger_id || null, created.trigger_id);
        }
      }
    }
    // 5) upserts ACTIONS
    const outActions = [];
    if (Array.isArray(upserts.actions)) {
      for (const aItem of upserts.actions) {
        const delay = Number.isFinite(aItem.delay_minutes)
          ? aItem.delay_minutes
          : parseInt(aItem.delay_minutes, 10) || 0;

        const scheduled_for =
          delay > 0 ? new Date(Date.now() + delay * 60000) : (aItem.scheduled_for || null);

        // nếu action tham chiếu trigger_id “cũ” vừa create ở trên, map sang id mới
        let trigger_id = aItem.trigger_id || null;
        if (trigger_id && triggerIdMap.has(trigger_id)) {
          trigger_id = triggerIdMap.get(trigger_id);
        }

        const payload = {
          flow_id,
          trigger_id,
          action_type: aItem.action_type || 'custom',
          channel: aItem.channel || null,
          content: aItem.content || {},
          order_index: Number.isInteger(aItem.order_index) ? aItem.order_index : 0,
          branch_key: aItem.branch_key ?? null,
          delay_minutes: delay,
          scheduled_for,
          status: aItem.status || 'pending',
        };

        if (aItem.action_id) {
          const updated = await this.actions.update(aItem.action_id, payload, { transaction: t });
          if (updated) outActions.push(updated);
        } else {
          const created = await this.actions.create(payload, { transaction: t });
          outActions.push(created);
        }
      }
    }
    return { flow: updatedFlow, triggers: outTriggers, actions: outActions };
  });
}
async getFlowDetail(flow_id) {
    const flow = await this.getFlow(flow_id);
    const [triggers, actions] = await Promise.all([
      this.triggers.findByFlow(flow_id),
      this.actions.findByFlow(flow_id),
    ]);
    if (!flow) throw Object.assign(new Error('Flow not found'), { status: 404 });
    const merged = { flow, triggers, actions };
  return merged;
}
async publishFlow(flow_id, dto) {
    const flow = await this.flows.findById(flow_id);
    if (!flow) throw Object.assign(new Error('Flow not found'), { status: 404 });
    if (!flow.name) throw Object.assign(new Error('Name is required'), { status: 400 });

    if (dto?.simulate) {
      return { ok: true, flow_id, status: 'SIMULATED' };
    }
    const updated = await this.flows.update(flow_id, { status: 'ACTIVE' });
    return { ok: true, flow: updated };
  }
  _pickFlowPayload(obj) {
    const allowed = [
      'name',
      'description',
      'enabled',
      'created_by',
      'tags',
      'status',
      'created_at',
      'updated_at',
    ];
    const out = {};
    for (const k of allowed) {
      if (obj[k] !== undefined) out[k] = obj[k];
    }
    if (out.description == null) out.description = '';
    if (out.enabled == null) out.enabled = true;
    if (out.tags && !Array.isArray(out.tags)) out.tags = [out.tags];
    if (!out.tags) out.tags = [];
    return out;
  }
  _buildTriggerForSchema({ flow_id, trigger_type, trigger_config }) {
    const tt = String(trigger_type).toLowerCase();
    if (tt === 'cron') {
      const cfg = trigger_config || {};
      return {
        flow_id,
        event_type: 'cron',
        conditions: {
          expression: cfg.expression || '*/5 * * * *',
          timezone: cfg.timezone || 'UTC',
          ...cfg,
        },
        is_active: cfg.is_active !== undefined ? !!cfg.is_active : true,
        created_at: new Date(),
      };
    }
    // if (tt === 'webhook') {
    //   const cfg = trigger_config || {};
    //   return {
    //     flow_id,
    //     event_type: 'webhook',
    //     conditions: {
    //       secret: cfg.secret ?? null,
    //       ip_whitelist: Array.isArray(cfg.ip_whitelist) ? cfg.ip_whitelist : [],
    //       ...cfg,
    //     },
    //     is_active: cfg.is_active !== undefined ? !!cfg.is_active : true,
    //     created_at: new Date(),
    //   };
    // }
  //   if (tt === 'tags') {
  //   const tags = Array.isArray(cfg.tags)
  //     ? cfg.tags.map(String)
  //     : (cfg.tags ? [String(cfg.tags)] : []);
  //   const target_type = (cfg.target_type === 'lead') ? 'lead' : 'customer';
  //   const selector = (cfg.selector && typeof cfg.selector === 'object') ? cfg.selector : {};
  //   return {
  //     flow_id,
  //     event_type: 'tags',
  //     conditions: {
  //       target_type,
  //       selector,
  //       tags
  //     },
  //     is_active,
  //     created_at: new Date()
  //   };
  //  }
    if (tt === 'targeted_condition') {
    const cfg = trigger_config || {};
    return {
      flow_id,
      event_type: 'targeted_condition',
      conditions: {
        target: cfg.target || 'customer',
        operator: cfg.operator || 'equals',
        field: cfg.field || 'tags',
        value: cfg.value || '',
        ...cfg,
      },
      is_active,
      created_at: new Date()
    };
   }
   
  // ——— Trigger: interval (mỗi N giây/phút/giờ) ———
  if (tt === 'interval') {
    const unit = ['seconds', 'minutes', 'hours', 'days'].includes(restCfg.unit)
      ? restCfg.unit
      : 'minutes';
    const every = Math.max(1, asNumber(restCfg.every, 5));

    return {
      flow_id,
      event_type: 'interval',
      conditions: {
        every,
        unit,
        jitter: asNumber(restCfg.jitter, 0), // optional: giãn ngẫu nhiên
        ...pick(restCfg, ['start_at', 'end_at', 'max_runs']),
      },
      is_active,
      created_at: now,
    };
  }
  // ——— Trigger: schedule_at (một lần vào thời điểm cụ thể) ———
  if (tt === 'schedule_at') {
    const run_at = asDate(restCfg.run_at);
    return {
      flow_id,
      event_type: 'schedule_at',
      conditions: {
        run_at,
        timezone: asString(restCfg.timezone, 'UTC'),
        allow_past: asBool(restCfg.allow_past, false),
      },
      is_active,
      created_at: now,
    };
  }
  // ——— Trigger: inactivity (không có hoạt động trong khoảng thời gian) ———
  if (tt === 'inactivity') {
    const duration = asNumber(restCfg.duration_seconds ?? restCfg.duration, 3600);
    return {
      flow_id,
      event_type: 'inactivity',
      conditions: {
        duration_seconds: duration,
        since_field: asString(restCfg.since_field, 'last_active_at'),
        target: asString(restCfg.target, 'customer'),
        ...pick(restCfg, ['selector']),
      },
      is_active,
      created_at: now,
    };
  }

  // ——— Trigger: threshold (vượt ngưỡng số học) ———
  if (tt === 'threshold') {
    return {
      flow_id,
      event_type: 'threshold',
      conditions: {
        target: asString(restCfg.target, 'customer'),
        field: asString(restCfg.field, 'score'),
        operator: asString(restCfg.operator, '>='),
        threshold: asNumber(restCfg.threshold, 0),
        window_seconds: asNumber(restCfg.window_seconds, 0),
        ...pick(restCfg, ['selector']),
      },
      is_active,
      created_at: now,
    };
  }
    const cfg = trigger_config || {};
    return {
      flow_id,
      event_type: cfg.event_type || tt || 'event',
      conditions: {
        ...(cfg.filters ? { filters: cfg.filters } : {}),
        ...cfg,
      },
      is_active: cfg.is_active !== undefined ? !!cfg.is_active : true,
      created_at: new Date(),
    };
  }
  
  _buildActionForSchema({ flow_id, action_type, action_config }) {
    const at = String(action_type).toLowerCase();
    const cfg = action_config || {};

    const delay_minutes = Number.isFinite(cfg.delay_minutes)
      ? cfg.delay_minutes
      : parseInt(cfg.delay_minutes, 10) || 0;

    const status = cfg.status || 'pending';

    if (at === 'email') {
      return {
        flow_id,
        trigger_id: cfg.trigger_id || null,
        action_type: 'email',
        channel: 'email',
        content: {
          to: Array.isArray(cfg.to) ? cfg.to : (cfg.to ? [cfg.to] : []),
          subject: cfg.subject || 'Automation Notification',
          html: cfg.html || '<p>Hello from Automation</p>',
          template_id: cfg.template_id || null,
          params: cfg.params || {},
        },
        delay_minutes,
        status,
        created_at: new Date(),
        executed_at: null,
      };
    }

    // if (at === 'webhook') {
    //   return {
    //     flow_id,
    //     trigger_id: cfg.trigger_id || null,
    //     action_type: 'webhook',
    //     channel: 'webhook',
    //     content: {
    //       method: (cfg.method || 'POST').toUpperCase(),
    //       url: cfg.url || 'https://example.com/hook',
    //       headers: cfg.headers || {},
    //       body: cfg.body ?? { flow_id, timestamp: '{{now}}' },
    //       timeout_ms: cfg.timeout_ms || 10000,
    //     },
    //     delay_minutes,
    //     status,
    //     created_at: new Date(),
    //     executed_at: null,
    //   };
    // }

    if (at === 'sms') {
      return {
        flow_id,
        trigger_id: cfg.trigger_id || null,
        action_type: 'sms',
        channel: 'sms',
        content: {
          to: Array.isArray(cfg.to) ? cfg.to : (cfg.to ? [cfg.to] : []),
          text: cfg.text || 'Hi from Automation',
          provider: cfg.provider || 'default',
        },
        delay_minutes,
        status,
        created_at: new Date(),
        executed_at: null,
      };
    }

    if (at === 'push') {
      return {
        flow_id,
        trigger_id: cfg.trigger_id || null,
        action_type: 'push',
        channel: 'push',
        content: {
          title: cfg.title || 'Notification',
          body: cfg.body || 'Hello!',
          data: cfg.data || {},
        },
        delay_minutes,
        status,
        created_at: new Date(),
        executed_at: null,
      };
    }

    // if (at === 'tag_update') {
    //   return {
    //     flow_id,
    //     trigger_id: cfg.trigger_id || null,
    //     action_type: 'tag_update',
    //     channel: 'internal',
    //     content: {
    //       op: cfg.op || 'add',
    //       tags: Array.isArray(cfg.tags) ? cfg.tags : (cfg.tags ? [cfg.tags] : []),
    //     },
    //     delay_minutes,
    //     status,
    //     created_at: new Date(),
    //     executed_at: null,
    //   };
    // }

    // if (at === 'create_task') {
    //   return {
    //     flow_id,
    //     trigger_id: cfg.trigger_id || null,
    //     action_type: 'create_task',
    //     channel: 'internal',
    //     content: {
    //       assignee: cfg.assignee || null,
    //       title: cfg.title || 'New Task',
    //       description: cfg.description || '',
    //       due_at: cfg.due_at || null,
    //     },
    //     delay_minutes,
    //     status,
    //     created_at: new Date(),
    //     executed_at: null,
    //   };
    // }

    if (at === 'delay') {
      return {
        flow_id,
        trigger_id: cfg.trigger_id || null,
        action_type: 'delay',
        channel: 'internal',
        content: {
          note: cfg.note || 'delay',
        },
        delay_minutes: delay_minutes || (cfg.minutes || 0),
        status,
        created_at: new Date(),
        executed_at: null,
      };
    }

    return {
      flow_id,
      trigger_id: cfg.trigger_id || null,
      action_type: at,
      channel: cfg.channel || null,
      content: cfg.content || {},
      delay_minutes,
      status,
      created_at: new Date(),
      executed_at: null,
    };
  }

  async getFlow(flow_id) {
    const f = await this.flows.findById(flow_id);
    if (!f) throw new Error('Flow not found');
    return f;
  }

  async listFlows(params) {
    return await this.flows.findAll(params);
  }

  async updateFlow(flow_id, patch) {
    const f = await this.flows.update(flow_id, patch);
    if (!f) throw new Error('Flow not found');
    return f;
  }

  async deleteFlow(flow_id) {
    await this.flows.delete(flow_id);
  }

  async setEnabled(flow_id, enabled) {
    const f = await this.flows.toggle(flow_id, enabled);
    if (!f) throw new Error('Flow not found');
    return f;
  }

  
}

module.exports = new AutomationFlowService();
