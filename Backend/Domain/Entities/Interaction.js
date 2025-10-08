class Interaction {
  constructor({
    interaction_id, customer_id, lead_id, type, channel,
    content, transcript, employee_id, sentiment_score, source_system, created_at
  }) {
    this.interaction_id = interaction_id;
    this.customer_id = customer_id;
    this.lead_id = lead_id;
    this.type = type;
    this.channel = channel;
    this.content = content;
    this.transcript = transcript || {};
    this.employee_id = employee_id;
    this.sentiment_score = sentiment_score || 0;
    this.source_system = source_system;
    this.created_at = created_at || new Date();
  }
}

module.exports = Interaction;
