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

function percentile(arr, p) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.floor((p / 100) * (a.length - 1));
  return a[idx];
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
      const aov  = rows.map(r => toNumber(r.avg_order_value_90d));
      // CFM score: nếu bạn đã lưu sẵn trong metadata.cfm_score thì lấy; nếu chưa, service có thể tự compute
      const cfmScores = rows
        .map(r => toNumber(r?.metadata?.cfm_score))
        .filter(x => Number.isFinite(x));

      return ok({
        snapshot_date: date,
        avg_frequency_90d: mean(freq),
        avg_order_value_90d: mean(aov),
        // nếu chưa có score thì có thể trả null để FE hide
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
      // map response nhẹ để FE dùng
      const items = data.items.map(row => {
        const json = row.toJSON();
        return {
          customer: json.customer,
          snapshot_date: json.snapshot_date,
          recency_days: json.recency_days,
          frequency_90d: json.frequency_90d,
          monetary_90d: json.monetary_90d,
          avg_order_value_90d: json.avg_order_value_90d,
          // nếu bạn lưu score trong metadata
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

      // "churn rate tháng này" của bạn hiện đang show dạng %.
      // Nếu chưa có label churn thực tế, bạn có thể dùng proxy = % khách có churn_score >= 0.7
      const churnRateProxy = rows.length ? (highRisk / rows.length) : 0;

      // “doanh thu ảnh hưởng” có thể = sum(clv_12m) của nhóm high risk * (tuỳ bạn)
      const atRiskRevenue = rows
        .filter(r => toNumber(r.churn_score) >= 0.7)
        .reduce((s, r) => s + toNumber(r.clv_12m), 0);

      return ok({
        snapshot_date: date,
        churn_rate_proxy: churnRateProxy,       // 0..1
        high_risk_customers: highRisk,
        revenue_at_risk_12m: atRiskRevenue,
        // retention “76%” nếu bạn có metric khác thì thay; tạm proxy:
        retention_proxy: 1 - churnRateProxy,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CHURN_SUMMARY_FAILED' }));
    }
  }

  async listChurn(snapshot_date, query) {
    try {
      const date = await this._resolveSnapshotDate(snapshot_date);
      // sort default churn_score desc
      const q = { ...query };
      if (!q.sort) q.sort = '-churn_score';

      const data = await snapshotRepo.listByDate(date, q);

      const items = data.items.map(row => {
        const json = row.toJSON();
        return {
          customer: json.customer,
          snapshot_date: json.snapshot_date,
          churn_score: json.churn_score,
          risk_level: json.churn_score >= 0.7 ? 'HIGH' : (json.churn_score >= 0.4 ? 'MEDIUM' : 'LOW'),
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

      // “ROI trung bình 4.8x” → cần CAC/cost. Nếu chưa có, bạn có thể tính proxy từ metadata hoặc trả null.
      // Tạm tính ROI proxy = clv12 / (acquisition_cost + 1) nếu bạn có stored.
      return ok({
        snapshot_date: date,
        avg_clv_12m: avg,
        max_clv_12m: max,
        // “thời gian sống TB” cần survival model hoặc rule; nếu chưa có thì để null
        avg_lifetime_months: null,
        avg_roi: null,
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
        const json = row.toJSON();
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
