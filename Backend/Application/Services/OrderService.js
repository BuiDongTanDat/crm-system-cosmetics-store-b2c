const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
const OrderDetailService = require('./OrderDetailService');
const { OrderRequestDTO, OrderResponseDTO } = require('../DTOs/OrderDTO');

class OrderService {

	
	// Tạo order (payload có thể chứa items)
	async createOrder(payload) {

		const dto = new OrderRequestDTO(payload);
		if (!dto.customer_id) throw new Error('Thiếu mã khách hàng');

		//Chuẩn hóa item, dùng bên OrderDetailService (DTO này chưa có order id nha)
		const items = Array.isArray(dto.items)
			? dto.items.map(i => OrderDetailService._normalizeDetail(i))
			: [];

		//Nếu chưa có total_amount hoặc = 0 thì tính lại
		if (!dto.total_amount || Number(dto.total_amount) === 0) {
			throw new Error('Thiếu tổng tiền (total_amount)');
		}

		// CHuẩn bị các trường bên Order
		const orderPayload = {
			customer_id: dto.customer_id,
			order_date: dto.order_date,
			total_amount: dto.total_amount,
			currency: dto.currency,
			payment_method: dto.payment_method,
			status: dto.status,
			channel: dto.channel,
			notes: dto.notes,
		};

		//Tạo order trước rồi lấy order_id để tạo details
		let createdOrder;
		let createDetails = [];
		const transaction = await OrderRepo.sequelize.transaction();
		try {
			createdOrder = await OrderRepo.create(orderPayload, transaction);
			//Tạo details nếu có (Lúc này gắn thêm cái  order_id mới tạo vào DTO)
			if (items.length > 0) {
				const detailsWithOrderId = items.map(i => ({
					...i,
					order_id: createdOrder.order_id,
				}));
				createDetails = await OrderDetailService.createMany(detailsWithOrderId, transaction);
			}

			await transaction.commit();
			return OrderResponseDTO.fromEntity(createdOrder, createDetails);
		} catch (err) {
			await transaction.rollback();
			throw new Error(`Tạo đơn hàng thất bại: ${err.message}`);
		}

	}

	// Lấy order theo id
	async getOrderById(orderId) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		const order = await OrderRepo.findById(orderId);
		if (!order) return null; // Để nữa bên controller 

		// Lấy details từ đơn hàng này
		let details = await OrderDetailService.getByOrderId(orderId);
		return OrderResponseDTO.fromEntity(order, details);
	}

	//Lấy tất cả order
	async getAllOrders() {
		try {
			const orders = await OrderRepo.findAll();
			// Nếu không có order nào thì trả mảng rỗng
			if (!orders || orders.length === 0) return [];

			// Với mỗi order, lấy thêm danh sách items
			const results = await Promise.all(
				orders.map(async (o) => {
					const orderId = o.order_id;
					const details = await OrderDetailService.getByOrderId(orderId);
					return OrderResponseDTO.fromEntity(o, details);
				})
			);

			return results;
		} catch (err) {
			throw new Error(`Lấy danh sách đơn hàng thất bại: ${err.message}`);
		}
	}

	// Cập nhật order (có thể kèm items để đồng bộ)
	async updateOrder(orderId, patch) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		const found = await OrderRepo.findById(orderId);
		if (!found) throw new Error('Mã đơn hàng không tồn tại');
		let items = patch.items || [];
		let total = patch.total_amount || 0;

		if (Array.isArray(items) && items.length > 0) {
			items = items.map(i => OrderDetailService._normalizeDetail(i));
			if (!total) {
				throw new Error('Thiếu tổng tiền (total_amount) khi cập nhật kèm items');
			}
		}

		const transaction = await OrderRepo.sequelize.transaction();
		try {
			await OrderRepo.update(
				orderId, {
				...patch,
				total_amount: total,
			}, transaction);

			// Để tiện thì xóa item cũ rồi add lại hết
			if (items.length > 0) {
				await OrderDetailService.deleteByOrderId(orderId, transaction);
				const itemsWithOrderId = items.map(i => ({
					...i,
					order_id: orderId,
				}));
				await OrderDetailService.createMany(itemsWithOrderId, transaction);
			}
			await transaction.commit();

			// Fetch updated order and details after commit
			const updatedOrder = await OrderRepo.findById(orderId);
			const details = await OrderDetailService.getByOrderId(orderId);
			return OrderResponseDTO.fromEntity(updatedOrder, details);
		}
		catch (err) {
			await transaction.rollback();
			console.error('Error during updateOrder transaction:', err);
			throw new Error(`Cập nhật đơn hàng thất bại: ${err.message}`);
		}
	}

	// Cập nhật trạng thái nhanh
	async updateStatus(orderId, newStatus) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		const transaction = await OrderRepo.sequelize.transaction();
		try {
			await OrderRepo.updateStatus(orderId, newStatus, transaction);
			await transaction.commit();

			// Fetch updated order after commit
			const updated = await OrderRepo.findById(orderId);
			return OrderResponseDTO.fromEntity(updated);
		} catch (err) {
			await transaction.rollback();
			throw new Error(`Cập nhật trạng thái đơn hàng thất bại: ${err.message}`);
		}
	}

	// Xóa order (kemf xoas details)
	async deleteOrder(orderId) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		const transaction = await OrderRepo.sequelize.transaction();
		try {
			await OrderDetailService.deleteByOrderId(orderId, transaction);
			await OrderRepo.delete(orderId, transaction);
			await transaction.commit();
			return true;
		}
		catch (err) {
			await transaction.rollback();
			throw new Error(`Xoá đơn hàng thất bại: ${err.message}`);
		}
	}

	// Liệt kê theo customer
	// Nếu customerId không được cung cấp -> trả về tất cả orders
	async listByCustomer(customerId = null, opts = {}) {
		try {
			// Lấy orders từ repo theo customerId
			const orders = await OrderRepo.listByCustomer(customerId, opts);
			if (!orders || orders.length === 0) return [];

			// Với mỗi order, lấy details và chuyển sang DTO
			const results = await Promise.all(
				orders.map(async (o) => {
					const details = await OrderDetailService.getByOrderId(o.order_id);
					return OrderResponseDTO.fromEntity(o, details);
				})
			);

			return results;
		} catch (err) {
			throw new Error(`Lấy danh sách đơn hàng theo khách hàng thất bại: ${err.message}`);
		}
	}
}

module.exports = new OrderService();