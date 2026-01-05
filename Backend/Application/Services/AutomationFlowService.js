// backend/src/Application/services/AutomationFlowService.js
/* eslint-disable camelcase */
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

const AutomationFlowRepository = require('../../Infrastructure/Repositories/AutomationFlowRepository.js');
const AutomationTriggerRepository = require('../../Infrastructure/Repositories/AutomationTriggerRepository.js');
const AutomationActionRepository = require('../../Infrastructure/Repositories/AutomationActionRepository.js');
const {
  AutomationFlowResponseDTO,
  TriggerResponseDTO,
  ActionResponseDTO
} = require('../DTOs/AutomationDTO.js');

class AutomationFlowService {
  constructor() {
    this.flows = AutomationFlowRepository;
    this.triggers = AutomationTriggerRepository;
    this.actions = AutomationActionRepository;
  }

  // =========================
  // Create flow (simple)
  // - Bỏ _buildTriggerForSchema (không còn DSL trigger_type)
  // - Hỗ trợ tương thích: trigger_type/action_type (legacy) nhưng map thẳng sang event_type/action_type
  // =========================
  async createFlow(dto = {}) {
    try {
      const {
        // legacy inputs (vẫn support)
        trigger_type,
        trigger_config = {},
        action_type,
        action_config = {},

        // recommended inputs (new)
        trigger, // { event_type, conditions, is_active }
        action, // { action_type, channel, content, order_index, delay_minutes, status, trigger_id? }

        ...rest
      } = dto || {};

      if (!rest?.name || !String(rest.name).trim()) {
        throw new AppError('name is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      const flowPayload = this._pickFlowPayload(rest);

      const aggregated = await sequelize.transaction(async (t) => {
        // 1) create flow
        const flow = await this.flows.create(flowPayload, { transaction: t });
        if (!flow) {
          throw new AppError('Tạo flow thất bại', { status: 500, code: 'CREATE_FLOW_FAILED' });
        }

        const flow_id = flow.flow_id ?? flow.id;

        const out = {
          flow_id,
          flow,
          triggers: [],
          actions: [],
          trigger_ids: [],
          action_ids: [],
        };

        // 2) create trigger (optional)
        let newTrigger = null;

        // preferred: dto.trigger
        const trigInput = trigger || (trigger_type ? { event_type: trigger_config.event_type || trigger_type, ...trigger_config } : null);

        if (trigInput) {
          const trigPayload = {
            flow_id,
            event_type: trigInput.event_type,
            conditions: trigInput.conditions || trigInput.filters || trigInput.condition || {},
            is_active: trigInput.is_active !== false,
          };

          if (!trigPayload.event_type || !String(trigPayload.event_type).trim()) {
            throw new AppError('trigger.event_type is required', { status: 400, code: 'VALIDATION_ERROR' });
          }

          newTrigger = await this.triggers.create(trigPayload, { transaction: t });
          if (!newTrigger) {
            throw new AppError('Tạo trigger thất bại', { status: 500, code: 'CREATE_TRIGGER_FAILED' });
          }

          const trigId = newTrigger.trigger_id ?? newTrigger.id;
          out.triggers.push(newTrigger);
          out.trigger_ids.push(trigId);
        }

        // 3) create action (optional)
        // preferred: dto.action
        const actInput = action || (action_type ? { action_type, ...action_config } : null);

        if (actInput) {
          const actPayload = this._buildActionForSchema({
            flow_id,
            trigger_id: actInput.trigger_id || (newTrigger ? (newTrigger.trigger_id ?? newTrigger.id) : null),
            action_type: actInput.action_type,
            channel: actInput.channel,
            content: actInput.content || actInput, // nếu truyền thẳng config
            order_index: actInput.order_index,
            delay_minutes: actInput.delay_minutes,
            status: actInput.status,
          });

          const saved = await this.actions.create(actPayload, { transaction: t });
          if (!saved) {
            throw new AppError('Tạo action thất bại', { status: 500, code: 'CREATE_ACTION_FAILED' });
          }

          const actId = saved.action_id ?? saved.id;
          out.actions.push(saved);
          out.action_ids.push(actId);
        }

        return out;
      });

      return ok(aggregated);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CREATE_FLOW_FAILED' }));
    }
  }

  // =========================
  // Editor save (upsert/delete)
  // Lưu theo đúng 3 bảng:
  // - automation_flows
  // - automation_triggers (event_type + conditions)
  // - automation_actions (action_type + channel + content + delay_minutes + order_index + status)
  // =========================
  async saveEditor(flow_id, dto = {}) {
    try {
      if (!flow_id) {
        throw new AppError('flow_id is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      const { flow_meta = {}, upserts = {}, deletes = {}, isNewRecord = true } = dto || {};

      // autosave check
      if (!isNewRecord) {
        return ok({ message: 'No changes detected, skipping autosave', updated: false });
      }

      const result = await sequelize.transaction(async (t) => {
        const flow = await this.flows.findById(flow_id, { transaction: t });
        if (!flow) {
          throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
        }

        // 1) patch flow_meta
        const patch = this._syncStatus(flow_meta, flow.status);

        let updatedFlow = flow;
        if (Object.keys(patch).length > 0) {
          updatedFlow = await this.flows.update(flow_id, patch, { transaction: t });
        }

        // 2) deletes
        if (Array.isArray(deletes.trigger_ids) && deletes.trigger_ids.length > 0) {
          await this.triggers.bulkDeleteByIds(deletes.trigger_ids, { transaction: t });
        }
        if (Array.isArray(deletes.action_ids) && deletes.action_ids.length > 0) {
          await this.actions.bulkDeleteByIds(deletes.action_ids, { transaction: t });
        }

        // 3) upserts triggers
        // map temp-id -> new-id (để action tham chiếu)
        const triggerIdMap = new Map();
        const outTriggers = [];

        if (Array.isArray(upserts.triggers) && upserts.triggers.length > 0) {
          for (const trig of upserts.triggers) {
            const payload = {
              flow_id,
              event_type: trig.event_type,
              conditions: trig.conditions || {},
              is_active: trig.is_active !== false,
            };

            if (!payload.event_type || !String(payload.event_type).trim()) {
              throw new AppError('trigger.event_type is required', { status: 400, code: 'VALIDATION_ERROR' });
            }

            let saved;
            if (trig.trigger_id) {
              saved = await this.triggers.update(trig.trigger_id, payload, { transaction: t });
            } else {
              saved = await this.triggers.create(payload, { transaction: t });
            }

            if (saved) {
              const newId = saved.trigger_id || saved.id;
              // Nếu client có gửi temp_id thì map temp_id -> newId
              if (trig.temp_id) triggerIdMap.set(trig.temp_id, newId);
              // Nếu client dùng trigger_id cũ dạng temp (string) thì cũng map
              if (trig.trigger_id) triggerIdMap.set(trig.trigger_id, newId);

              outTriggers.push(saved);
            }
          }
        }

        // 4) upserts actions
        const outActions = [];

        if (Array.isArray(upserts.actions) && upserts.actions.length > 0) {
          for (const act of upserts.actions) {
            const delay = Number.isFinite(act.delay_minutes)
              ? act.delay_minutes
              : parseInt(act.delay_minutes, 10) || 0;

            // trigger_id mapping (temp -> real)
            let trigger_id = act.trigger_id || null;
            if (trigger_id && triggerIdMap.has(trigger_id)) {
              trigger_id = triggerIdMap.get(trigger_id);
            }

            const payload = {
              flow_id,
              trigger_id,
              action_type: act.action_type,
              channel: act.channel || null,
              content: act.content || {},
              order_index: Number.isInteger(act.order_index) ? act.order_index : 0,
              delay_minutes: delay,
              status: act.status || 'pending',
              // executed_at chỉ set khi runner chạy; editor không set
              executed_at: act.executed_at ?? null,
            };

            if (!payload.action_type || !String(payload.action_type).trim()) {
              throw new AppError('action.action_type is required', { status: 400, code: 'VALIDATION_ERROR' });
            }

            let saved;
            if (act.action_id) {
              saved = await this.actions.update(act.action_id, payload, { transaction: t });
            } else {
              saved = await this.actions.create(payload, { transaction: t });
            }

            if (saved) outActions.push(saved);
          }
        }

        return { flow: updatedFlow, triggers: outTriggers, actions: outActions, updated: true };
      });

      return ok(result);
    } catch (err) {
      console.error('saveEditor error:', err);
      return fail(asAppError(err, { code: 'SAVE_EDITOR_FAILED' }));
    }
  }

  // =========================
  // Read
  // =========================
  async getFlow(flow_id) {
    const f = await this.flows.findById(flow_id);
    if (!f) throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
    return f;
  }

  async getFlowDetail(flow_id) {
    try {
      const flow = await this.getFlow(flow_id);

      const [triggers, actions] = await Promise.all([
        this.triggers.findByFlow(flow_id),
        this.actions.findByFlow(flow_id),
      ]);

      return ok({ flow, triggers, actions });
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async getAllflow() {
    try {
      const flows = await this.flows.findAll();
      const items = Array.isArray(flows) ? flows : (flows?.items || []);
      if (!items.length) return ok({ items: [] });

      const details = await Promise.all(
        items.map(async (f) => {
          const fid = f.flow_id || f.id;
          const detail = await this.getFlowDetail(fid);

          if (detail?.ok && detail.data?.flow) {
            const { flow, triggers = [], actions = [] } = detail.data;
            return new AutomationFlowResponseDTO({
              ...(typeof flow.toJSON === 'function' ? flow.toJSON() : flow),
              triggers: triggers.map((t) => (t.toJSON ? t.toJSON() : t)),
              actions: actions.map((a) => (a.toJSON ? a.toJSON() : a)),
            });
          }

          return new AutomationFlowResponseDTO({
            ...(f.toJSON ? f.toJSON() : f),
            triggers: [],
            actions: []
          });
        })
      );

      return ok({ items: details });
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  // =========================
  // Publish / Activate
  // =========================
  async publishFlow(flow_id, dto = {}) {
    try {
      const flow = await this.flows.findById(flow_id);
      if (!flow) {
        throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
      }
      if (!flow.name || !String(flow.name).trim()) {
        throw new AppError('Name is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

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

      const current = String(flow.status || '').toLowerCase();
      if (current === 'active') return ok({ flow, alreadyActive: true });

      if (dto?.simulate) {
        return ok({ flow_id, status: 'SIMULATED', publish_to: 'active', issues: [] });
      }

      const updated = await this.flows.update(flow_id, { status: 'active', enabled: true });
      if (!updated) {
        throw new AppError('Failed to update flow status', { status: 500, code: 'UPDATE_FLOW_FAILED' });
      }

      return ok({ flow: updated });
    } catch (err) {
      return fail(asAppError(err));
    }
  }
  async setStatusActive(flow_id) {
    try {
      if (!flow_id) {
        throw new AppError('flow_id is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      const flow = await this.flows.findById(flow_id);
      if (!flow) {
        throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
      }

      const current = String(flow.status || '').toLowerCase();
      if (current === 'active') return ok({ flow, alreadyActive: true });

      if (current && !['draft', 'pending', 'inactive'].includes(current)) {
        throw new AppError(`Cannot activate flow from status=${flow.status}`, {
          status: 400,
          code: 'INVALID_STATUS_TRANSITION',
        });
      }

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

      const updated = await this.flows.update(flow_id, { status: 'active', enabled: true });
      if (!updated) {
        throw new AppError('Failed to update flow status', { status: 500, code: 'UPDATE_FLOW_FAILED' });
      }

      return ok({ flow: updated });
    } catch (err) {
      return fail(asAppError(err, { code: 'ACTIVATE_FLOW_FAILED' }));
    }
  }
  async listFlows(params) {
    return await this.flows.findAll(params);
  }
  async updateFlow(flow_id, patch) {
    const flow = await this.flows.findById(flow_id);
    if (!flow) throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });

    const syncedPatch = this._syncStatus(patch, flow.status);
    const f = await this.flows.update(flow_id, syncedPatch);
    return f;
  }

  async deleteFlow(flow_id) {
    await this.flows.delete(flow_id);
    return ok({ deleted: true });
  }
  async setEnabled(flow_id, enabled) {
    const status = enabled ? 'active' : 'inactive';
    const f = await this.flows.update(flow_id, { enabled, status });
    if (!f) throw new AppError('Flow not found', { status: 404, code: 'FLOW_NOT_FOUND' });
    return ok({ flow: f });
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

    // Mới tạo thì mặc định là DRAFT và ENABLED=FALSE
    if (out.enabled == null) out.enabled = false;
    if (!out.status) out.status = 'draft';

    // Đảm bảo đồng bộ ngay từ đầu
    const synced = this._syncStatus(out, 'draft');

    if (synced.tags && !Array.isArray(synced.tags)) synced.tags = [synced.tags];
    if (!synced.tags) synced.tags = [];

    return synced;
  }

  _syncStatus(dtoPatch, currentStatus) {
    const patch = { ...dtoPatch };
    const status = String(patch.status || currentStatus || '').toLowerCase();

    if (typeof patch.enabled === 'boolean') {
      // Nếu tắt ngang xương mà đang active thì chuyển inactive
      if (patch.enabled === false && status === 'active') {
        patch.status = 'inactive';
      }
      // Nếu bật lại? Ta không tự ý active vì cần trigger check, 
      // Nhưng nếu status đang là inactive và enabled=true thì có thể coi là resume.
    }

    if (typeof patch.status === 'string') {
      const nextStatus = patch.status.toLowerCase();
      if (nextStatus === 'active') {
        patch.enabled = true;
      } else if (['inactive', 'draft'].includes(nextStatus)) {
        patch.enabled = false;
      }
    }

    return patch;
  }

  _buildActionForSchema({
    flow_id,
    trigger_id = null,
    action_type,
    channel = null,
    content = {},
    order_index = 0,
    delay_minutes = 0,
    status = 'pending',
  }) {
    const delay =
      Number.isFinite(delay_minutes) ? delay_minutes : parseInt(delay_minutes, 10) || 0;

    return {
      flow_id,
      trigger_id,
      action_type: String(action_type || '').trim(),
      channel,
      content: content || {},
      order_index: Number.isInteger(order_index) ? order_index : 0,
      delay_minutes: delay,
      status: status || 'pending',
      executed_at: null,
    };
  }
}

module.exports = new AutomationFlowService();
