// backend/src/Application/services/AutomationActionService.js
actionRepo = require('../../Infrastructure/Repositories/AutomationActionRepository.js');
triggerRepo = require('../../Infrastructure/Repositories/AutomationTriggerRepository.js');
flowRepo = require('../../Infrastructure/Repositories/AutomationFlowRepository.js');
// const IAutomationActionService = require('../Interfaces/IAutomationActionService');
class AutomationActionService {
  async createAction(dto) {
    if (dto.trigger_id) {
      const trig = await this.triggers.findById(dto.trigger_id);
      if (!trig) throw new Error('Trigger not found');
      if (!dto.flow_id) dto.flow_id = trig.flow_id;
    }
    if (dto.flow_id) {
      const flow = await this.flows.findById(dto.flow_id);
      if (!flow) throw new Error('Flow not found');
    }
    return await this.actions.create(dto);
  }

  async getAction(action_id) {
    const a = await this.actions.findById(action_id);
    if (!a) throw new Error('Action not found');
    return a;
  }
  async listActions(params) {
    return await this.actions.list(params);
  }

  async updateAction(action_id, patch) {
    const a = await this.actions.update(action_id, patch);
    if (!a) throw new Error('Action not found');
    return a;
  }

  async deleteAction(action_id) {
    await this.actions.delete(action_id);
  }

  // tiện ích cho automation runtime
  async pickDueActions(now = new Date()) {
    return await this.actions.findDue(now);
  }

  async markSent(action_id, timestamp = new Date()) {
    return await this.actions.markSent(action_id, timestamp);
  }

  async markFailed(action_id, reason) {
    return await this.actions.markFailed(action_id, reason);
  }
}

module.exports = new AutomationActionService();
