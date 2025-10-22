// DTO trả về Order và OrderDetail
const getField = (obj, ...keys) => {
	// trả về giá trị trường đầu tồn tại trong obj (hỗ trợ snake_case và camelCase)
	if (obj == null) return undefined;

	const tryKeys = (target) => {
		if (!target) return undefined;
		for (const k of keys) {
			if (Object.prototype.hasOwnProperty.call(target, k) && target[k] !== undefined) return target[k];
		}
		return undefined;
	};

	// 1) thử trực tiếp trên obj
	let val = tryKeys(obj);
	if (val !== undefined) return val;

	// 2) thử trên obj.dataValues (Sequelize instances thường chứa data ở đây)
	val = tryKeys(obj.dataValues);
	if (val !== undefined) return val;

	// 3) nếu obj là Sequelize instance, thử lấy plain object từ get({ plain: true })
	if (typeof obj.get === 'function') {
		try {
			const plain = obj.get({ plain: true });
			val = tryKeys(plain);
			if (val !== undefined) return val;
		} catch (e) {
			// ignore and continue
		}
	}

	return undefined;
};

class OrderDetailResponseDTO {
	constructor(detail = {}) {
		// quantity
		const quantity = Number(getField(detail, 'quantity', 'qty')) || 0;
		// price_unit from model; support unit_price/price for incoming shapes
		const price_unit = Number(getField(detail, 'price_unit', 'unit_price', 'price')) || 0;
		// discount (0..1)
		const discount = Number(getField(detail, 'discount')) || 0;
		// price_original
		const price_original = Number(getField(detail, 'price_original', 'original_price')) || 0;

		// subtotal: prefer explicit line_total/subtotal from model/DB, else compute
		const subtotalRaw = getField(detail, 'line_total', 'subtotal', 'sub_total');
		const subtotal = subtotalRaw !== undefined ? Number(subtotalRaw) : Math.max(0, price_unit * quantity * (1 - discount));

		this.order_detail_id = getField(detail, 'order_detail_id', 'id', '_id') || null;
		this.order_id = getField(detail, 'orderId', 'order_id') || null;
		this.product_id = getField(detail, 'productId', 'product_id') || null;
		
		this.price_unit = price_unit;
		this.price_original = price_original;
		this.quantity = quantity;
		this.discount = discount;
		this.subtotal = subtotal;
		// Mấy trường này ban đầu định lưu nhưng mà thôi, bị dừ thừa
		// this.product_name = getField(detail, 'productName', 'name', 'title') || null;
		// this.meta = getField(detail, 'meta') || null;
		// timestamps
		this.created_at = getField(detail, 'created_at', 'createdAt') || null;
		this.updated_at = getField(detail, 'updated_at', 'updatedAt') || null;
	}

	static fromEntity(detail) {
		return new OrderDetailResponseDTO(detail);
	}

	static fromEntities(details = []) {
		return Array.isArray(details) ? details.map(d => new OrderDetailResponseDTO(d)) : [];
	}
}

class OrderResponseDTO {
	constructor(order = {}, details = null) {
		const rawItems = Array.isArray(details)
			? details
			: Array.isArray(getField(order, 'items', 'order_items'))
				? getField(order, 'items', 'order_items')
				: [];

		this.order_id = getField(order, 'id', 'order_id', '_id') || null;
		this.customer_id = getField(order, 'customerId', 'customer_id') || null;
		this.status = getField(order, 'status') || null;
		this.order_date = getField(order, 'orderDate', 'created_at', 'order_date') || null;

		// map items
		this.items = OrderDetailResponseDTO.fromEntities(rawItems);

		// Tính tổng: ưu tiên total_amount (model), fallback compute từ items
		const computedTotal = this.items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
		this.total_amount = Number(getField(order, 'total_amount')) || computedTotal || 0;
		// keep legacy 'total' field too for compatibility
		this.total = this.total_amount;

		// additional optional fields consistent with Order model
		this.currency = getField(order, 'currency') || null;
		this.payment_method = getField(order, 'payment_method') || null;
		this.channel = getField(order, 'channel') || null;
		this.ai_suggested_crosssell = getField(order, 'ai_suggested_crosssell') || null;
		this.notes = getField(order, 'notes') || null;

		// timestamps
		this.created_at = getField(order, 'created_at', 'createdAt') || null;
		this.updated_at = getField(order, 'updated_at', 'updatedAt') || null;
	}

	static fromEntity(order, details = null) {
		return new OrderResponseDTO(order, details);
	}

	static fromEntities(orders = []) {
		return Array.isArray(orders) ? orders.map(o => new OrderResponseDTO(o)) : [];
	}
}

module.exports = {
	OrderResponseDTO,
	OrderDetailResponseDTO
};