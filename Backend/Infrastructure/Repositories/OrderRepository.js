const DataManager = require('../database/postgres');
const sequelize = DataManager.getSequelize();
const { Op } = require('sequelize');

class OrderRepository {
	constructor() {
		const Order = require('../../Domain/Entities/Order');
		this.Order = Order;
		this.sequelize = sequelize;
	}

	//Tạo order (transaction có thể được truyền từ service)
	async create(payload, transaction = null) {
		return this.Order.create(payload, { transaction });
	}

	// Lấy 1 order theo ID 
	async findById(orderId) {
		return this.Order.findOne({ where: { order_id: orderId } });
	}
	async findbyleadId(leadId) {
		return this.Order.findOne({ where: { lead_id: leadId } });
	}

	//  Lấy tất cả orders 
	async findAll() {
		return this.Order.findAll();
	}

	// Cập nhật order 
	async update(orderId, patch, transaction = null) {
		await this.Order.update(patch, {
			where: { order_id: orderId },
			transaction,
		});
		return this.findById(orderId);
	}

	// Cập nhật trạng thái nhanh 
	async updateStatus(orderId, newStatus, transaction = null) {
		await this.Order.update(
			{ status: newStatus, updated_at: new Date() },
			{ where: { order_id: orderId }, transaction }
		);
		return this.findById(orderId);
	}

	// Xoá order 
	async delete(orderId, transaction = null) {
		return this.Order.destroy({ where: { order_id: orderId }, transaction });
	}

	// Lấy danh sách order theo customerId
	async listByCustomer(customerId, opts = {}) {
		const where = { customer_id: customerId };
		if (opts.status) where.status = opts.status;

		const query = {
			where,
			order: [['order_date', 'DESC']],
			limit: opts.limit,
			offset: opts.offset,
			attributes: opts.attributes,
		};

		return this.Order.findAll(query);
	}
	async count(options) {
		return this.Order.count(options);
	}

	async sum(field, options) {
		return this.Order.sum(field, options);
	}

	async findOne(options) {
		return this.Order.findOne(options);
	}
	//Lấy order theo khoảng thời gian
	async getOrdersByDateRange(from, to) {
		return await this.Order.findAll({
			where: {
				order_date: {
					[Op.between]: [new Date(from), new Date(to)],
				},
			},
		});
	}

	async findByConditions(params = {}) {
		const {
			limit = 5000,
			offset = 0,
			status,
			customer_id,
			lead_id,
			order_date_after,
			order_date_before,
			total_price_gte,
			total_price_lte,
		} = params;

		const where = {};
		if (status) where.status = status;
		if (customer_id) where.customer_id = customer_id;
		if (lead_id) where.lead_id = lead_id;

		if (order_date_after || order_date_before) {
			where.order_date = {};
			if (order_date_after) where.order_date[Op.gte] = new Date(order_date_after);
			if (order_date_before) where.order_date[Op.lte] = new Date(order_date_before);
		}

		if (total_price_gte != null || total_price_lte != null) {
			where.total_price = {};
			if (total_price_gte != null) where.total_price[Op.gte] = Number(total_price_gte);
			if (total_price_lte != null) where.total_price[Op.lte] = Number(total_price_lte);
		}

		return this.Order.findAll({
			where,
			order: [['order_date', 'DESC']],
			limit: Number(limit) || 5000,
			offset: Number(offset) || 0,
		});
	}
}

module.exports = new OrderRepository();
