class CreateFlowRequestDTO {
  constructor({ name, description, enabled, createdBy }) {
    this.name = name;
    this.description = description;
    this.enabled = enabled;
    this.createdBy = createdBy;
  }
}

class AutomationFlowResponseDTO {
  constructor(flow) {
    this.id = flow.flow_id;
    this.name = flow.name;
    this.description = flow.description;
    this.enabled = flow.enabled;
  }
}

class TriggerResponseDTO {
  constructor(trigger) {
    this.id = trigger.trigger_id;
    this.eventType = trigger.event_type;
    this.conditions = trigger.conditions;
  }
}

module.exports = { CreateFlowRequestDTO, AutomationFlowResponseDTO, TriggerResponseDTO };
