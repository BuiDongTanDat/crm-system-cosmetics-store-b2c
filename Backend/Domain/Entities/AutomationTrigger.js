// backend/src/Domain/Entities/AutomationTrigger.js

class AutomationTrigger {
  constructor({
    trigger_id,
    flow_id = null,
    event_type,       // ví dụ: "order_completed", "cart_abandoned", "birthday"
    conditions = {},  // JSON logic, e.g. { "days_since_last_purchase": ">30" }
    is_active = true,
    created_at = null
  } = {}) {
    this.trigger_id = trigger_id;
    this.flow_id = flow_id;
    this.event_type = event_type;
    this.conditions = conditions || {};
    this.is_active = !!is_active;
    this.created_at = created_at || new Date();
  }

  activate() {
    this.is_active = true;
  }

  deactivate() {
    this.is_active = false;
  }

  updateConditions(newConditions) {
    this.conditions = newConditions || {};
  }

  matchesEvent(event) {
    // Very generic matcher - real implementation should parse conditions properly
    if (!this.is_active) return false;
    if (this.event_type && this.event_type !== event.type) return false;
    // additional condition checks can be added here
    return true;
  }

  toJSON() {
    return {
      trigger_id: this.trigger_id,
      flow_id: this.flow_id,
      event_type: this.event_type,
      conditions: this.conditions,
      is_active: this.is_active,
      created_at: this.created_at,
    };
  }
}

module.exports = AutomationTrigger;
