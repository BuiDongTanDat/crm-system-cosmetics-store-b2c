// backend/src/Infrastructure/Repositories/LeadRepository.js
const { Op } = require('sequelize');
const Lead = require('../../Domain/Entities/Lead');
const LeadInteraction = require('../../Domain/Entities/LeadInteraction');
const LeadStatusHistory = require('../../Domain/Entities/LeadStatusHistory');

// Use the same sequelize instance the models were initialized with
const sequelize = Lead.sequelize;

class LeadRepository {
  // =========================
  // CRUD for Lead
  // =========================
  async create(leadData) {
    return await Lead.create(leadData);
  }
  async update(leadId, updateData) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) return null; 
  }
  
  async findById(leadId) {
    return await Lead.findByPk(leadId);
  }

  async findByEmail(email) {
    return await Lead.findOne({ where: { email } });
  }

  async findByPhone(phone) {
    return await Lead.findOne({ where: { phone } });
  }

  async findAll() {
    return await Lead.findAll();
  }
  
  async save(lead) {
    const payload = typeof lead?.toJSON === 'function' ? lead.toJSON() : lead;
    if (!payload.lead_id) return await Lead.create(payload);

    const existing = await Lead.findByPk(payload.lead_id);
    if (existing) {
      await existing.update(payload);
      return existing;
    }
    return await Lead.create(payload);
  }

  async delete(leadId) {
    await Lead.destroy({ where: { lead_id: leadId } });
  }

  async findByStatus(status) {
    return await Lead.findAll({ where: { status }, order: [['updated_at', 'DESC']] });
  }

  async findBySource(lead_source, source_detail = null) {
    const where = { lead_source };
    if (source_detail) where.source_detail = source_detail;
    return await Lead.findAll({ where, order: [['updated_at', 'DESC']] });
  }

  async search(q, limit = 50) {
    if (!q) return [];
    return await Lead.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } },
          { notes: { [Op.iLike]: `%${q}%` } },
        ]
      },
      order: [['updated_at', 'DESC']],
      limit
    });
  }

  // =========================
  // UPDATED: Status change WITH history (transactional)
  // =========================
  /**
   * Change status and write LeadStatusHistory in one transaction.
   * @param {string} leadId
   * @param {string} to_status
   * @param {{reason?: string, changed_by?: string, meta?: object}} options
   */
  async logStatusChange(leadId, to_status, { reason = null, changed_by = null, meta = {} } = {}) {
    return await sequelize.transaction(async (t) => {
      const lead = await Lead.findByPk(leadId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!lead) return null;

      const from_status = lead.status ?? null;

      // 1) write history first
      await LeadStatusHistory.create(
        {
          lead_id: leadId,
          from_status,
          to_status,
          reason,
          changed_by,
          meta: meta ?? {},
        },
        { transaction: t }
      );

      // 2) update lead
      await lead.update({ status: to_status }, { transaction: t });

      return lead;
    });
  }

  // Backward-compatible alias for code already calling updateStatus
  async updateStatus(leadId, newStatus, opts = {}) {
    return this.logStatusChange(leadId, newStatus, opts);
  }

  /**
   * Fetch status history for a lead
   */
  async getStatusHistory(leadId, { limit = 50, offset = 0 } = {}) {
    return await LeadStatusHistory.findAll({
      where: { lead_id: leadId },
      order: [['changed_at', 'DESC']],
      limit,
      offset,
    });
  }

  // =========================
  // NEW: Interactions
  // =========================
  /**
   * Create an interaction and optionally adjust lead_score atomically.
   * @param {string} leadId
   * @param {{type:string, channel?:string, occurred_at?:Date, properties?:object, score_delta?:number, created_by?:string}} payload
   */
  async addInteraction(leadId, payload) {
    return await sequelize.transaction(async (t) => {
      const lead = await Lead.findByPk(leadId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!lead) return null;

      const {
        type,
        channel = null,
        occurred_at = undefined,
        properties = {},
        score_delta = 0,
        created_by = null,
      } = payload || {};

      const interaction = await LeadInteraction.create(
        {
          lead_id: leadId,
          type,
          channel,
          occurred_at, // defaults to NOW if undefined
          properties,
          score_delta,
          created_by,
        },
        { transaction: t }
      );

      // If there's a scoring effect, update the lead
      if (Number(score_delta) !== 0) {
        const nextScore = (lead.lead_score || 0) + Number(score_delta);
        await lead.update({ lead_score: nextScore }, { transaction: t });
      }

      return interaction;
    });
  }

  /**
   * List interactions for a lead with simple filters
   */
  async getInteractions(leadId, { type = null, channel = null, since = null, until = null, limit = 100, offset = 0 } = {}) {
    const where = { lead_id: leadId };
    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (since || until) {
      where.occurred_at = {};
      if (since) where.occurred_at[Op.gte] = since;
      if (until) where.occurred_at[Op.lte] = until;
    }

    return await LeadInteraction.findAll({
      where,
      order: [['occurred_at', 'DESC'], ['interaction_id', 'DESC']],
      limit,
      offset,
    });
  }
  async listInteractions(leadId) {
    return await LeadInteraction.findAll({
      where: { lead_id: leadId },
      order: [['occurred_at', 'DESC']],
    });
  }

  async listStatusHistory(leadId) {
    return await LeadStatusHistory.findAll({
      where: { lead_id: leadId },
      order: [['changed_at', 'DESC']],
    });
  }
  /**
   * Delete a specific interaction (will NOT roll back score automatically).
   * If you need to reverse scoring, handle it in service layer or add an option here.
   */
  async deleteInteraction(interactionId) {
    await LeadInteraction.destroy({ where: { interaction_id: interactionId } });
  }

  /**
   * Get recent activity across all leads
   */
  async getRecentActivity({ limit = 50, since = null } = {}) {
    const where = {};
    if (since) where.occurred_at = { [Op.gte]: since };

    return await LeadInteraction.findAll({
      where,
      order: [['occurred_at', 'DESC'], ['interaction_id', 'DESC']],
      limit
    });
  }

  /**
   * Recompute a lead's score from interaction deltas (useful for data repair).
   */
  async recomputeLeadScore(leadId) {
    const [{ sum }] = await LeadInteraction.findAll({
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('score_delta')), 0), 'sum']],
      where: { lead_id: leadId },
      raw: true,
    });

    const lead = await Lead.findByPk(leadId);
    if (!lead) return null;

    await lead.update({ lead_score: Number(sum) || 0 });
    return lead;
  }
   async aggregateByStatus() {
    const [rows] = await Lead.sequelize.query(`
      SELECT status, COUNT(*)::int AS count
      FROM leads
      GROUP BY status
      ORDER BY 1
    `);
    return rows;
  }
  // =========================
  // Lists / Pagination
  // =========================
  async findHot(minScore = 70, limit = 100) {
    return await Lead.findAll({
      where: { lead_score: { [Op.gte]: minScore } },
      order: [['lead_score', 'DESC']],
      limit
    });
  }

  // async paginate({ page = 1, pageSize = 20, filters = {} } = {}) {
  //   const where = {};
  //   if (filters.status) where.status = filters.status;
  //   if (filters.lead_source) where.lead_source = filters.lead_source;
  //   if (filters.source_detail) where.source_detail = filters.source_detail;

  //   const offset = (Math.max(page, 1) - 1) * pageSize;

  //   const { rows, count } = await Lead.findAndCountAll({
  //     where,
  //     order: [['updated_at', 'DESC']],
  //     limit: pageSize,
  //     offset,
  //   });

  //   return {
  //     data: rows,
  //     page,
  //     pageSize,
  //     total: count,
  //     totalPages: Math.ceil(count / pageSize) || 1,
  //   };
  // }
}

module.exports = new LeadRepository();
