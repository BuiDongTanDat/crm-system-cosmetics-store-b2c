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

	//  Lấy tất cả orders 
	async findAll(){
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
}

module.exports = new OrderRepository();
