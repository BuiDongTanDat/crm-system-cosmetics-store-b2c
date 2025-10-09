class CampaignPerformance {
  constructor({
    campaign_perf_id, campaign_id, snapshot_date,
    reach, opens, clicks, conversions, cost, revenue, roi, extra
  }) {
    this.campaign_perf_id = campaign_perf_id;
    this.campaign_id = campaign_id;
    this.snapshot_date = snapshot_date;
    this.reach = reach || 0;
    this.opens = opens || 0;
    this.clicks = clicks || 0;
    this.conversions = conversions || 0;
    this.cost = cost || 0;
    this.revenue = revenue || 0;
    this.roi = roi || 0;
    this.extra = extra || {};
  }
}

module.exports = CampaignPerformance;
