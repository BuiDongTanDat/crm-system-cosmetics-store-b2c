const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
const OrderDetailService = require('./OrderDetailService');
const LeadService = require('./LeadService');
const leadRepository = require('../../Infrastructure/Repositories/LeadRepository');
const { OrderRequestDTO, OrderResponseDTO } = require('../DTOs/OrderDTO');
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');
const productRepository = require('../../Infrastructure/Repositories/ProductRepository');
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
		let enriched = items;
		if (PricingInventoryService?.enrichAndValidate) {
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
					price_original: it.price_original ?? (it.price_original || 0),
					image: it.image || null,
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
				const lead = await leadRepository.findById(lead_id);
				if (!lead) throw new Error('LEAD_NOT_FOUND: lead_id không tồn tại');
				const leadEmail = lead.email || email || null;
				const leadPhone = lead.phone || phone || null;
				const leadName = lead.name || full_name || name || 'Guest';
				let exist = null;
				if (leadEmail) exist = await customerRepository.findByEmail(leadEmail);
				if (!exist && leadPhone) exist = await customerRepository.findByPhone(leadPhone);

				if (exist) {
					payload.customer_id = exist.customer_id;
					resolvedCustomer = exist;
				} else {
					// 3) Tạo customer record để gắn order
					// ===== FIX QUAN TRỌNG: Customer cần full_name, KHÔNG phải name =====
					resolvedCustomer = await customerRepository.findOrCreateSmart({
						full_name: leadName || 'Guest',
						phone: leadPhone || null,
						email: leadEmail || null,
						email: leadEmail || null,
						source: 'order_checkout',
						assigned_to: lead.assigned_to || null,
						address: payload.shipping_address || null,
					});
					payload.customer_id = resolvedCustomer?.customer_id;
					if (!payload.customer_id) throw new Error('CUSTOMER_CREATE_FAILED: Không tạo được customer_id');
				}
				payload.lead_id = lead_id;

			} else {
				let exist = null;

				if (email) exist = await customerRepository.findByEmail(email);
				if (!exist && phone) exist = await customerRepository.findByPhone(phone);

				if (exist) {
					payload.customer_id = exist.customer_id;
					resolvedCustomer = exist;
				} else {
					// User Requirement: "tạo dữ liệu lead cho người này trước"
					// Create Lead instead of Customer if guest
					const rawItems = Array.isArray(payload.items) ? payload.items : [];
					const productNames = rawItems.map(i => i.product_name || i.name || i.product_id).join(', ');
					const productIds = rawItems.map(i => i.product_id).filter(Boolean);

					const leadPayload = {
						name: full_name || name || 'Guest Lead',
						phone: phone || null,
						email: email || null,
						source: 'web_checkout',
						status: 'new',
						tags: ['guest_checkout', 'order_pending'],
						product_interest: productNames, // List of products
						product_ids: productIds,        // Logic to create Interest records
						note: `Khách đặt hàng.\nĐịa chỉ: ${payload.shipping_address || 'N/A'}.\nSP quan tâm: ${productNames}.\nGhi chú KH: ${payload.note || 'Không có'}`,
						// We can store address in meta or note, Customer creation will use shipping_address later
					};
					try {
						// Requires LeadService instance or import
						// Assuming LeadService is imported as class or instance. 
						// File top imports: const LeadService = require('./LeadService'); is Class or Instance?
						// checking top of file... `const LeadService = require('./LeadService');` (Step 499)
						// LeadService file exports class? `module.exports = new LeadService()` or class?
						// Wait, checking bottom of LeadService.js...
						const newLeadRes = await LeadService.createLead(leadPayload);
						if (newLeadRes?.ok && newLeadRes.data?.lead_id) {
							payload.lead_id = newLeadRes.data.lead_id;
						} else {
							// Fallback if lead creation fails?
							console.warn('Failed to create lead for guest checkout, proceeding as anonymous?');
						}
					} catch (e) {
						console.error('Lead creation error:', e);
					}

					// Maintain null customer_id to await conversion on Paid
				}
			}
		}
		const dto = new OrderRequestDTO(payload);
		// Relax validation: Allow if lead_id is present
		if (!dto.customer_id && !dto.lead_id) throw new Error('Thiếu mã khách hàng hoặc Lead ID');
		const items = Array.isArray(dto.items)
			? dto.items.map(i => OrderDetailService._normalizeDetail(i))
			: [];

		if (!dto.total_amount || Number(dto.total_amount) === 0) {
			// Try to calc from items
			const calcTotal = items.reduce((sum, it) => sum + (it.price_unit * it.quantity), 0);
			if (calcTotal > 0) {
				payload.total_amount = calcTotal;
				dto.total_amount = calcTotal;
			} else {
				// Keep error if still 0, or just allow 0 for draft/free orders? 
				// User specific error "Thiếu tổng tiền" so implies it should be there.
				throw new Error('Thiếu tổng tiền (total_amount) và không thể tính từ sản phẩm');
			}
		}

		const orderPayload = {
			lead_id: dto.lead_id,
			customer_id: dto.customer_id,
			order_date: dto.order_date,
			total_amount: dto.total_amount,
			currency: dto.currency,
			payment_method: dto.payment_method || 'cash_on_delivery',
			status: dto.status || 'draft_cart',
			channel: dto.channel,
			campaign_id: payload.campaign_id || null,
			channel_id: payload.channel_id || null,
			shipping_address: dto.shipping_address,
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

			// Publish event after commit
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
					items: (createDetails || []).map(d => ({
						product_id: d.product_id,
						quantity: d.quantity,
						unit_price: d.unit_price,
						line_total: d.line_total,
						product_name: d.product_name,
						image_url: d.image_url,
					})),
				});
			} catch (e) {
				console.error('[RabbitMQ] Failed to publish order.created:', e?.message || e);
			}

			// Attribution Tracking
			if (createdOrder.channel_id) {
				try {
					// Lazy load to avoid circular dependency if any
					const CampaignChannelRepo = require('../../Infrastructure/Repositories/CampaignChannelRepository');
					await CampaignChannelRepo.incById(createdOrder.channel_id, {
						conversions: 1,
						revenue: Number(createdOrder.total_amount || 0)
					});
					console.log(`[Attribution] Updated stats for channel ${createdOrder.channel_id}`);
				} catch (e) {
					console.warn('[Attribution] Failed to update stats:', e?.message || e);
				}
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
		details = await this.enrichOrderDetails(details);

		//console.log('Details after adding product_name:', details);
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
					console.log('Customer fetch result:', res);
					if (res) {
						o.customer_name = res.full_name;
					}
					let details = await OrderDetailService.getByOrderId(orderId);
					details = await this.enrichOrderDetails(details);
					return OrderResponseDTO.fromEntity(o, details);
				})
			);

			return results;
		} catch (err) {
			throw new Error(`Lấy danh sách đơn hàng thất bại: ${err.message}`);
		}
	}

	//Hàm hỗ trợ lấy product_name cho từng detail
	async enrichOrderDetails(details) {
		return Promise.all(
			details.map(async (detail) => {
				if (!detail.product_id) return detail;

				const product = await productRepository.findNameAndImageById(
					detail.product_id
				);

				if (product) {
					detail.product_name = product.name;
					detail.image = product.image || null;
				}

				return detail;
			})
		);
	}


	// Cập nhật order (có thể kèm items để đồng bộ)
	async updateOrder(orderId, patch) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		const found = await OrderRepo.findById(orderId);
		if (!found) throw new Error('Mã đơn hàng không tồn tại');


		// determine status transition
		const preStatus = found.status || '';
		const newStatus = patch.status || preStatus;
		const items = patch.items || [];

		// Chặn nếu đơn đã thanh toán thì không được sửa sản phẩm
		if (this._isPaidStatus(preStatus) && items.length > 0) {
			throw new Error('Không thể cập nhật sản phẩm trên đơn hàng đã thanh toán');
		}

		// 2. XÁC ĐỊNH LOGIC KHO (Để thực hiện trừ hoặc hoàn kho)
		const isTransitioningToPaid = !this._isPaidStatus(preStatus) && this._isPaidStatus(newStatus);
		const isTransitioningToRestock = this._isPaidStatus(preStatus) && this._isRestockStatus(newStatus);


		const transaction = await OrderRepo.sequelize.transaction();
		try {
			await OrderRepo.update(
				orderId, {
				...patch,
			}, transaction);

			// Để tiện thì xóa item cũ rồi add lại hết (nếu có)
			if (items.length > 0) {
				await OrderDetailService.deleteByOrderId(orderId, transaction);
				const itemsWithOrderId = items.map(i => ({
					...i,
					order_id: orderId,
				}));
				await OrderDetailService.createMany(itemsWithOrderId, transaction);
			}

			// XỬ LÝ KHO
			if (isTransitioningToPaid) {
				// Trường hợp chuyển sang Paid -> Trừ kho
				// Truyền mảng rỗng [] để tránh items không tồn tại, trong hàm có logic tự query DB
				await this._handleInventoryDeduction(orderId, items, transaction);
			} else if (isTransitioningToRestock) {
				// Trường hợp chuyển sang Cancelled/Failed (từ trạng thái đã Paid) -> Hoàn kho
				await this._handleInventoryRestock(orderId, transaction);
			}
			await transaction.commit();

			// Fetch updated order and details after commit
			const updatedOrder = await OrderRepo.findById(orderId);
			const details = await OrderDetailService.getByOrderId(orderId);

			// Lấy customer name
			const res = await customerRepository.findById(updatedOrder.customer_id);
			if (res) {
				updatedOrder.customer_name = res.full_name;
			}
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
	async updateStatus(orderId, newStatus, extraData = {}) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');

		// 1. Lấy trạng thái đơn hàng hiện tại trước khi update
		const existingOrder = await OrderRepo.findById(orderId);
		if (!existingOrder) throw new Error('Mã đơn hàng không tồn tại');

		const preStatus = existingOrder.status || '';

		// 2. XÁC ĐỊNH LOGIC KHO (Để thực hiện trừ hoặc hoàn kho)
		const isTransitioningToPaid = !this._isPaidStatus(preStatus) && this._isPaidStatus(newStatus);
		// Trạng thái restock là trạng thái khi đơn hàng đã thanh toán rồi và bị hủy/hoàn tiền
		const isTransitioningToRestock = this._isPaidStatus(preStatus) && this._isRestockStatus(newStatus);


		const transaction = await OrderRepo.sequelize.transaction();

		try {
			// Cập nhật các thông tin cơ bản
			const updatePayload = { status: newStatus };
			if (extraData.payment_method) updatePayload.payment_method = extraData.payment_method;
			if (extraData.shipping_address) updatePayload.shipping_address = extraData.shipping_address;
			if (extraData.total_amount) updatePayload.total_amount = extraData.total_amount;

			// Utilise OrderRepo.update which likely maps to Model.update
			// If OrderRepo.updateStatus is specific, we might need OrderRepo.update
			await OrderRepo.update(orderId, updatePayload, transaction);

			// XỬ LÝ KHO
			if (isTransitioningToPaid) {
				// Truyền mảng rỗng [] thay vì items không tồn tại. 
				// Hàm _handleInventoryDeduction đã có logic tự query DB nếu mảng rỗng.
				await this._handleInventoryDeduction(orderId, [], transaction);
			} else if (isTransitioningToRestock) {
				await this._handleInventoryRestock(orderId, transaction);
			}

			await transaction.commit();

			// 4. XỬ LÝ SAU KHI CẬP NHẬT: Publish event nếu cần
			const updated = await OrderRepo.findById(orderId);

			try {
				const statusNorm = String(newStatus || '').toLowerCase();
				const isPaid =
					statusNorm === 'paid' ||
					statusNorm === 'payment_success' ||
					statusNorm === 'completed';

				if (isPaid) {
					// 2.1 Convert lead (nếu order gắn lead)
					if (updated?.lead_id) {
						const conv = await LeadService.autoConvertLead(updated.lead_id, {
							orderId: updated.order_id,
							by: updated.created_by || null,              // nếu order có created_by
							customerPatch: {
								source: 'order_paid',
								address: updated.shipping_address
							},
						});

						if (!conv?.ok) {
							console.warn('[Lead] Auto-convert failed on paid:', conv?.error?.message || conv?.error);
						} else {
							// Link new customer to order
							const newCust = conv.data?.customer || conv.data || {};
							const newCustId = newCust.customer_id || newCust.id;
							if (newCustId) {
								await OrderRepo.update(orderId, { customer_id: newCustId });
								updated.customer_id = newCustId; // Update local instance for event
							}
						}
					}
					// 2.2 Publish order.paid như bạn đang làm
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
				console.error('[Paid Flow] Failed:', e?.message || e);
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

	async getOrdersByDateRange(from, to) {
		try {
			const orders = await OrderRepo.getOrdersByDateRange(from, to);
			if (!orders || orders.length === 0) return [];
			const results = await Promise.all(
				orders.map(async (o) => {
					const details = await OrderDetailService.getByOrderId(o.order_id);
					return OrderResponseDTO.fromEntity(o, details);
				})
			);
			return results;
		} catch (err) {
			throw new Error(`Lấy đơn hàng theo khoảng ngày thất bại: ${err.message}`);
		}
	}

	async lookup({ email, phone }) {
		if (!email && !phone) throw new Error('Vui lòng cung cấp Email hoặc Số điện thoại');

		// Find customers matching email/phone
		let customerIds = [];
		if (email) {
			const c = await customerRepository.findByEmail(email);
			if (c) customerIds.push(c.customer_id);
		}
		if (phone) {
			const c = await customerRepository.findByPhone(phone);
			if (c) customerIds.push(c.customer_id);
		}



		// Also check if Leads (if we want to support un-converted leads orders, though usually orders have customer_id)
		// For now, simpler to rely on customer_id as createOrder ensures customer creation.

		if (customerIds.length === 0) return [];

		// De-duplicate
		customerIds = [...new Set(customerIds)];

		const allOrders = [];
		for (const cid of customerIds) {
			const orders = await OrderRepo.listByCustomer(cid); // Re-use listByCustomer
			if (orders) allOrders.push(...orders);
		}

		// Sort by date desc
		allOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

		// Return DTOs
		const results = await Promise.all(
			allOrders.map(async (o) => {
				let details = await OrderDetailService.getByOrderId(o.order_id);
				// THêm chỗ này để lấy tên khách hàng
				if (o.customer_id) {
					const customer = await customerRepository.findById(o.customer_id);
					if (customer) {
						o.customer_name = customer.full_name;
					}
				}
				// Enrich with product info
				if (details && details.length > 0) {
					details = await Promise.all(details.map(async (detail) => {
						if (detail.product_id) {
							const product = await productRepository.findNameAndImageById(detail.product_id);
							if (product) {
								detail.product_name = product.name;
								detail.image = product.image || null;
							}
						}
						return detail;
					}));
				}
				return OrderResponseDTO.fromEntity(o, details);
			})
		);
		return results;
	}


	// Hàm hỗ trợ trừ tồn kho
	async _handleInventoryDeduction(orderId, items = [], transaction) {
		// 1. Nếu không có items truyền vào, lấy từ database
		let details = items;
		if (!details || details.length === 0) {
			details = await OrderDetailService.getByOrderId(orderId, { transaction });
		}

		if (!Array.isArray(details) || details.length === 0) return;

		// 2. Kiểm tra tồn kho trước cho tất cả sản phẩm
		for (const d of details) {
			if (!d.product_id) continue;
			const qtyNeeded = Number(d.quantity || 0);
			const product = await productRepository.findById(d.product_id);
			const avail = Number(product?.inventory_qty || 0);

			if (avail < qtyNeeded) {
				throw new Error(`Sản phẩm ${product?.name || d.product_id} chỉ còn ${avail}, yêu cầu ${qtyNeeded}`);
			}
		}

		// 3. Thực hiện trừ kho
		for (const d of details) {
			if (!d.product_id) continue;
			const qtyNeeded = Number(d.quantity || 0);

			// Gọi repo để trừ 
			const success = await productRepository.decreaseInventory(d.product_id, qtyNeeded, transaction);
			if (!success) {
				throw new Error(`DECREASE_FAILED: Không thể trừ tồn kho cho sản phẩm ${d.product_id}`);
			}
		}
	}

	//Hàm hỗ trợ hoàn kho
	async _handleInventoryRestock(orderId, transaction) {
		const details = await OrderDetailService.getByOrderId(orderId, { transaction });
		if (!details || details.length === 0) return;

		for (const d of details) {
			if (!d.product_id) continue;
			const qtyToRestore = Number(d.quantity || 0);

			// Gọi repo để cộng lại tồn kho (Atomic update: qty = qty + x)
			// Bạn cần đảm bảo productRepository có hàm increaseInventory
			const success = await productRepository.increaseInventory(d.product_id, qtyToRestore, transaction);

			if (!success) {
				console.error(`Không thể cộng lại kho cho SP ${d.product_id}`);
				// Thường thì restock nên cố gắng thực hiện hết các item
			}
		}
		console.log(`Đã hoàn tồn kho cho đơn hàng: ${orderId}`);
	}


	// Kiểm tra xem trạng thái có được coi là "Đã thanh toán/Hợp lệ" để trừ kho không
	_isPaidStatus(status) {
		const paidStatuses = ['paid', 'shipped', 'completed', 'processing'];
		return paidStatuses.includes(String(status).toLowerCase());
	}

	// Kiểm tra trạng thái có cần restock không
	_isRestockStatus(status) {
		// Nếu đơn bị hủy, trả hàng (refunded), hoặc thanh toán thất bại sau khi đã trừ kho
		// Nghĩa là chỉ cần đơn hàng rời khỏi nhóm trạng thái "đã thanh toán" thì cứ hoàn kho
		const restockStatuses = [
			'pending',
			'cancelled',
			'failed',
			'refunded',
			'draft_cart',
			'awaiting_customer_confirmation'
		];
		return restockStatuses.includes(String(status || '').toLowerCase());
	}
}


module.exports = new OrderService();