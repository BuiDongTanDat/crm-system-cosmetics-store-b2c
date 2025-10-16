// backend/src/Application/dto/AutomationFlowDTO.js
// DTO-only: KHÔNG dùng Joi, KHÔNG validate schema — chỉ ép kiểu nhẹ & whitelist.

class HttpBadRequest extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'HttpBadRequest';
    this.statusCode = 400;
    this.details = details;
  }
}

/* ---------- helpers (ép kiểu rất nhẹ) ---------- */
const asString = (v, def = undefined) =>
  v == null ? def : (typeof v === 'string' ? v : String(v));

const asBool = (v, def = undefined) => {
  if (v == null) return def;
  if (typeof v === 'boolean') return v;
  if (v === '1' || v === 1 || v === 'true') return true;
  if (v === '0' || v === 0 || v === 'false') return false;
  return def;
};

const asObject = (v, def = undefined) =>
  v && typeof v === 'object' && !Array.isArray(v) ? v : def;

const asStringArray = (v, def = undefined) => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    return v.split(',').map(s => s.trim()).filter(Boolean);
  }
  return def;
};

const stripNullish = (obj) => {
  Object.keys(obj).forEach(k => (obj[k] == null ? delete obj[k] : 0));
  return obj;
};

/* ---------- Request DTOs (NO validation) ---------- */

class CreateFlowRequestDTO {
  constructor({
    name,
    description = '',
    tags = [],
    trigger_type = null,
    trigger_config = null,
    action_type = null,
    action_config = null,
  } = {}) {
    this.name = asString(name);
    this.description = asString(description, '');
    this.tags = asStringArray(tags, []);
    this.trigger_type = asString(trigger_type);
    this.trigger_config = asObject(trigger_config, {});
    this.action_type = asString(action_type);
    this.action_config = asObject(action_config, {});
  }
  static from(body = {}) {
    // Không validate bắt buộc name — tuỳ service xử lý nếu cần
    return new CreateFlowRequestDTO(body);
  }
}

class UpdateFlowRequestDTO {
  constructor(patch = {}) {
    const obj = {
      name: asString(patch.name),
      description: asString(patch.description),
      enabled: asBool(patch.enabled),
      created_by: asString(patch.created_by),
      tags: asStringArray(patch.tags),
      status: asString(patch.status),
    };
    stripNullish(obj);
    Object.assign(this, obj);
  }
  static from(patch = {}) { return new UpdateFlowRequestDTO(patch); }
}

class CreateTriggerRequestDTO {
  constructor({ trigger_type, trigger_config = {} } = {}) {
    this.trigger_type = asString(trigger_type);
    this.trigger_config = asObject(trigger_config, {});
  }
  static from(body = {}) { return new CreateTriggerRequestDTO(body); }
}

class UpdateTriggerRequestDTO {
  constructor(patch = {}) {
    const obj = {
      event_type: asString(patch.event_type),
      conditions: asObject(patch.conditions),
      is_active: asBool(patch.is_active),
      trigger_type: asString(patch.trigger_type),
      trigger_config: asObject(patch.trigger_config),
    };
    stripNullish(obj);
    Object.assign(this, obj);
  }
  static from(body = {}) { return new UpdateTriggerRequestDTO(body); }
}

class CreateActionRequestDTO {
  constructor({ action_type, action_config = {} } = {}) {
    this.action_type = asString(action_type);
    this.action_config = asObject(action_config, {});
  }
  static from(body = {}) { return new CreateActionRequestDTO(body); }
}

class UpdateActionRequestDTO {
  constructor(patch = {}) {
    const obj = {
      action_type: asString(patch.action_type),
      channel: asString(patch.channel),
      content: asObject(patch.content),
      delay_minutes: Number.isInteger(patch.delay_minutes) ? patch.delay_minutes : undefined,
      status: asString(patch.status),
    };
    stripNullish(obj);
    Object.assign(this, obj);
  }
  static from(body = {}) { return new UpdateActionRequestDTO(body); }
}

/* ---------- Response DTOs ---------- */

class AutomationFlowResponseDTO {
  constructor(flow) {
    this.id = flow.flow_id;
    this.name = flow.name;
    this.description = flow.description;
    this.enabled = flow.enabled;
    this.status = flow.status;
    this.tags = flow.tags;
    this.created_by = flow.created_by;
    this.created_at = flow.created_at;
    this.updated_at = flow.updated_at;
    this.triggersid = flow.triggers; // mảng trigger_id
    this.actionsid  = flow.actions;  // mảng action_id
    const trigList = Array.isArray(flow.triggers) ? flow.triggers : [];
    const actList  = Array.isArray(flow.actions)  ? flow.actions  : [];
    this.triggers = trigList.map(t => new TriggerResponseDTO(t));
    this.actions  = actList.map(a => new ActionResponseDTO(a));
  }
}

class TriggerResponseDTO {
  constructor(trigger) {
    this.id = trigger.trigger_id;
    this.flow_id = trigger.flow_id;
    this.event_type = trigger.event_type;
    this.conditions = trigger.conditions;
    this.is_active = trigger.is_active;
    this.created_at = trigger.created_at;
  }
}

class ActionResponseDTO {
  constructor(action) {
    this.id = action.action_id;
    this.flow_id = action.flow_id;
    this.trigger_id = action.trigger_id;
    this.action_type = action.action_type;
    this.channel = action.channel;
    this.delay_minutes = action.delay_minutes;
    this.status = action.status;
    this.executed_at = action.executed_at;
    this.content = action.content;
    this.created_at = action.created_at;
  }
}

class FlowDetailResponseDTO {
  constructor({ flow, triggers = [], actions = [] }) {
    this.flow = new AutomationFlowResponseDTO(flow);
    this.triggers = triggers.map(t => new TriggerResponseDTO(t));
    this.actions = actions.map(a => new ActionResponseDTO(a));
  }
}

/* ---------- SaveEditor / Publish — NO validate ---------- */

class SaveEditorRequestDTO {
  static from(body = {}) {
    // Nếu client đã gửi đúng format cũ -> giữ nguyên (có ép kiểu nhẹ)
    if (body.upserts || body.deletes || body.flow_meta) {
      const flow_meta = asObject(body.flow_meta, {});
      const upserts = asObject(body.upserts, {});
      const deletes = asObject(body.deletes, {});
      return {
        flow_meta: stripNullish({
          name: asString(flow_meta?.name),
          description: asString(flow_meta?.description),
          tags: asStringArray(flow_meta?.tags),
        }),
        upserts: {
          triggers: Array.isArray(upserts?.triggers)
            ? upserts.triggers.map(t => stripNullish({
                trigger_id: asString(t.trigger_id),
                event_type: asString(t.event_type) || 'event',
                is_active: asBool(t.is_active, true),
                conditions: asObject(t.conditions, {}),
              }))
            : [],
          actions: Array.isArray(upserts?.actions)
            ? upserts.actions.map(a => stripNullish({
                action_id: asString(a.action_id),
                trigger_id: asString(a.trigger_id),
                action_type: asString(a.action_type) || 'custom',
                channel: asString(a.channel),
                // chấp nhận cả content (format cũ) và action_config (format mới)
                content: asObject(a.content, asObject(a.action_config, {})) || {},
                delay_minutes: Number.isInteger(a.delay_minutes) ? a.delay_minutes
                              : parseInt(a.delay_minutes, 10) || 0,
                order_index: Number.isInteger(a.order_index) ? a.order_index : 0,
                branch_key: asString(a.branch_key, null),
                status: asString(a.status) || 'pending',
              }))
            : [],
        },
        deletes: {
          trigger_ids: Array.isArray(deletes?.trigger_ids) ? deletes.trigger_ids.map(String) : [],
          action_ids: Array.isArray(deletes?.action_ids) ? deletes.action_ids.map(String) : [],
        }
      };
    }

    // Nếu client gửi format RÚT GỌN (chỉ có triggers/actions) -> tự bọc vào upserts
    const triggers = Array.isArray(body.triggers) ? body.triggers : [];
    const actions  = Array.isArray(body.actions)  ? body.actions  : [];

    const normTriggers = triggers.map(t => stripNullish({
      trigger_id: asString(t.trigger_id),
      event_type: asString(t.event_type) || 'event',
      is_active: asBool(t.is_active, true),
      conditions: asObject(t.conditions, {}),
    }));

    const normActions = actions.map(a => stripNullish({
      action_id: asString(a.action_id),
      trigger_id: asString(a.trigger_id),
      action_type: asString(a.action_type) || 'custom',
      channel: asString(a.channel),
      content: asObject(a.action_config, asObject(a.content, {})) || {},
      delay_minutes: Number.isInteger(a.delay_minutes) ? a.delay_minutes
                    : parseInt(a.delay_minutes, 10) || 0,
      order_index: Number.isInteger(a.order_index) ? a.order_index : 0,
      branch_key: asString(a.branch_key, null),
      status: asString(a.status) || 'pending',
    }));

    return {
      flow_meta: {},
      upserts: { triggers: normTriggers, actions: normActions },
      deletes: { trigger_ids: [], action_ids: [] },
    };
  }
}

class PublishFlowRequestDTO {
  static from(body = {}) {
    return { simulate: asBool(body.simulate, false) };
  }
}

/* ---------- exports ---------- */
module.exports = {
  // request
  CreateFlowRequestDTO,
  UpdateFlowRequestDTO,
  CreateTriggerRequestDTO,
  UpdateTriggerRequestDTO,
  CreateActionRequestDTO,
  UpdateActionRequestDTO,

  // response
  AutomationFlowResponseDTO,
  TriggerResponseDTO,
  ActionResponseDTO,
  FlowDetailResponseDTO,

  // misc
  HttpBadRequest,

  // editor/publish
  SaveEditorRequestDTO,
  PublishFlowRequestDTO,
};
