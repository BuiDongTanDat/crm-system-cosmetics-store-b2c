class OrderDetail {
  constructor({ order_detail_id, order_id, product_id, quantity, price_unit, discount, created_at }) {
    this.order_detail_id = order_detail_id;
    this.order_id = order_id;
    this.product_id = product_id;
    this.quantity = quantity;
    this.price_unit = price_unit;
    this.discount = discount || 0;
    this.created_at = created_at || new Date();
  }
}

module.exports = OrderDetail;
