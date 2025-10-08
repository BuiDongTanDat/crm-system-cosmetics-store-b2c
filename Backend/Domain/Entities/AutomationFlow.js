// backend/src/Domain/Entities/AutomationFlow.js

class AutomationFlow {
  constructor({
    flow_id,
    name,
    description = "",
    enabled = true,
    created_by = null,
    created_at = null,
    updated_at = null,
    // actions / triggers are stored separately (relation), but we can keep a simple in-memory list
    triggers = [],    // array of trigger ids
    actions = []      // array of action ids
  } = {}) {
    this.flow_id = flow_id;
    this.name = name;
    this.description = description;
    this.enabled = !!enabled;
    this.created_by = created_by;
    this.created_at = created_at || new Date();
    this.updated_at = updated_at || new Date();
    this.triggers = triggers;
    this.actions = actions;
  }

  enable() {
    this.enabled = true;
    this.touch();
  }

  disable() {
    this.enabled = false;
    this.touch();
  }

  addTrigger(triggerId) {
    if (!this.triggers.includes(triggerId)) this.triggers.push(triggerId);
    this.touch();
  }

  addAction(actionId) {
    if (!this.actions.includes(actionId)) this.actions.push(actionId);
    this.touch();
  }

  touch() {
    this.updated_at = new Date();
  }

  toJSON() {
    return {
      flow_id: this.flow_id,
      name: this.name,
      description: this.description,
      enabled: this.enabled,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
      triggers: this.triggers,
      actions: this.actions,
    };
  }
}

module.exports = AutomationFlow;
