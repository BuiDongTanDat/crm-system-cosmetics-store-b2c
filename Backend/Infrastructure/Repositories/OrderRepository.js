const DataManager = require('../database/postgres');
const sequelize = DataManager.getSequelize();
const { Op } = require('sequelize');

class OrderRepository {
	constructor() {
		const Order = require('../../Domain/Entities/Order');
		const OrderDetail = require('../../Domain/Entities/OrderDetail');

		this.Order = Order;
		this.OrderDetail = OrderDetail;
		this.sequelize = sequelize;
	}

	// helper: tính tổng từ items (sử dụng cùng logic ở create/update)
	computeTotal(items = []) {
		let total = 0;
		for (const it of items) {
			const price = parseFloat(it.price_unit || 0);
			const qty = Number(it.quantity || 0);
			const disc = parseFloat(it.discount || 0);
			const line = Math.max(0, price * qty * (1 - disc));
			total += line;
		}
		return total;
	}

	// Tạo order cùng items (nếu có) trong transaction. Nếu total_amount không có -> tự tính từ items.
	async create(orderPayload) {
		const t = await this.sequelize.transaction();
		try {
			const items = Array.isArray(orderPayload.items) ? orderPayload.items : [];
			const payload = { ...orderPayload };
			delete payload.items;

			// Tính tổng nếu chưa có
			if (payload.total_amount == null) {
				payload.total_amount = this.computeTotal(items);
			}

			const order = await this.Order.create(payload, { transaction: t });

			if (items.length) {
				const details = items.map(it => ({ ...it, order_id: order.order_id }));
				await this.OrderDetail.bulkCreate(details, { transaction: t });
			}

			await t.commit();
			return this.findById(order.order_id);
		} catch (err) {
			await t.rollback();
			throw err;
		}
	}

	// Lấy order kèm items (không dùng Sequelize association)
	async findById(orderId) {
		const order = await this.Order.findOne({ where: { order_id: orderId } });
		if (!order) return null;
		const items = await this.OrderDetail.findAll({ where: { order_id: orderId } });
		// attach items to returned instance (dataValues) for compatibility with existing DTOs/controllers
		order.dataValues = order.dataValues || {};
		order.dataValues.items = items;
		return order;
	}

    // Lấy tất cả order (gộp items bằng một query)
    async findAll(opts = {}) {
        const query = { ...(opts || {}) };
        // ensure we don't attempt to use include
        if (query.hasOwnProperty('include')) delete query.include;

        const orders = await this.Order.findAll(query);
        if (!orders || orders.length === 0) return orders;

        const ids = orders.map(o => o.order_id).filter(Boolean);
        if (ids.length === 0) return orders;

        const details = await this.OrderDetail.findAll({ where: { order_id: { [Op.in]: ids } } });
        const grouped = details.reduce((acc, d) => {
            const k = d.order_id;
            acc[k] = acc[k] || [];
            acc[k].push(d);
            return acc;
        }, {});

        for (const o of orders) {
            o.dataValues = o.dataValues || {};
            o.dataValues.items = grouped[o.order_id] || [];
        }
        return orders;
    }



	// Cập nhật các field của order. Nếu có items -> xóa và insert lại
    // Nghĩa là mỗi lần cập nhật đơn là anh này ảnh cập nhật lại toàn
    // bộ chi tiết đơn hàng luôn á
	async update(orderId, patch) {
		const t = await this.sequelize.transaction();
		try {
			const items = Array.isArray(patch.items) ? patch.items : null;
			const payload = { ...patch };
			delete payload.items;

			await this.Order.update(payload, { where: { order_id: orderId }, transaction: t });

			if (items !== null) {
				// xóa cũ và insert mới
				await this.OrderDetail.destroy({ where: { order_id: orderId }, transaction: t });
				if (items.length) {
					const details = items.map(it => ({ ...it, order_id: orderId }));
					await this.OrderDetail.bulkCreate(details, { transaction: t });
				}
				// tái tính tổng sử dụng helper
				const total = this.computeTotal(items);
				await this.Order.update({ total_amount: total }, { where: { order_id: orderId }, transaction: t });
			}

			await t.commit();
			return this.findById(orderId);
		} catch (err) {
			await t.rollback();
			throw err;
		}
	}

	// Cập nhật trạng thái nhanh
	async updateStatus(orderId, newStatus) {
		await this.Order.update(
			{ status: newStatus, updated_at: new Date() },
			{ where: { order_id: orderId } }
		);
		return this.findById(orderId);
	}

	// Xóa order và details trong transaction
	async delete(orderId) {
		const t = await this.sequelize.transaction();
		try {
			await this.OrderDetail.destroy({ where: { order_id: orderId }, transaction: t });
			const deleted = await this.Order.destroy({ where: { order_id: orderId }, transaction: t });
			await t.commit();
			return deleted;
		} catch (err) {
			await t.rollback();
			throw err;
		}
	}

	// Lấy danh sách theo customer (gộp items)
	async listByCustomer(customerId, opts = {}) {
		const where = { customer_id: customerId };
		if (opts.status) where.status = opts.status;
		const query = {
			where,
			order: [['order_date', 'DESC']],
		};
		// merge some optional query params from opts (limit/offset/attributes...)
		if (opts.limit) query.limit = opts.limit;
		if (opts.offset) query.offset = opts.offset;
		if (opts.attributes) query.attributes = opts.attributes;

		const orders = await this.Order.findAll(query);
		if (!orders || orders.length === 0) return orders;

		const ids = orders.map(o => o.order_id).filter(Boolean);
		const details = await this.OrderDetail.findAll({ where: { order_id: { [Op.in]: ids } } });
		const grouped = details.reduce((acc, d) => {
			const k = d.order_id;
			acc[k] = acc[k] || [];
			acc[k].push(d);
			return acc;
		}, {});
		for (const o of orders) {
			o.dataValues = o.dataValues || {};
			o.dataValues.items = grouped[o.order_id] || [];
		}
		return orders;
	}
}

module.exports = new OrderRepository();