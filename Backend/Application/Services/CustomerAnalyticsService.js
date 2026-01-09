// backend/src/Application/Services/CustomerAnalyticsService.js
const snapshotRepo = require('../../Infrastructure/Repositories/CustomerAnalyticsSnapshotRepository');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

function toNumber(x, d = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

class CustomerAnalyticsService {
  async _resolveSnapshotDate(snapshot_date) {
    if (snapshot_date) return snapshot_date;
    const latest = await snapshotRepo.getLatestSnapshotDate();
    if (!latest) throw new AppError('No snapshot data', { status: 404, code: 'SNAPSHOT_EMPTY' });
    return latest;
  }

  // ========== CFM ==========
  async getCFMSummary(snapshot_date) {
    try {
      const date = await this._resolveSnapshotDate(snapshot_date);
      const rows = await snapshotRepo.getSummaryByDate(date);

      const freq = rows.map(r => toNumber(r.frequency_90d));
      const aov = rows.map(r => toNumber(r.avg_order_value_90d));

      const cfmScores = rows
        .map(r => toNumber(r?.metadata?.cfm_score))
        .filter(x => Number.isFinite(x));

      return ok({
        snapshot_date: date,
        avg_frequency_90d: mean(freq),
        avg_order_value_90d: mean(aov),
        avg_cfm_score: cfmScores.length ? mean(cfmScores) : null,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CFM_SUMMARY_FAILED' }));
    }
  }

  async listCFM(snapshot_date, query) {
    try {
      const date = await this._resolveSnapshotDate(snapshot_date);
      const data = await snapshotRepo.listByDate(date, query);

      const items = data.items.map(row => {
        const json = row.toJSON ? row.toJSON() : row;
        return {
          customer: json.customer,
          snapshot_date: json.snapshot_date,
          recency_days: json.recency_days,
          frequency_90d: json.frequency_90d,
          monetary_90d: json.monetary_90d,
          avg_order_value_90d: json.avg_order_value_90d,
          cfm_score: json.metadata?.cfm_score ?? null,
        };
      });

      return ok({ ...data, items });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CFM_LIST_FAILED' }));
    }
  }

  // ========== CHURN ==========
  async getChurnSummary(snapshot_date) {
    try {
      const date = await this._resolveSnapshotDate(snapshot_date);
      const rows = await snapshotRepo.getSummaryByDate(date);

      const churn = rows.map(r => toNumber(r.churn_score));
      const highRisk = churn.filter(x => x >= 0.7).length;
      const churnRateProxy = rows.length ? highRisk / rows.length : 0;

      const atRiskRevenue = rows
        .filter(r => toNumber(r.churn_score) >= 0.7)
        .reduce((s, r) => s + toNumber(r.clv_12m), 0);

      return ok({
        snapshot_date: date,
        churn_rate_proxy: churnRateProxy,
        high_risk_customers: highRisk,
        revenue_at_risk_12m: atRiskRevenue,
        retention_proxy: 1 - churnRateProxy,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CHURN_SUMMARY_FAILED' }));
    }
  }

  async listChurn(snapshot_date, query) {
    try {
      const date = await this._resolveSnapshotDate(snapshot_date);
      const q = { ...query };
      if (!q.sort) q.sort = '-churn_score';

      const data = await snapshotRepo.listByDate(date, q);

      const items = data.items.map(row => {
        const json = row.toJSON ? row.toJSON() : row;
        const score = toNumber(json.churn_score);
        return {
          customer: json.customer,
          snapshot_date: json.snapshot_date,
          churn_score: score,
          risk_level: score >= 0.7 ? 'HIGH' : score >= 0.4 ? 'MEDIUM' : 'LOW',
          recency_days: json.recency_days,
          frequency_90d: json.frequency_90d,
          monetary_90d: json.monetary_90d,
          clv_12m: json.clv_12m,
        };
      });

      return ok({ ...data, items });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CHURN_LIST_FAILED' }));
    }
  }

  // ========== CLV ==========
  async getCLVSummary(snapshot_date) {
    try {
      const date = await this._resolveSnapshotDate(snapshot_date);
      const rows = await snapshotRepo.getSummaryByDate(date);

      const clv12 = rows.map(r => toNumber(r.clv_12m)).filter(x => x >= 0);
      const avg = mean(clv12);
      const max = clv12.length ? Math.max(...clv12) : 0;

      return ok({
        snapshot_date: date,
        avg_clv_12m: avg,
        max_clv_12m: max,
        avg_lifetime_months: rows.length ? mean(rows.map(r => {
          if (!r.first_purchase_at || !r.last_purchase_at) return 0;
          const start = new Date(r.first_purchase_at);
          const end = new Date(r.last_purchase_at);
          const diffMs = end - start;
          return Math.max(1, Math.round(diffMs / (30 * 24 * 3600 * 1000))); // approx months
        })) : null,
        avg_roi: rows.length ? mean(rows.map(r => {
          const cac = toNumber(r.metadata?.acquisition_cost, 0);
          if (cac <= 0) return 3.5; // fallback simulated ROI if no cost data
          return toNumber(r.clv_12m) / cac;
        })) : null,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CLV_SUMMARY_FAILED' }));
    }
  }

  async listCLV(snapshot_date, query) {
    try {
      const date = await this._resolveSnapshotDate(snapshot_date);
      const q = { ...query };
      if (!q.sort) q.sort = '-clv_12m';

      const data = await snapshotRepo.listByDate(date, q);

      const items = data.items.map(row => {
        const json = row.toJSON ? row.toJSON() : row;
        return {
          customer: json.customer,
          snapshot_date: json.snapshot_date,
          clv_6m: json.clv_6m,
          clv_12m: json.clv_12m,
          frequency_90d: json.frequency_90d,
          monetary_90d: json.monetary_90d,
          avg_order_value_90d: json.avg_order_value_90d,
          churn_score: json.churn_score,
        };
      });

      return ok({ ...data, items });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CLV_LIST_FAILED' }));
    }
  }
}

module.exports = new CustomerAnalyticsService();
