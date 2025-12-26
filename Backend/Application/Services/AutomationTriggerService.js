// backend/src/Application/services/AutomationTriggerService.js
class AutomationTriggerService {
  constructor({ triggerRepo, flowRepo, logger = console }) {
    this.triggers = triggerRepo;
    this.flows = flowRepo;
    this.logger = logger;
  }
  async createTrigger(dto) {
    // đảm bảo flow tồn tại
    const flow = await this.flows.findById(dto.flow_id);
    if (!flow) throw new Error('Flow not found');
    return await this.triggers.create(dto);
  }
  async getTrigger(trigger_id) {
    const t = await this.triggers.findById(trigger_id);
    if (!t) throw new Error('Trigger not found');
    return t;
  }
  async listTriggers(params) {
    return await this.triggers.list(params);
  }
  async updateTrigger(trigger_id, patch) {
    const t = await this.triggers.update(trigger_id, patch);
    if (!t) throw new Error('Trigger not found');
    return t;
  }
  async deleteTrigger(trigger_id) {
    await this.triggers.delete(trigger_id);
  }
  async setActive(trigger_id, is_active) {
    const t = await this.triggers.setActive(trigger_id, is_active);
    if (!t) throw new Error('Trigger not found');
    return t;
  }
}

module.exports = AutomationTriggerService;
