// Request DTOs
class OrderDetailRequestDTO {
	constructor(detail = {}) {
		this.product_id = detail.product_id || null;
		this.product_name = detail.product_name || null;
		this.quantity = Number(detail.quantity) || 0;
		this.discount = Number(detail.discount) || 0;
		this.price_original = Number(detail.price_original) || 0;
		this.price_unit = Number(detail.unit_price ?? detail.price_unit) || 0;
		this.subtotal = Number(detail.total_price ?? (this.quantity * this.price_unit)) || 0;
	}
}

class OrderRequestDTO {
	constructor(order = {}) {
		this.lead_id = order.lead_id || null;
		this.customer_id = order.customer_id || null;
		this.order_date = order.order_date || new Date().toISOString();
		this.total_amount = Number(order.total_amount) || 0;
		this.currency = order.currency || 'VND';
		this.payment_method = order.payment_method || null;
		this.status = order.status || 'pending';
		this.channel = order.channel || null;
		this.notes = order.notes || null;
		this.items = Array.isArray(order.items)
			? order.items.map(item => new OrderDetailRequestDTO(item))
			: [];
	}

	static fromRequest(reqBody) {
		return new OrderRequestDTO(reqBody);
	}
}

// Response DTOs
class OrderDetailResponseDTO {
	constructor(detail = {}) {
		this.order_detail_id = detail.order_detail_id || null;
		this.order_id = detail.order_id || null;
		this.product_id = detail.product_id || null;
		this.product_name = detail.product_name || null; // Đảm bảo ánh xạ product_name
		this.price_unit = Number(detail.price_unit) || 0;
		this.price_original = Number(detail.price_original) || 0;
		this.quantity = Number(detail.quantity) || 0;
		this.discount = Number(detail.discount) || 0;
		// Sửa subtotal: không áp dụng chiết khấu hai lần
		this.subtotal = Number(detail.subtotal ?? (this.quantity * this.price_unit)) || 0;
		this.created_at = detail.created_at || null;
		this.updated_at = detail.updated_at || null;
	}

	static fromEntity(entity) {
		return new OrderDetailResponseDTO(entity);
	}

	static fromEntities(details = []) {
		return details.map(d => new OrderDetailResponseDTO(d));
	}
}

class OrderResponseDTO {
	constructor(order = {}, details = []) {
		this.order_id = order.order_id || null;
		this.customer_id = order.customer_id || null;
		this.customer_name = order.customer_name || null; // Đảm bảo ánh xạ customer_name
		this.status = order.status || null;
		this.order_date = order.order_date || null;

		this.items = OrderDetailResponseDTO.fromEntities(details.length ? details : order.items || []);
		this.total_amount =
			Number(order.total_amount) ||
			this.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
		this.total = this.total_amount;

		this.currency = order.currency || null;
		this.payment_method = order.payment_method || null;
		this.channel = order.channel || null;
		this.ai_suggested_crosssell = order.ai_suggested_crosssell || [];
		this.notes = order.notes || null;
		this.created_at = order.created_at || null;
		this.updated_at = order.updated_at || null;
	}

	static fromEntity(order, details = []) {
		return new OrderResponseDTO(order, details);
	}

	static fromEntities(orders = []) {
		return orders.map(o => new OrderResponseDTO(o));
	}
}

module.exports = {
	OrderRequestDTO,
	OrderDetailRequestDTO,
	OrderResponseDTO,
	OrderDetailResponseDTO
};
