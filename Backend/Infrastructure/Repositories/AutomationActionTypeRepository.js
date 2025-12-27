const AutomationActionType = require('../../Domain/Entities/AutomationActionType');

class AutomationActionTypeRepository {
  async findById(action_type) {
    return AutomationActionType.findByPk(action_type);
  }

  async list({ is_active, q, limit = 1000, offset = 0 } = {}) {
    const where = {};
    if (typeof is_active === 'boolean') where.is_active = is_active;
    if (q) {
      where.$or = [
        { action_type: { $iLike: `%${q}%` } },
        { name: { $iLike: `%${q}%` } },
      ];
    }
    return AutomationActionType.findAll({ where, limit, offset, order: [['action_type', 'ASC']] });
  }

  async upsert(dto) {
    const now = new Date();
    const payload = { ...dto, updated_at: now };
    if (!payload.created_at) payload.created_at = now;
    const [row] = await AutomationActionType.upsert(payload, { returning: true });
    return row;
  }

  async create(dto) {
    return AutomationActionType.create(dto);
  }

  async update(action_type, patch) {
    const row = await this.findById(action_type);
    if (!row) return null;
    Object.assign(row, patch, { updated_at: new Date() });
    await row.save();
    return row;
  }

  async delete(action_type) {
    const row = await this.findById(action_type);
    if (!row) return false;
    await row.destroy();
    return true;
  }

  async setActive(action_type, is_active) {
    return this.update(action_type, { is_active: !!is_active });
  }
}

module.exports = new AutomationActionTypeRepository();