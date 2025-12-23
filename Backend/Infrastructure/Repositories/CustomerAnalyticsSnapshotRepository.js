// backend/src/Infrastructure/Repositories/CustomerAnalyticsSnapshotRepository.js
const CustomerAnalyticsSnapshot = require('../../Domain/Entities/CustomerAnalyticsSnapshot');
const Customer = require('../../Domain/Entities/Customer');
const { Op, fn, col, literal } = require('sequelize');

class CustomerAnalyticsSnapshotRepository {
  async upsertSnapshot({ customer_id, snapshot_date, data }) {
    const [row] = await CustomerAnalyticsSnapshot.upsert(
      { customer_id, snapshot_date, ...data },
      { returning: true }
    );
    return row;
  }

  async getLatestSnapshotDate() {
    const row = await CustomerAnalyticsSnapshot.findOne({
      attributes: ['snapshot_date'],
      order: [['snapshot_date', 'DESC']],
    });
    return row?.snapshot_date || null;
  }

  async findLatestByCustomerId(customer_id) {
    return CustomerAnalyticsSnapshot.findOne({
      where: { customer_id },
      order: [['snapshot_date', 'DESC']],
    });
  }

  async updateById(snapshot_id, patch) {
    const row = await CustomerAnalyticsSnapshot.findByPk(snapshot_id);
    if (!row) return null;
    await row.update(patch);
    return row;
  }

  async getSummaryByDate(snapshot_date) {
    const rows = await CustomerAnalyticsSnapshot.findAll({
      where: { snapshot_date },
      attributes: [
        'customer_id',
        'snapshot_date',

        // RFM/CFM
        'recency_days',
        'frequency_90d',
        'monetary_90d',
        'avg_order_value_90d',
        'cfm_score',

        // Model outputs
        'churn_score',
        'clv_12m',
        'clv_6m',
        'segment_id',
        'segment_name',
      ],
      raw: true,
    });
    return rows;
  }

  async listByDate(snapshot_date, { page = 1, page_size = 20, sort = '-snapshot_date', search = '' } = {}) {
    const limit = Math.max(1, Math.min(200, Number(page_size) || 20));
    const offset = (Math.max(1, Number(page) || 1) - 1) * limit;

    const sortMap = {
      churn_score: ['churn_score'],
      clv_12m: ['clv_12m'],
      clv_6m: ['clv_6m'],
      frequency_90d: ['frequency_90d'],
      monetary_90d: ['monetary_90d'],
      recency_days: ['recency_days'],
      avg_order_value_90d: ['avg_order_value_90d'],
      cfm_score: ['cfm_score'],
      snapshot_date: ['snapshot_date'],
      segment_id: ['segment_id'],
    };

    let order = [['snapshot_date', 'DESC']];
    if (sort && typeof sort === 'string') {
      const desc = sort.startsWith('-');
      const key = desc ? sort.slice(1) : sort;
      const colPath = sortMap[key];
      if (colPath) order = [[...colPath, desc ? 'DESC' : 'ASC']];
    }

    const include = [
      {
        model: Customer,
        as: 'customer',
        required: true,
        attributes: ['customer_id', 'full_name', 'email', 'phone', 'source', 'tags'],
        where: search
          ? {
              [Op.or]: [
                { full_name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
              ],
            }
          : undefined,
      },
    ];

    const { rows, count } = await CustomerAnalyticsSnapshot.findAndCountAll({
      where: { snapshot_date },
      include,
      order,
      limit,
      offset,
    });

    return {
      items: rows,
      total: count,
      page: Math.max(1, Number(page) || 1),
      page_size: limit,
    };
  }

  // ============================================================
  // Dashboard: Churn
  // ============================================================
  async getChurnSummary({ snapshot_date, high_risk_threshold = 0.5 } = {}) {
    const date = snapshot_date || (await this.getLatestSnapshotDate());
    if (!date) {
      return {
        snapshot_date: null,
        total_customers: 0,
        churn_rate: 0,
        high_risk_count: 0,
        revenue_at_risk_30d: 0,
      };
    }

    const total = await CustomerAnalyticsSnapshot.count({ where: { snapshot_date: date } });

    const highRiskCount = await CustomerAnalyticsSnapshot.count({
      where: {
        snapshot_date: date,
        churn_score: { [Op.gte]: high_risk_threshold },
      },
    });

    const sumRow = await CustomerAnalyticsSnapshot.findOne({
      where: {
        snapshot_date: date,
        churn_score: { [Op.gte]: high_risk_threshold },
      },
      attributes: [[fn('COALESCE', fn('SUM', col('revenue_30d')), 0), 'revenue_at_risk_30d']],
      raw: true,
    });

    const revenueAtRisk = Number(sumRow?.revenue_at_risk_30d || 0);
    const churnRate = total > 0 ? highRiskCount / total : 0;

    return {
      snapshot_date: date,
      total_customers: total,
      churn_rate: churnRate,              // 0..1 (frontend có thể *100)
      high_risk_count: highRiskCount,
      revenue_at_risk_30d: revenueAtRisk, // VND
    };
  }

  async listChurn(snapshot_date, opts = {}) {
    // listByDate + sort mặc định churn_score desc
    return this.listByDate(snapshot_date, { sort: '-churn_score', ...opts });
  }

  // ============================================================
  // Dashboard: CLV
  // ============================================================
  async getCLVSummary({ snapshot_date } = {}) {
    const date = snapshot_date || (await this.getLatestSnapshotDate());
    if (!date) {
      return {
        snapshot_date: null,
        total_customers: 0,
        clv_avg_12m: 0,
        clv_max_12m: 0,
      };
    }

    const row = await CustomerAnalyticsSnapshot.findOne({
      where: { snapshot_date: date },
      attributes: [
        [fn('COUNT', col('snapshot_id')), 'total_customers'],
        [fn('COALESCE', fn('AVG', col('clv_12m')), 0), 'clv_avg_12m'],
        [fn('COALESCE', fn('MAX', col('clv_12m')), 0), 'clv_max_12m'],
      ],
      raw: true,
    });

    return {
      snapshot_date: date,
      total_customers: Number(row?.total_customers || 0),
      clv_avg_12m: Number(row?.clv_avg_12m || 0),
      clv_max_12m: Number(row?.clv_max_12m || 0),
    };
  }

  async listCLV(snapshot_date, opts = {}) {
    return this.listByDate(snapshot_date, { sort: '-clv_12m', ...opts });
  }

  // ============================================================
  // Dashboard: CFM / RFM
  // ============================================================
  async getCFMSummary({ snapshot_date } = {}) {
    const date = snapshot_date || (await this.getLatestSnapshotDate());
    if (!date) {
      return {
        snapshot_date: null,
        freq_avg_month: 0,
        aov_avg: 0,
        cfm_score_avg: 0,
      };
    }

    // "tần suất mua hàng 4.2 lần/tháng" => giả sử frequency_90d / 3
    const row = await CustomerAnalyticsSnapshot.findOne({
      where: { snapshot_date: date },
      attributes: [
        [fn('COALESCE', fn('AVG', col('frequency_90d')), 0), 'freq_90d_avg'],
        [fn('COALESCE', fn('AVG', col('avg_order_value_90d')), 0), 'aov_avg'],
        [fn('COALESCE', fn('AVG', col('cfm_score')), 0), 'cfm_score_avg'],
      ],
      raw: true,
    });

    const freq90dAvg = Number(row?.freq_90d_avg || 0);

    return {
      snapshot_date: date,
      freq_avg_month: freq90dAvg / 3,
      aov_avg: Number(row?.aov_avg || 0),
      cfm_score_avg: Number(row?.cfm_score_avg || 0),
    };
  }

  async listCFM(snapshot_date, opts = {}) {
    return this.listByDate(snapshot_date, { sort: '-cfm_score', ...opts });
  }
}

module.exports = new CustomerAnalyticsSnapshotRepository();
