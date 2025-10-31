const OrderDetailRepo = require('../../Infrastructure/Repositories/OrderDetailRepository');
const { OrderDetailRequestDTO, OrderDetailResponseDTO} = require('../../Application/DTOs/OrderDTO');
const ProductRepo = require('../../Infrastructure/Repositories/ProductRepository');


class OrderDetailService {

	// CHuẩn hóa detail từ request DTO về đúng cấu trúc trong DB
	_normalizeDetail(detail) {
		const dto = new OrderDetailRequestDTO(detail);
		return {
			order_id: dto.order_id || detail.order_id,
			product_id: dto.product_id,
			price_unit: dto.price_unit,
			price_original: dto.price_original,
			quantity: dto.quantity,
			discount: dto.discount,
			subtotal: dto.subtotal,
		};
	}
	// Tạo chi tiết đơn
	async createDetail(detail, transaction = null) {
		if (!detail || !detail.order_id || !detail.product_id) throw new Error('Mã đơn hàng và mã sản phẩm là bắt buộc phải có');
		const normalized = this._normalizeDetail(detail);
		const created = await OrderDetailRepo.create(normalized, transaction);

		const product = await ProductRepo.findById(normalized.product_id);
		const productName = product ? product.name : null;
		const responseDto = OrderDetailResponseDTO.fromEntity({
			...created,
			product_name: productName,
		});
		return responseDto;
	}

	// Tạo nhiều chi tiết
	async createMany(details, transaction = null) {
		if (!Array.isArray(details) || details.length === 0) return [];
		const normalizedList = details.map(d => this._normalizeDetail(d));
		const createdDetails = await OrderDetailRepo.createMany(normalizedList, transaction);
		return createdDetails.map(d => OrderDetailResponseDTO.fromEntity(d));
	}

	// Lấy theo order id
	async getByOrderId(orderId) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		const found = await OrderDetailRepo.findByOrderId(orderId);
		return OrderDetailResponseDTO.fromEntities(found);
	}

	// Xóa theo order id
	async deleteByOrderId(orderId, transaction = null) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		return OrderDetailRepo.deleteByOrderId(orderId, transaction);
	}

	// Lấy chi tiết theo id
	async getById(orderDetailId) {
		if (!orderDetailId) throw new Error('Thiếu mã đơn hàng chi tiết');
		const found = await OrderDetailRepo.findById(orderDetailId);
		return found ? OrderDetailResponseDTO.fromEntity(found) : null;
	}
}

module.exports = new OrderDetailService();