// backend/src/Infrastructure/repositories/AutomationTriggerRepository.js
const  AutomationTrigger  = require('../../Domain/Entities/AutomationTrigger');
const { Op } = require('sequelize');
class AutomationTriggerRepository {
  async create(data) {
    return await AutomationTrigger.create(data);
  }

  async findById(trigger_id) {
    return await AutomationTrigger.findByPk(trigger_id);
  }

  async findByFlow(flow_id, { activeOnly = false } = {}) {
    const where = { flow_id };
    if (activeOnly) where.is_active = true;
    return await AutomationTrigger.findAll({ where, order: [['created_at','DESC']] });
  }

  async list({ event_type, is_active, limit = 100, offset = 0 } = {}) {
    const where = {};
    if (event_type) where.event_type = event_type;
    if (is_active !== undefined) where.is_active = !!is_active;
    return await AutomationTrigger.findAll({ where, limit, offset, order: [['created_at','DESC']] });
  }

  async update(trigger_id, patch) {
    const inst = await AutomationTrigger.findByPk(trigger_id);
    if (!inst) return null;
    await inst.update(patch);
    return inst;
  }

  async delete(trigger_id) {
    await AutomationTrigger.destroy({ where: { trigger_id } });
  }

  async setActive(trigger_id, is_active) {
    const inst = await AutomationTrigger.findByPk(trigger_id);
    if (!inst) return null;
    await inst.update({ is_active });
    return inst;
  }
  async bulkDeleteByIds(ids = [], options = {}) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const pk = AutomationTrigger.primaryKeyAttribute || 'trigger_id';
    return AutomationTrigger.destroy({
      where: { [pk]: { [Op.in]: ids } },
      ...options,
    });
  }
}

module.exports = new AutomationTriggerRepository();
