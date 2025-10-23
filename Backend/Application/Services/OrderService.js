const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');

class OrderService {
	// helper: chuẩn hoá 1 item về shape DB và đảm bảo kiểu
	_normalizeItem(it) {
		if (!it) return null;
		const quantity = Number(it.quantity ?? it.qty ?? 0);
		// support both unit_price and price_unit from client
		const price_unit = Number(it.price_unit ?? it.unit_price ?? it.price ?? 0);
		const discount = Number(it.discount ?? 0) || 0;
		return {
			...it,
			quantity,
			price_unit,
			discount,
		};
	}

	// helper: tính tổng từ items (price_unit * qty * (1 - discount))
	_computeTotal(items = []) {
		let total = 0;
		for (const raw of items) {
			const it = this._normalizeItem(raw);
			const line = Math.max(0, (Number(it.price_unit) || 0) * (Number(it.quantity) || 0) * (1 - (Number(it.discount) || 0)));
			total += line;
		}
		return total;
	}

	// Tạo order (payload có thể chứa items)
	async createOrder(payload) {
		// Validate basic payload
		if (!payload || !payload.customer_id) throw new Error('Thiếu mã khách hàng');

		// ensure items is array
		const items = Array.isArray(payload.items) ? payload.items.map(i => this._normalizeItem(i)) : [];

		// Basic per-item validation
		for (const it of items) {
			if (!it.product_id) throw new Error('Mỗi item cần product_id');
			if (typeof it.quantity === 'undefined' || Number.isNaN(Number(it.quantity))) throw new Error('Mỗi item cần quantity hợp lệ');
			if (typeof it.price_unit === 'undefined' || Number.isNaN(Number(it.price_unit))) throw new Error('Mỗi item cần price_unit hợp lệ');
		}

		// compute total if missing or zero
		if (payload.total_amount == null || Number(payload.total_amount) === 0) {
			const computed = this._computeTotal(items);
			payload.total_amount = computed;
		}

		// attach normalized items to payload using DB field names
		const sendPayload = { ...payload, items };

		return OrderRepo.create(sendPayload);
	}

	// Lấy order theo id
	async getOrder(orderId) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		return OrderRepo.findById(orderId);
	}

	//Lấy tất cả order
	async getAllOrders() {
		try {
			return await OrderRepo.findAll();
		} catch (err) {
			// fallback: retry without includes if repository/ORM complains (kept for compatibility)
			if (err && (err.name === 'SequelizeEagerLoadingError' || /is not associated/i.test(String(err.message)))) {
				return OrderRepo.findAll({ include: [] }).catch(() => { throw err; });
			}
			throw err;
		}
	}

	// Cập nhật order (có thể kèm items để đồng bộ)
	async updateOrder(orderId, patch) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		const patched = { ...patch };
		let items = null;
		if (Array.isArray(patch.items)) {
			items = patch.items.map(i => this._normalizeItem(i));
			// validate items
			for (const it of items) {
				if (!it.product_id) throw new Error('Mỗi item cần product_id');
				if (typeof it.quantity === 'undefined' || Number.isNaN(Number(it.quantity))) throw new Error('Mỗi item cần quantity hợp lệ');
				if (typeof it.price_unit === 'undefined' || Number.isNaN(Number(it.price_unit))) throw new Error('Mỗi item cần price_unit hợp lệ');
			}
			patched.items = items;
			// recalc total when items provided
			patched.total_amount = this._computeTotal(items);
		}
		return OrderRepo.update(orderId, patched);
	}

	// Cập nhật trạng thái nhanh
	async updateStatus(orderId, newStatus) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		return OrderRepo.updateStatus(orderId, newStatus);
	}

	// Xóa order
	async deleteOrder(orderId) {
		if (!orderId) throw new Error('Thiếu mã đơn hàng');
		return OrderRepo.delete(orderId);
	}

	// Liệt kê theo customer (opts có thể chứa status)
	// Nếu customerId không được cung cấp -> trả về tất cả orders
	async listByCustomer(customerId = null, opts = {}) {
		if (!customerId) {
			// no customer specified -> return all orders (allow passing opts like limit/offset)
			return OrderRepo.findAll(opts);
		}
		return OrderRepo.listByCustomer(customerId, opts);
	}
}

module.exports = new OrderService();