const { fn, col, literal, Op } = require('sequelize');
const Lead = require('../../Domain/Entities/Lead');
const LeadInteraction = require('../../Domain/Entities/LeadInteraction');
const LeadStatusHistory = require('../../Domain/Entities/LeadStatusHistory');
const LeadInterest = require('../../Domain/Entities/LeadInterest');
const sequelize = Lead.sequelize;
class LeadRepository {
  constructor() {
    this.Lead = Lead;
    this.LeadInteraction = LeadInteraction || null;
    this.LeadStatusHistory = LeadStatusHistory || null;
    this.LeadInterest = LeadInterest || null;
    this.sequelize = sequelize;
  }
  async create(leadData, options = {}) {
    const { transaction } = options;
    return await this.Lead.create(leadData, { transaction });
  }
  async update(leadId, updateData = {}, options = {}) {
    const { transaction } = options;
    const lead = await this.Lead.findByPk(leadId, { transaction });
    if (!lead) return null;
    await lead.update(updateData, { transaction });
    return lead;
  }
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
      order: [['created_at', 'DESC']],
      transaction,
    });
  }
  async findBySource(lead_source, source_detail = null, options = {}) {
    const { transaction } = options;
    const where = { lead_source };
    if (source_detail) where.source_detail = source_detail;
    return await this.Lead.findAll({
      where,
      order: [['created_at', 'DESC']],
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
      order: [['created_at', 'DESC']],
      limit,
      transaction,
    });
  }
  async logStatusChange(leadId, to_status, { reason = null, changed_by = null, meta = {}, transaction: extT } = {}) {
    if (!this.LeadStatusHistory) {
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
          occurred_at,
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
  async findDetailById(leadId, options = {}) {
    const { transaction } = options;

    const lead = await this.Lead.findByPk(leadId, { transaction });
    if (!lead) return null;

    const [productInterests, interactions] = await Promise.all([
      this.LeadInterest.findAll({
        where: { lead_id: leadId },
        order: [['created_at', 'DESC']],
        transaction,
      }),
      this.LeadInteraction.findAll({
        where: { lead_id: leadId },
        order: [['occurred_at', 'DESC']],
        transaction,
      }),
    ]);

    return {
      lead,
      productInterests,
      interactions,
    };
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
  async findHot(minScore = 70, limit = 100, { transaction } = {}) {
    return await this.Lead.findAll({
      where: { lead_score: { [Op.gte]: minScore } },
      order: [['lead_score', 'DESC']],
      limit,
      transaction,
    });
  }
  normalizeOrder(order) {
    if (!order) return [['created_at', 'DESC']];
    if (typeof order === 'string') {
      const s = order.trim();
      const [fieldRaw, dirRaw] = s.split(':');
      const field = (fieldRaw || 'created_at').trim();
      const dir = String(dirRaw || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      return [[field, dir]];
    }
    if (Array.isArray(order)) {
      return order;
    }
    if (typeof order === 'object' && order.field) {
      const dir = String(order.dir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      return [[order.field, dir]];
    }
    return [['created_at', 'DESC']];
  }
  async findByAnonId(anonId, options = {}) {
    const { transaction } = options;
    return await this.Lead.findOne({ where: { anon_id: anonId }, transaction });
  }
  async findByConditions(conditions = {}, options = {}) {
    const { transaction } = options;
    const limit = Number(conditions.limit || 5000);
    const offset = Number(conditions.offset || 0);
    const order = this.normalizeOrder(conditions.order || conditions.sort || null);
    const where = {};
    const q = conditions.q || conditions.search || null;
    if (q) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
        { notes: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (conditions.lead_id) where.lead_id = conditions.lead_id;
    if (conditions.customer_id) where.customer_id = conditions.customer_id;
    if (conditions.email) where.email = conditions.email;
    if (conditions.phone) where.phone = conditions.phone;
    if (conditions.status) where.status = conditions.status;
    if (conditions.lead_source) where.lead_source = conditions.lead_source;
    if (conditions.source_detail) where.source_detail = conditions.source_detail;
    if (conditions.lead_score_gte != null || conditions.lead_score_lte != null) {
      where.lead_score = {};
      if (conditions.lead_score_gte != null) where.lead_score[Op.gte] = Number(conditions.lead_score_gte);
      if (conditions.lead_score_lte != null) where.lead_score[Op.lte] = Number(conditions.lead_score_lte);
    }
    if (conditions.loyalty_score_gte != null || conditions.loyalty_score_lte != null) {
      where.loyalty_score = {};
      if (conditions.loyalty_score_gte != null) where.loyalty_score[Op.gte] = Number(conditions.loyalty_score_gte);
      if (conditions.loyalty_score_lte != null) where.loyalty_score[Op.lte] = Number(conditions.loyalty_score_lte);
    }
    if (conditions.created_after || conditions.created_before) {
      where.created_at = {};
      if (conditions.created_after) where.created_at[Op.gte] = new Date(conditions.created_after);
      if (conditions.created_before) where.created_at[Op.lte] = new Date(conditions.created_before);
    }
    if (conditions.updated_after || conditions.updated_before) {
      where.updated_at = {};
      if (conditions.updated_after) where.updated_at[Op.gte] = new Date(conditions.updated_after);
      if (conditions.updated_before) where.updated_at[Op.lte] = new Date(conditions.updated_before);
    }
    if (conditions.birthday_month != null) {
      const m = Number(conditions.birthday_month);
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(`EXTRACT(MONTH FROM COALESCE("Lead"."birthday","Lead"."date_of_birth")) = ${m}`)
      );
    }
    const tags_in = conditions.tags_in || null;
    const tags_all = conditions.tags_all || null;
    const tags_not_in = conditions.tags_not_in || null;

    if (tags_in && Array.isArray(tags_in) && tags_in.length) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(literal(`"Lead"."tags" && ARRAY[${tags_in.map((t) => sequelize.escape(t)).join(',')}]::varchar[]`));
    }
    if (tags_all && Array.isArray(tags_all) && tags_all.length) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(literal(`"Lead"."tags" @> ARRAY[${tags_all.map((t) => sequelize.escape(t)).join(',')}]::varchar[]`));
    }
    if (tags_not_in && Array.isArray(tags_not_in) && tags_not_in.length) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(literal(`NOT ("Lead"."tags" && ARRAY[${tags_not_in.map((t) => sequelize.escape(t)).join(',')}]::varchar[] )`));
    }
    const lastBefore = conditions.last_interaction_before || null;
    const lastAfter = conditions.last_interaction_after || null;
    const include = [];
    if ((lastBefore || lastAfter) && this.LeadInteraction) {
      where[Op.and] = where[Op.and] || [];

      if (lastBefore) {
        where[Op.and].push(literal(`
          (
            SELECT COALESCE(MAX(li.occurred_at), '1900-01-01'::timestamp)
            FROM lead_interactions li
            WHERE li.lead_id = "Lead".lead_id
          ) < ${sequelize.escape(new Date(lastBefore).toISOString())}
        `));
      }

      if (lastAfter) {
        where[Op.and].push(literal(`
          (
            SELECT COALESCE(MAX(li.occurred_at), '1900-01-01'::timestamp)
            FROM lead_interactions li
            WHERE li.lead_id = "Lead".lead_id
          ) >= ${sequelize.escape(new Date(lastAfter).toISOString())}
        `));
      }
    }
    if (conditions.eq && typeof conditions.eq === 'object') {
      for (const [k, v] of Object.entries(conditions.eq)) {
        if (v == null) continue;
        where[k] = v;
      }
    }
    return await this.Lead.findAll({
      where,
      include,
      order,
      limit,
      offset,
      transaction,
    });
  }
  async findByIdForUpdate(leadId, options = {}) {
    const { transaction } = options;
    if (!transaction) return this.findById(leadId);
    return await this.Lead.findByPk(leadId, { transaction, lock: transaction.LOCK.UPDATE });
  }
  async findByIdWithRelations(leadId, opts = {}) {
    const { transaction, limitInteractions = 50 } = opts;

    return Lead.findByPk(leadId, {
      transaction,
      include: [
        {
          model: LeadInterest,
          as: 'product_interests',
          required: false,
          attributes: [
            'lead_id', 'product_id', 'product_name',
            'source', 'campaign_id', 'meta',
            'count', 'last_seen_at', 'created_at', 'updated_at'
          ],
          order: [['updated_at', 'DESC']],
        },
        {
          model: LeadInteraction,
          as: 'interactions',
          required: false,
          attributes: [
            'interaction_id', 'lead_id', 'type', 'channel',
            'meta', 'created_at'
          ],
          limit: limitInteractions,
          separate: true,
          order: [['created_at', 'DESC']]
        }
      ]
    });
  }
}

module.exports = new LeadRepository();
