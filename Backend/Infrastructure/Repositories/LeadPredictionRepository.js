// Infrastructure/Repositories/LeadPredictionRepository.js
const { Op } = require('sequelize');
const LeadPrediction = require('../../Domain/Entities/LeadPrediction');

class LeadPredictionRepository {
  async create(payload, options = {}) {
    const { transaction } = options;
    return LeadPrediction.create(payload, { transaction });
  }

  async findLatestByLeadId(leadId) {
    return LeadPrediction.findOne({
      where: { lead_id: leadId },
      order: [['scored_at', 'DESC']],
    });
  }
  async listByLeadId(leadId, { limit = 50, offset = 0, since = null, until = null, order = 'desc', transaction } = {}) {
    const where = { lead_id: leadId };

    if (since || until) {
      where.scored_at = {};
      if (since) where.scored_at[Op.gte] = new Date(since);
      if (until) where.scored_at[Op.lte] = new Date(until);
    }

    const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    return LeadPrediction.findAll({
      where,
      order: [['scored_at', dir], ['created_at', dir]],
      limit,
      offset,
      transaction,
    });
  }
}

module.exports = new LeadPredictionRepository();
