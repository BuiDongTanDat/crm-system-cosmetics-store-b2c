// backend/src/Infrastructure/Repositories/CustomerAnalyticsSnapshotRepository.js
const { Op } = require('sequelize');
const CustomerAnalyticsSnapshot = require('../../Domain/Entities/CustomerAnalyticsSnapshot');
const Customer = require('../../Domain/Entities/Customer');

function parseSort(sort) {
  if (!sort) return [['snapshot_date', 'DESC']];
  const s = String(sort).trim();
  const dir = s.startsWith('-') ? 'DESC' : 'ASC';
  const col = s.replace(/^-/, '');
  const ALLOWED = new Set([
    'snapshot_date',
    'recency_days',
    'frequency_90d',
    'monetary_90d',
    'avg_order_value_90d',
    'churn_score',
    'clv_12m',
    'segment_id',
  ]);
  return [[ALLOWED.has(col) ? col : 'snapshot_date', dir]];
}

class CustomerAnalyticsSnapshotRepository {
  async upsertByCustomerAndDate(customer_id, snapshot_date, payload) {
    const where = { customer_id, snapshot_date };
    const existing = await CustomerAnalyticsSnapshot.findOne({ where });

    if (existing) {
      await existing.update(payload);
      return existing;
    }
    return CustomerAnalyticsSnapshot.create(payload);
  }

  async getLatest(customer_id) {
    return CustomerAnalyticsSnapshot.findOne({
      where: { customer_id },
      order: [['snapshot_date', 'DESC']],
    });
  }

  async listByCustomer(customer_id, q = {}) {
    return CustomerAnalyticsSnapshot.findAll({
      where: { customer_id },
      order: [['snapshot_date', 'DESC']],
      limit: q.limit ? Number(q.limit) : 50,
      offset: q.offset ? Number(q.offset) : 0,
    });
  }

  async updateById(snapshot_id, patch) {
    const row = await CustomerAnalyticsSnapshot.findByPk(snapshot_id);
    if (!row) return null;
    await row.update(patch);
    return row;
  }

  async getLatestSnapshotDate() {
    const row = await CustomerAnalyticsSnapshot.findOne({
      attributes: ['snapshot_date'],
      order: [['snapshot_date', 'DESC']],
      raw: true,
    });
    return row?.snapshot_date || null;
  }

  async getSummaryByDate(snapshot_date) {
    return CustomerAnalyticsSnapshot.findAll({
      where: { snapshot_date },
      attributes: [
        'customer_id',
        'snapshot_date',
        'recency_days',
        'frequency_90d',
        'monetary_90d',
        'avg_order_value_90d',
        'churn_score',
        'clv_12m',
        'metadata',
      ],
      raw: true,
    });
  }

  async listByDate(snapshot_date, query = {}) {
    const page = Number(query.page || 1);
    const page_size = Number(query.page_size || 20);
    const offset = (page - 1) * page_size;
    const order = parseSort(query.sort);
    const search = query.search ? String(query.search).trim() : null;
    const includeCustomer = {
      model: Customer,
      as: 'customer',
      required: false,
      attributes: ['customer_id', 'full_name', 'email', 'phone'],
    };
    if (search) {
      includeCustomer.where = {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
        ],
      };
      includeCustomer.required = true;
    }
    const { rows, count } = await CustomerAnalyticsSnapshot.findAndCountAll({
      where: { snapshot_date },
      include: [includeCustomer],
      order,
      limit: page_size,
      offset,
    });

    return { page, page_size, total: count, items: rows };
  }
}

module.exports = new CustomerAnalyticsSnapshotRepository();
