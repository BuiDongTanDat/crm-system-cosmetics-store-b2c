const DataManager = require('../database/postgres');
const sequelize = DataManager.getSequelize();

class OrderDetailRepository {
	constructor() {
		this.OrderDetail = require('../../Domain/Entities/OrderDetail');
		this.sequelize = sequelize;
	}

	async create(detail, transaction = null) {
		return this.OrderDetail.create(detail, { transaction });
	}

	async createMany(details, transaction = null) {
		if (!Array.isArray(details) || details.length === 0) return [];
		return this.OrderDetail.bulkCreate(details, { transaction });
	}

	async findByOrderId(orderId) {
		return this.OrderDetail.findAll({ where: { order_id: orderId } });
	}

	async deleteByOrderId(orderId, transaction = null) {
		return this.OrderDetail.destroy({ where: { order_id: orderId }, transaction });
	}

	async findById(orderDetailId) {
		return this.OrderDetail.findOne({ where: { order_detail_id: orderDetailId } });
	}
}

module.exports = new OrderDetailRepository();