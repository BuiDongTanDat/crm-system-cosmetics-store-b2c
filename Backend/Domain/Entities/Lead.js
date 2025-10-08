class Lead {
  constructor({
    lead_id,
    customer_id,
    source,
    status,
    lead_score,
    conversion_prob,
    assigned_to,
    created_at,
  }) {
    this.lead_id = lead_id;
    this.customer_id = customer_id;
    this.source = source;
    this.status = status || "new";
    this.lead_score = lead_score || 0;
    this.conversion_prob = conversion_prob || 0.0;
    this.assigned_to = assigned_to;
    this.created_at = created_at || new Date();
  }

  updateStatus(newStatus) {
    this.status = newStatus;
  }
}

module.exports = Lead;
