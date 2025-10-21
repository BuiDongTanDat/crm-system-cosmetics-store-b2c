// backend/src/Application/services/AutomationFlowService.js
/* eslint-disable camelcase */
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');
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
    try {
      const {
        trigger_type,
        trigger_config = {},
        action_type,
        action_config = {},
        ...rest
      } = dto || {};

      if (!rest?.name || !String(rest.name).trim()) {
        throw new AppError('name is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      const flowPayload = this._pickFlowPayload(rest);

      const aggregated = await sequelize.transaction(async (t) => {
        // 1) tạo flow
        const flow = await this.flows.create(flowPayload, { transaction: t });
        if (!flow) {
          throw new AppError('Tạo flow thất bại', { status: 500, code: 'CREATE_FLOW_FAILED' });
        }
        const flow_id = flow.flow_id ?? flow.id;

        const out = {
          flow_id,
          flow,
          trigger_ids: [],
          action_ids: [],
          triggers: [],
          actions: [],
        };

        // 2) trigger (optional)
        let newTrigger = null;
        if (trigger_type) {
          const trigPayload = this._buildTriggerForSchema({ flow_id, trigger_type, trigger_config });
          newTrigger = await this.triggers.create(trigPayload, { transaction: t });
          if (!newTrigger) {
            throw new AppError('Tạo trigger thất bại', { status: 500, code: 'CREATE_TRIGGER_FAILED' });
          }
          const trigId = newTrigger.trigger_id ?? newTrigger.id;
          out.triggers.push(newTrigger);
          out.trigger_ids.push(trigId);
        }

        // 3) action (optional)
        if (action_type) {
          const actPayload = this._buildActionForSchema({
            flow_id,
            action_type,
            action_config,
            trigger_id: newTrigger?.trigger_id ?? newTrigger?.id ?? undefined,
          });
          if (!actPayload.flow_id) actPayload.flow_id = flow_id;
          if (!actPayload.trigger_id && newTrigger) {
            actPayload.trigger_id = newTrigger.trigger_id ?? newTrigger.id;
          }

          const action = await this.actions.create(actPayload, { transaction: t });
          if (!action) {
            throw new AppError('Tạo action thất bại', { status: 500, code: 'CREATE_ACTION_FAILED' });
          }
          const actId = action.action_id ?? action.id;
          out.actions.push(action);
          out.action_ids.push(actId);
        }
        return out;
      });
      return ok(aggregated);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CREATE_FLOW_FAILED' }));
    }
  }
  async saveEditor(flow_id, dto = {}) {
    try {
      // Validate cơ bản
      if (!flow_id) {
        throw new AppError('flow_id is required', {
          status: 400,
          code: 'VALIDATION_ERROR',
        });
      }

      const { flow_meta = {}, upserts = {}, deletes = {}, isNewRecord = true } = dto;

      // Nếu không có thay đổi gì (autosave check)
      if (!isNewRecord) {
        return ok({
          message: 'No changes detected, skipping autosave',
          updated: false,
        });
      }

      //  Thực hiện transaction
      const result = await sequelize.transaction(async (t) => {
        // Tìm flow
        const flow = await this.flows.findById(flow_id, { transaction: t });
        if (!flow) {
          throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
        }

        // Update flow metadata nếu có
        const patch = {};
        if (typeof flow_meta.name === 'string') patch.name = flow_meta.name;
        if (typeof flow_meta.description === 'string') patch.description = flow_meta.description;
        if (Array.isArray(flow_meta.tags)) patch.tags = flow_meta.tags;
        if (typeof flow_meta.status === 'string') patch.status = flow_meta.status;

        let updatedFlow = flow;
        if (Object.keys(patch).length > 0) {
          updatedFlow = await this.flows.update(flow_id, patch, { transaction: t });
        }

        // Delete triggers/actions nếu có
        if (Array.isArray(deletes.trigger_ids) && deletes.trigger_ids.length > 0) {
          await this.triggers.bulkDeleteByIds(deletes.trigger_ids, { transaction: t });
        }
        if (Array.isArray(deletes.action_ids) && deletes.action_ids.length > 0) {
          await this.actions.bulkDeleteByIds(deletes.action_ids, { transaction: t });
        }

        // Upsert triggers
        const triggerIdMap = new Map();
        const outTriggers = [];

        if (Array.isArray(upserts.triggers) && upserts.triggers.length > 0) {
          for (const trigger of upserts.triggers) {
            const payload = {
              flow_id,
              event_type: trigger.event_type || 'event',
              conditions: trigger.conditions || {},
              is_active: trigger.is_active !== false,
            };

            let savedTrigger;
            if (trigger.trigger_id) {
              savedTrigger = await this.triggers.update(trigger.trigger_id, payload, { transaction: t });
            } else {
              savedTrigger = await this.triggers.create(payload, { transaction: t });
            }

            if (savedTrigger) {
              const newId = savedTrigger.trigger_id || savedTrigger.id;
              triggerIdMap.set(trigger.trigger_id || null, newId);
              outTriggers.push(savedTrigger);
            }
          }
        }

        // Upsert actions
        const outActions = [];

        if (Array.isArray(upserts.actions) && upserts.actions.length > 0) {
          for (const action of upserts.actions) {
            const delay = Number.isFinite(action.delay_minutes)
              ? action.delay_minutes
              : parseInt(action.delay_minutes, 10) || 0;

            const scheduled_for =
              delay > 0 ? new Date(Date.now() + delay * 60000) : action.scheduled_for || null;

            // Map trigger_id cũ → mới nếu có
            let trigger_id = action.trigger_id || null;
            if (trigger_id && triggerIdMap.has(trigger_id)) {
              trigger_id = triggerIdMap.get(trigger_id);
            }

            const payload = {
              flow_id,
              trigger_id,
              action_type: action.action_type || 'custom',
              channel: action.channel || null,
              content: action.content || {},
              order_index: Number.isInteger(action.order_index) ? action.order_index : 0,
              branch_key: action.branch_key ?? null,
              delay_minutes: delay,
              scheduled_for,
              status: action.status || 'pending',
            };

            let savedAction;
            if (action.action_id) {
              savedAction = await this.actions.update(action.action_id, payload, { transaction: t });
            } else {
              savedAction = await this.actions.create(payload, { transaction: t });
            }

            if (savedAction) {
              outActions.push(savedAction);
            }
          }
        }
        return {
          flow: updatedFlow,
          triggers: outTriggers,
          actions: outActions,
          updated: true,
        };
      });

      return ok(result);
    } catch (err) {
      console.error(' saveEditor error:', err);
      return fail(asAppError(err, { code: 'SAVE_EDITOR_FAILED' }));
    }
  }
  async getFlowDetail(flow_id) {
    try {
      // 1) lấy flow
      const flow = await this.getFlow(flow_id); // giả định có thể trả null hoặc ném lỗi
      if (!flow) {
        throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
      }

      // 2) lấy triggers & actions song song
      const [triggers, actions] = await Promise.all([
        this.triggers.findByFlow(flow_id),
        this.actions.findByFlow(flow_id),
      ]);

      // 3) trả data chuẩn
      return ok({ flow, triggers, actions });
    } catch (err) {
      return fail(asAppError(err));
    }
  }
  async getAllflow(){
    return await this.flows.findAll();
  }
  async publishFlow(flow_id, dto = {}) {
    try {
      // 1) lấy flow
      const flow = await this.flows.findById(flow_id);
      if (!flow) {
        throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
      }
      if (!flow.name || !String(flow.name).trim()) {
        throw new AppError('Name is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      // 2) kiểm tra tối thiểu về cấu trúc trước khi publish
      const [triggers, actions] = await Promise.all([
        this.triggers.findByFlow(flow_id),
        this.actions.findByFlow(flow_id),
      ]);

      if (!Array.isArray(triggers) || triggers.length === 0) {
        throw new AppError('At least one trigger is required', { status: 400, code: 'NO_TRIGGER' });
      }
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new AppError('At least one action is required', { status: 400, code: 'NO_ACTION' });
      }

      // 3) nếu flow đã active thì trả luôn (idempotent)
      const isActive =
        typeof flow.status === 'string' && flow.status.toLowerCase() === 'active';
      if (isActive) {
        return ok({ flow, alreadyActive: true });
      }

      // 4) simulate (dry-run) không ghi DB
      if (dto?.simulate) {
        return ok({
          flow_id,
          status: 'SIMULATED',
          publish_to: 'active',
          issues: [], // có thể đính kèm warning nếu bạn muốn
        });
      }

      // 5) cập nhật trạng thái -> active
      const updated = await this.flows.update(flow_id, { status: 'active' });
      if (!updated) {
        throw new AppError('Failed to update flow status', {
          status: 500,
          code: 'UPDATE_FLOW_FAILED',
        });
      }

      return ok({ flow: updated });
    } catch (err) {
      return fail(asAppError(err));
    }
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
