class CreateOrderRequestDTO {
  constructor({ customerId, totalAmount, paymentMethod, items }) {
    this.customerId = customerId;
    this.totalAmount = totalAmount;
    this.paymentMethod = paymentMethod;
    this.items = items; // [{productId, quantity, price, discount}]
  }
}

class UpdateOrderStatusRequestDTO {
  constructor({ status, notes }) {
    this.status = status;
    this.notes = notes;
  }
}

class OrderResponseDTO {
  constructor(order) {
    this.id = order.order_id;
    this.customerId = order.customer_id;
    this.status = order.status;
    this.totalAmount = order.total_amount;
    this.channel = order.channel;
    this.createdAt = order.created_at;
    this.aiSuggestions = order.ai_suggested_crosssell;
  }
}

module.exports = { CreateOrderRequestDTO, UpdateOrderStatusRequestDTO, OrderResponseDTO };
