// backend/src/Infrastructure/Repositories/LeadRepository.js
const { fn, col, literal, Op } = require('sequelize');
const Lead = require('../../Domain/Entities/Lead');
const LeadInteraction = require('../../Domain/Entities/LeadInteraction');
const LeadStatusHistory = require('../../Domain/Entities/LeadStatusHistory');

// Dùng đúng sequelize instance đã init ở model
const sequelize = Lead.sequelize;

class LeadRepository {
  constructor() {
    // Chuẩn hoá cách dùng this.*
    this.Lead = Lead;
    this.LeadInteraction = LeadInteraction || null;
    this.LeadStatusHistory = LeadStatusHistory || null;
    this.sequelize = sequelize;
  }

  // =========================
  // CRUD for Lead
  // =========================
  async create(leadData, options = {}) {
    const { transaction } = options;
    return await this.Lead.create(leadData, { transaction });
  }

  // (Giữ lại để tương thích) — trả về entity sau update
  async update(leadId, updateData = {}, options = {}) {
    const { transaction } = options;
    const lead = await this.Lead.findByPk(leadId, { transaction });
    if (!lead) return null;
    await lead.update(updateData, { transaction });
    return lead;
  }

  // ✅ BỔ SUNG CHUẨN: updateById dùng trong autoConvertLead()
  async updateById(id, patch = {}, options = {}) {
    const { transaction } = options;
    await this.Lead.update(patch, { where: { lead_id: id }, transaction });
    return this.findById(id, { transaction });
  }

  async updateTags(leadId, tags = [], mode = 'add', options = {}) {
    const { transaction } = options;
    const lead = await this.Lead.findByPk(leadId, { transaction });
    if (!lead) return null;

    let current = Array.isArray(lead.tags) ? [...lead.tags] : [];
    if (!Array.isArray(tags)) tags = [tags];

    switch (mode) {
      case 'add':
        current = Array.from(new Set([...current, ...tags]));
        break;
      case 'remove':
        current = current.filter(t => !tags.includes(t));
        break;
      case 'replace':
        current = [...tags];
        break;
      default:
        break;
    }

    await lead.update({ tags: current }, { transaction });
    return lead;
  }

  async findById(leadId, options = {}) {
    const { transaction } = options;
    return await this.Lead.findByPk(leadId, { transaction });
  }

  async findByEmail(email, options = {}) {
    const { transaction } = options;
    return await this.Lead.findOne({ where: { email }, transaction });
  }

  async findByPhone(phone, options = {}) {
    const { transaction } = options;
    return await this.Lead.findOne({ where: { phone }, transaction });
  }

  async findAll(options = {}) {
    const { where = {}, order = [['created_at', 'DESC']], transaction } = options;
    return this.Lead.findAll({ where, order, transaction });
  }

  async getLeadsGroupedByStatus(options = {}) {
    const { transaction } = options;
    const rows = await this.Lead.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('lead_id')), 'count'],
        [fn('SUM', literal('COALESCE(predicted_value::numeric, 0)')), 'sum_value']
      ],
      group: ['status'],
      raw: true,
      transaction,
    });
    return rows;
  }

  async save(lead, options = {}) {
    const { transaction } = options;
    const payload = typeof lead?.toJSON === 'function' ? lead.toJSON() : lead;
    if (!payload.lead_id) return await this.Lead.create(payload, { transaction });

    const existing = await this.Lead.findByPk(payload.lead_id, { transaction });
    if (existing) {
      await existing.update(payload, { transaction });
      return existing;
    }
    return await this.Lead.create(payload, { transaction });
  }

  async delete(leadId, options = {}) {
    const { transaction } = options;
    await this.Lead.destroy({ where: { lead_id: leadId }, transaction });
  }

  async findByStatus(status, options = {}) {
    const { transaction } = options;
    return await this.Lead.findAll({
      where: { status },
      order: [['updated_at', 'DESC']],
      transaction,
    });
  }

  async findBySource(lead_source, source_detail = null, options = {}) {
    const { transaction } = options;
    const where = { lead_source };
    if (source_detail) where.source_detail = source_detail;
    return await this.Lead.findAll({
      where,
      order: [['updated_at', 'DESC']],
      transaction,
    });
  }

  async search(q, limit = 50, options = {}) {
    const { transaction } = options;
    if (!q) return [];
    return await this.Lead.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } },
          { notes: { [Op.iLike]: `%${q}%` } },
        ]
      },
      order: [['updated_at', 'DESC']],
      limit,
      transaction,
    });
  }

  // =========================
  // Status change WITH history (transaction-friendly)
  // =========================
  /**
   * Change status and write LeadStatusHistory in one transaction.
   * Accepts external transaction via opts.transaction.
   */
  async logStatusChange(leadId, to_status, { reason = null, changed_by = null, meta = {}, transaction: extT } = {}) {
    if (!this.LeadStatusHistory) {
      // fallback chỉ update status nếu không có bảng history
      return this.update(leadId, { status: to_status }, { transaction: extT });
    }

    const run = async (t) => {
      const lead = await this.Lead.findByPk(leadId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!lead) return null;

      const from_status = lead.status ?? null;

      await this.LeadStatusHistory.create(
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

      await lead.update({ status: to_status }, { transaction: t });
      return lead;
    };

    if (extT) return run(extT);
    return await this.sequelize.transaction(run);
  }

  // Backward-compatible alias
  async updateStatus(leadId, newStatus, opts = {}) {
    return this.logStatusChange(leadId, newStatus, opts);
  }

  async getStatusHistory(leadId, { limit = 50, offset = 0, transaction } = {}) {
    if (!this.LeadStatusHistory) return [];
    return await this.LeadStatusHistory.findAll({
      where: { lead_id: leadId },
      order: [['changed_at', 'DESC']],
      limit,
      offset,
      transaction,
    });
  }

  // =========================
  // Interactions
  // =========================
  /**
   * Create an interaction and optionally adjust lead_score atomically.
   * Accepts external transaction via options.transaction
   */
  async addInteraction(leadId, payload = {}, options = {}) {
    if (!this.LeadInteraction) return null;
    const { transaction: extT } = options;

    const run = async (t) => {
      const lead = await this.Lead.findByPk(leadId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!lead) return null;

      const {
        type,
        channel = null,
        occurred_at = undefined,
        properties = {},
        score_delta = 0,
        created_by = null,
      } = payload || {};

      const interaction = await this.LeadInteraction.create(
        {
          lead_id: leadId,
          type,
          channel,
          occurred_at, // defaults to NOW if undefined by model
          properties,
          score_delta,
          created_by,
        },
        { transaction: t }
      );

      if (Number(score_delta) !== 0) {
        const nextScore = (lead.lead_score || 0) + Number(score_delta);
        await lead.update({ lead_score: nextScore }, { transaction: t });
      }

      return interaction;
    };

    if (extT) return run(extT);
    return await this.sequelize.transaction(run);
  }

  async getInteractions(leadId, { type = null, channel = null, since = null, until = null, limit = 100, offset = 0, transaction } = {}) {
    if (!this.LeadInteraction) return [];
    const where = { lead_id: leadId };
    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (since || until) {
      where.occurred_at = {};
      if (since) where.occurred_at[Op.gte] = since;
      if (until) where.occurred_at[Op.lte] = until;
    }

    return await this.LeadInteraction.findAll({
      where,
      order: [['occurred_at', 'DESC'], ['interaction_id', 'DESC']],
      limit,
      offset,
      transaction,
    });
  }

  async listInteractions(leadId, { transaction } = {}) {
    if (!this.LeadInteraction) return [];
    return await this.LeadInteraction.findAll({
      where: { lead_id: leadId },
      order: [['occurred_at', 'DESC']],
      transaction,
    });
  }

  async listStatusHistory(leadId, { transaction } = {}) {
    if (!this.LeadStatusHistory) return [];
    return await this.LeadStatusHistory.findAll({
      where: { lead_id: leadId },
      order: [['changed_at', 'DESC']],
      transaction,
    });
  }

  async deleteInteraction(interactionId, { transaction } = {}) {
    if (!this.LeadInteraction) return 0;
    return await this.LeadInteraction.destroy({ where: { interaction_id: interactionId }, transaction });
  }

  async getRecentActivity({ limit = 50, since = null, transaction } = {}) {
    if (!this.LeadInteraction) return [];
    const where = {};
    if (since) where.occurred_at = { [Op.gte]: since };

    return await this.LeadInteraction.findAll({
      where,
      order: [['occurred_at', 'DESC'], ['interaction_id', 'DESC']],
      limit,
      transaction,
    });
  }

  async recomputeLeadScore(leadId, { transaction } = {}) {
    if (!this.LeadInteraction) return await this.findById(leadId, { transaction });

    const [{ sum }] = await this.LeadInteraction.findAll({
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('score_delta')), 0), 'sum']],
      where: { lead_id: leadId },
      raw: true,
      transaction,
    });

    const lead = await this.Lead.findByPk(leadId, { transaction });
    if (!lead) return null;

    await lead.update({ lead_score: Number(sum) || 0 }, { transaction });
    return lead;
  }

  async aggregateByStatus({ transaction } = {}) {
    const [rows] = await this.sequelize.query(`
      SELECT status, COUNT(*)::int AS count
      FROM leads
      GROUP BY status
      ORDER BY 1
    `, { transaction });
    return rows;
  }

  // =========================
  // Lists / Pagination
  // =========================
  async findHot(minScore = 70, limit = 100, { transaction } = {}) {
    return await this.Lead.findAll({
      where: { lead_score: { [Op.gte]: minScore } },
      order: [['lead_score', 'DESC']],
      limit,
      transaction,
    });
  }
}

module.exports = new LeadRepository();
