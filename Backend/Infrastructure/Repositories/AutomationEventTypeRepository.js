const AutomationEventType = require('../../Domain/Entities/AutomationEventType');

class AutomationEventTypeRepository {
  async findById(event_type) {
    return AutomationEventType.findByPk(event_type);
  }

  async list({ is_active, q, limit = 1000, offset = 0 } = {}) {
    const where = {};
    if (typeof is_active === 'boolean') where.is_active = is_active;
    if (q) {
      // simple search by name or event_type
      where.$or = [
        { event_type: { $iLike: `%${q}%` } },
        { name: { $iLike: `%${q}%` } },
      ];
    }
    // Note: Sequelize operators should be used in real code (Op.iLike). Kept minimal.
    return AutomationEventType.findAll({ where, limit, offset, order: [['event_type', 'ASC']] });
  }

  async upsert(dto) {
    // upsert by PK
    const now = new Date();
    const payload = { ...dto, updated_at: now };
    if (!payload.created_at) payload.created_at = now;
    const [row] = await AutomationEventType.upsert(payload, { returning: true });
    return row;
  }

  async create(dto) {
    return AutomationEventType.create(dto);
  }

  async update(event_type, patch) {
    const row = await this.findById(event_type);
    if (!row) return null;
    Object.assign(row, patch, { updated_at: new Date() });
    await row.save();
    return row;
  }

  async delete(event_type) {
    const row = await this.findById(event_type);
    if (!row) return false;
    await row.destroy();
    return true;
  }

  async setActive(event_type, is_active) {
    return this.update(event_type, { is_active: !!is_active });
  }
}

module.exports = new AutomationEventTypeRepository();