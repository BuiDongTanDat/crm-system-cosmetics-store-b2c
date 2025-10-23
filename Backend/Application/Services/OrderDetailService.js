const OrderDetailRepo = require('../../Infrastructure/Repositories/OrderDetailRepository');

class OrderDetailService {
	// Tạo chi tiết đơn
	async createDetail(detail, transaction = null) {
		if (!detail || !detail.order_id || !detail.product_id) throw new Error('Mã đơn hàng và mã sản phẩm là bắt buộc phải có');
		return OrderDetailRepo.create(detail, transaction);
	}

	// Tạo nhiều chi tiết
	async createMany(details, transaction = null) {
		if (!Array.isArray(details) || details.length === 0) return [];
		return OrderDetailRepo.createMany(details, transaction);
	}

	// Lấy theo order id
	async getByOrderId(orderId) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		return OrderDetailRepo.findByOrderId(orderId);
	}

	// Xóa theo order id
	async deleteByOrderId(orderId, transaction = null) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		return OrderDetailRepo.deleteByOrderId(orderId, transaction);
	}

	// Lấy chi tiết theo id
	async getById(orderDetailId) {
		if (!orderDetailId) throw new Error('Thiếu mã đơn hàng chi tiết');
		return OrderDetailRepo.findById(orderDetailId);
	}
}

module.exports = new OrderDetailService();