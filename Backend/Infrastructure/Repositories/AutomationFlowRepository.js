// backend/src/Infrastructure/repositories/AutomationFlowRepository.js
const { Op } = require('sequelize');
// const IAutomationFlowRepository = require('../../Domain/Interfaces/IAutomationFlowRepository');
const AutomationFlow  = require('../../Domain/Entities/AutomationFlow');

class AutomationFlowRepository{
  async create(data) {
    console.log(data);
    return await AutomationFlow.create(data);
  }

  async findById(flow_id) {
    return await AutomationFlow.findByPk(flow_id);
  }

  async findAll({ enabled, q, limit = 100, offset = 0 } = {}) {
    const where = {};
    if (enabled !== undefined) where.enabled = !!enabled;
    if (q) where.name = { [Op.iLike]: `%${q}%` };
    return await AutomationFlow.findAll({ where, limit, offset, order: [['updated_at','DESC']] });
  }

  async update(flow_id, patch) {
    const inst = await AutomationFlow.findByPk(flow_id);
    if (!inst) return null;
    patch.updated_at = new Date();
    await inst.update(patch);
    return inst;
  }

  async delete(flow_id) {
    await AutomationFlow.destroy({ where: { flow_id } });
  }

  async toggle(flow_id, enabled) {
    const inst = await AutomationFlow.findByPk(flow_id);
    if (!inst) return null;
    await inst.update({ enabled, updated_at: new Date() });
    return inst;
  }
}

module.exports = new AutomationFlowRepository();
