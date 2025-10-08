class Campaign {
  constructor({
    campaign_id, name, channel, budget, start_date, end_date,
    target_filter, data_source, status, owner_employee_id,
    expected_kpi, created_at, updated_at
  }) {
    this.campaign_id = campaign_id;
    this.name = name;
    this.channel = channel;
    this.budget = budget;
    this.start_date = start_date;
    this.end_date = end_date;
    this.target_filter = target_filter || {};
    this.data_source = data_source;
    this.status = status || "draft";
    this.owner_employee_id = owner_employee_id;
    this.expected_kpi = expected_kpi || {};
    this.created_at = created_at || new Date();
    this.updated_at = updated_at || new Date();
  }
}

module.exports = Campaign;
