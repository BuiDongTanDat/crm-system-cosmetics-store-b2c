const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
const OrderDetailService = require('./OrderDetailService');
const LeadService = require('./LeadService');
const { OrderRequestDTO, OrderResponseDTO } = require('../DTOs/OrderDTO');
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');

class OrderService {

	async createQuickOrder(payload = {}) {
		const hasIdentity = !!(payload.customer_id || payload.lead_id || payload.phone || payload.email);
		if (!hasIdentity) {
			throw new Error('MISSING_CONTACT: Thiếu customer_id/lead_id hoặc phone/email của khách');
		}
		let items = Array.isArray(payload.items) ? payload.items : [];

		if (!items.length && payload.default_product_id) {
			items = [{ product_id: payload.default_product_id, quantity: 1 }];
		}
		if (!items.length && payload.bundle_id) {
			if (!BundleService?.expand) {
				throw new Error('NO_ITEMS: Thiếu items; BundleService.expand chưa sẵn sàng');
			}
			items = await BundleService.expand(payload.bundle_id); // -> [{product_id, quantity}, ...]
		}
		if (!items.length) {
			throw new Error('NO_ITEMS: Thiếu danh sách sản phẩm');
		}
		// --- 2) Enrich giá + kiểm tồn nếu có service (khuyến nghị) ---
		let enriched = items;
		if (PricingInventoryService?.enrichAndValidate) {
			// expect trả về [{ product_id, quantity, unit_price, discount?, total_price, price_original? }]
			enriched = await PricingInventoryService.enrichAndValidate(items);
		} else {
			// Fallback: đảm bảo có unit_price/total_price từ client
			enriched = items.map((it) => {
				const unit = Number(it.unit_price ?? it.price ?? 0);
				if (!unit) throw new Error(`PRICE_NOT_FOUND: Không xác định được giá cho sản phẩm ${it.product_id}`);
				const qty = Number(it.quantity || 1);
				const total = Number(it.total_price ?? (qty * unit));
				return {
					product_id: it.product_id,
					product_name: it.product_name || null,
					quantity: qty,
					unit_price: unit,
					discount: Number(it.discount || 0),        // 0..1
					price_original: it.price_original ?? null, // optional
					total_price: total
				};
			});
		}

		// --- 3) Tính tổng tiền ---
		const totalAmount = enriched.reduce((s, it) => s + Number(it.total_price || 0), 0);
		if (!totalAmount || totalAmount <= 0) {
			throw new Error('Thiếu tổng tiền sau khi tính items');
		}
		const quickPayload = {
			// Nhận diện – để createOrder tự JIT convert/ghép customer:
			customer_id: payload.customer_id || null,
			lead_id: payload.lead_id || null,
			full_name: payload.full_name || payload.name || null,
			phone: payload.phone || null,
			email: payload.email || null,
			created_by: payload.created_by || null,

			// Order content
			items: enriched,
			total_amount: totalAmount,
			payment_method: payload.payment_method || 'cash_on_delivery',
			status: payload.status || 'draft_cart',
			channel: payload.channel || 'quick_order',
			notes: payload.notes || '',
			order_date: new Date().toISOString(),

			currency: payload.currency || 'VND',
		};

		// gọi hàm createOrder có sẵn để hưởng transaction/DTO/log
		const created = await this.createOrder(quickPayload);
		return created; // OrderResponseDTO
	}
	// Tạo order (payload có thể chứa items)
	async createOrder(payload) {
		const {
			lead_id,
			full_name,
			name,
			phone,
			email,
			created_by,
		} = (payload || {});

		if (!payload?.customer_id) {
			let resolvedCustomer = null;

			if (lead_id) {
				const { ok, data, error } = await LeadService.autoConvertLead(lead_id, {
					orderId: null,
					by: created_by || null,
					customerPatch: { source: 'order_checkout' },
				});
				if (!ok) {
					throw new Error(`Convert lead thất bại: ${error?.message || error?.code || 'AUTO_CONVERT_FAILED'}`);
				}
				resolvedCustomer = data?.customer;
				payload.customer_id = resolvedCustomer?.customer_id;
			} else {
				// Bổ sung validate email/phone – nếu trùng thì gán customer_id đó
				let exist = null;

				if (email) exist = await customerRepository.findByEmail(email);
				if (!exist && phone) exist = await customerRepository.findByPhone(phone);

				if (exist) {
					// Nếu đã có khách hàng trùng email hoặc phone
					payload.customer_id = exist.customer_id;
					resolvedCustomer = exist;
				} else {
					const candidate = {
						name: full_name || name || 'Guest',
						phone: phone || null,
						email: email || null,
						source: 'guest_checkout',
					};
					resolvedCustomer = await customerRepository.findOrCreateSmart(candidate);
					payload.customer_id = resolvedCustomer?.customer_id;
				}
			}
		}


		const dto = new OrderRequestDTO(payload);
		if (!dto.customer_id) throw new Error('Thiếu mã khách hàng');

		const items = Array.isArray(dto.items)
			? dto.items.map(i => OrderDetailService._normalizeDetail(i))
			: [];

		if (!dto.total_amount || Number(dto.total_amount) === 0) {
			throw new Error('Thiếu tổng tiền (total_amount)');
		}

		const orderPayload = {
			lead_id: dto.lead_id,
			customer_id: dto.customer_id,
			order_date: dto.order_date,
			total_amount: dto.total_amount,
			currency: dto.currency,
			payment_method: dto.payment_method,
			status: dto.status || 'draft_cart',
			channel: dto.channel,
			notes: dto.notes,
		};

		let createdOrder;
		let createDetails = [];
		const transaction = await OrderRepo.sequelize.transaction();

		try {
			createdOrder = await OrderRepo.create(orderPayload, transaction);

			if (items.length > 0) {
				const detailsWithOrderId = items.map(i => ({
					...i,
					order_id: createdOrder.order_id,
				}));
				createDetails = await OrderDetailService.createMany(detailsWithOrderId, transaction);
			}

			await transaction.commit();
			// ---- Publish event after commit (optional) ----
			try {
				await Rabbit.publish('order.created', {
					order_id: createdOrder.order_id,
					customer_id: createdOrder.customer_id,
					lead_id: createdOrder.lead_id || null,
					total_amount: createdOrder.total_amount,
					currency: createdOrder.currency || 'VND',
					status: createdOrder.status,
					channel: createdOrder.channel,
					order_date: createdOrder.order_date,
					item_count: Array.isArray(createDetails) ? createDetails.length : 0,
				});
			} catch (e) {
				console.error('[RabbitMQ] Failed to publish order.created:', e?.message || e);
			}
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

		// Lấy tên khách hàng
		const res = await customerRepository.findById(order.customer_id);
		if (res) {
			order.customer_name = res.full_name;
		}
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
					// Lấy customer name
					const res = await customerRepository.findById(o.customer_id);
					if (res) {
						o.customer_name = res.full_name;
					}
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
	async getByLeadId(leadId) {
		if (!leadId) throw new Error('Thiếu lead_id');// tuỳ bạn: trả đơn mới nhất của lead
		const order = await OrderRepo.findByLeadIdLatest(leadId);
		return order ? OrderResponseDTO.fromEntity(order) : null;
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
			// ---- Publish event after commit ----
			try {
				const statusNorm = String(newStatus || '').toLowerCase();
				if (statusNorm === 'paid' || statusNorm === 'payment_success' || statusNorm === 'completed') {
					const payload = {
						order_id: updated.order_id,
						customer_id: updated.customer_id,
						lead_id: updated.lead_id || null,
						total_amount: updated.total_amount,
						currency: updated.currency || 'VND',
						payment_method: updated.payment_method || null,
						channel: updated.channel || null,
						order_date: updated.order_date || null,
						status: updated.status,
					};
					await Rabbit.publish('order.paid', payload);
					console.log('[RabbitMQ] Published order.paid event for order:', payload);
				}
			} catch (e) {
				console.error('[RabbitMQ] Failed to publish order status event:', e?.message || e);
			}
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
	async addItem(orderId, item) {
		if (!orderId) throw new Error('Thiếu order_id');
		const o = await OrderRepo.findById(orderId);
		if (!o) throw new Error('Order không tồn tại');
		if (o.status !== 'draft_cart') throw new Error('Chỉ thêm sản phẩm khi ở trạng thái draft_cart');

		const norm = OrderDetailService._normalizeDetail(item);
		const t = await OrderRepo.sequelize.transaction();
		try {
			await OrderDetailService.createMany([{ ...norm, order_id: orderId }], { transaction: t });
			// Tính lại total nhanh:
			const details = await OrderDetailService.getByOrderId(orderId, { transaction: t });
			const total = details.reduce((s, d) => s + Number(d.line_total || d.total_price || 0), 0);
			await OrderRepo.update(orderId, { total_amount: total }, { transaction: t });
			await t.commit();
			const updatedOrder = await OrderRepo.findById(orderId);
			const updatedDetails = await OrderDetailService.getByOrderId(orderId);
			return OrderResponseDTO.fromEntity(updatedOrder, updatedDetails);
		} catch (err) {
			await t.rollback();
			throw err;
		}
	}
}

module.exports = new OrderService();