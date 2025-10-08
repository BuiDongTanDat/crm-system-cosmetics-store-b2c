class Order {
  constructor({
    order_id,
    customer_id,
    order_date,
    total_amount,
    currency,
    payment_method,
    status,
    channel,
    ai_suggested_crosssell,
    notes,
    created_at,
    updated_at,
  }) {
    this.order_id = order_id;
    this.customer_id = customer_id;
    this.order_date = order_date || new Date();
    this.total_amount = total_amount;
    this.currency = currency || "VND";
    this.payment_method = payment_method;
    this.status = status || "paid";
    this.channel = channel;
    this.ai_suggested_crosssell = ai_suggested_crosssell || [];
    this.notes = notes;
    this.created_at = created_at || new Date();
    this.updated_at = updated_at || new Date();
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.updated_at = new Date();
  }
}

module.exports = Order;
