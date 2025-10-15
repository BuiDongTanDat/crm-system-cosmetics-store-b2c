// backend/src/Infrastructure/repositories/AutomationActionRepository.js
const { Op } = require('sequelize');
const  AutomationAction  = require('../../Domain/Entities/AutomationAction');
class AutomationActionRepository {

  async create(data) {
    return await AutomationAction.create(data);
  }

  async findById(action_id) {
    return await AutomationAction.findByPk(action_id);
  }

  async findByTrigger(trigger_id) {
    return await AutomationAction.findAll({ where: { trigger_id }, order: [['created_at','DESC']] });
  }

  async findByFlow(flow_id) {
    return await AutomationAction.findAll({ where: { flow_id }, order: [['created_at','DESC']] });
  }

  async list({ status, limit = 100, offset = 0 } = {}) {
    const where = {};
    if (status) where.status = status;
    return await AutomationAction.findAll({ where, limit, offset, order: [['created_at','DESC']] });
  }

  async update(action_id, patch) {
    const inst = await AutomationAction.findByPk(action_id);
    if (!inst) return null;
    await inst.update(patch);
    return inst;
  }

  async delete(action_id) {
    await AutomationAction.destroy({ where: { action_id } });
  }

  // tiện ích cho automation
  async findDue(now = new Date()) {
    return await AutomationAction.findAll({
      where: {
        status: 'pending',
        executed_at: { [Op.lte]: now }
      },
      order: [['executed_at','ASC']]
    });
  }

  async markSent(action_id, timestamp = new Date()) {
    const inst = await AutomationAction.findByPk(action_id);
    if (!inst) return null;
    await inst.update({ status: 'sent', executed_at: timestamp });
    return inst;
  }

  async markFailed(action_id, reason) {
    const inst = await AutomationAction.findByPk(action_id);
    if (!inst) return null;
    const content = { ...(inst.content || {}), _last_error: String(reason || '') };
    await inst.update({ status: 'failed', content });
    return inst;
  }
  async bulkDeleteByIds(ids = [], options = {}) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const pk =AutomationAction.primaryKeyAttribute || 'action_id';
    return AutomationAction.destroy({
      where: { [pk]: { [Op.in]: ids } },
      ...options,
    });
  }
}

module.exports = new AutomationActionRepository();
