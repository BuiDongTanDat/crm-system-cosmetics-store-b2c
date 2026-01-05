const { Op } = require('sequelize');
const CustomerInteraction = require('../../Domain/Entities/CustomerInteraction');

class CustomerInteractionRepository {
  async addInteraction(customer_id, payload) {
    return CustomerInteraction.create({
      customer_id,
      type: payload.type || payload.event_type || 'unknown',
      channel: payload.channel || 'web',
      occurred_at: payload.occurred_at ? new Date(payload.occurred_at) : new Date(),
      properties: payload.properties || payload.metadata || {},
      score_delta: Number(payload.score_delta || 0),
      created_by: payload.created_by || null,
      created_at: payload.created_at ? new Date(payload.created_at) : new Date(),
    });
  }

  async getInteractions(customer_id, query = {}) {
    const where = { customer_id };

    if (query.type) where.type = query.type;
    if (query.channel) where.channel = query.channel;

    if (query.since || query.until) {
      where.occurred_at = {};
      if (query.since) where.occurred_at[Op.gte] = new Date(query.since);
      if (query.until) where.occurred_at[Op.lte] = new Date(query.until);
    }

    return CustomerInteraction.findAll({
      where,
      order: [['occurred_at', 'DESC']],
      limit: query.limit ? Number(query.limit) : 100,
      offset: query.offset ? Number(query.offset) : 0,
    });
  }

  async countByType(customer_id, type, { since, until } = {}) {
    const where = { customer_id, type };

    if (since || until) {
      where.occurred_at = {};
      if (since) where.occurred_at[Op.gte] = new Date(since);
      if (until) where.occurred_at[Op.lte] = new Date(until);
    }

    return CustomerInteraction.count({ where });
  }

  async list(customer_id, query = {}) {
    return CustomerInteraction.findAll({
      where: { customer_id },
      order: [['occurred_at', 'DESC']],
      limit: query.limit ? Number(query.limit) : 1,
    });
  }
}

module.exports = new CustomerInteractionRepository();
