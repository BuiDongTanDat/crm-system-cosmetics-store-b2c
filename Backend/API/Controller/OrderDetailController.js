const OrderDetailService = require('../../Application/Services/OrderDetailService');
const { OrderDetailResponseDTO } = require('../../Application/DTOs/OrderDTO');

class OrderDetailController {
	// POST /order-details
	async create(req, res, next) {
		try {
			const detail = req.body;
			const created = await OrderDetailService.createDetail(detail);
			return res.status(201).json(OrderDetailResponseDTO.fromEntity(created));
		} catch (err) {
			return next(err);
		}
	}

	// POST /order-details/bulk
	async createMany(req, res, next) {
		try {
			const details = req.body.details || [];
			const created = await OrderDetailService.createMany(details);
			return res.status(201).json(OrderDetailResponseDTO.fromEntities(created));
		} catch (err) {
			return next(err);
		}
	}

	// GET /orders/:orderId/details
	async getByOrderId(req, res, next) {
		try {
			const orderId = req.params.orderId;
			const items = await OrderDetailService.getByOrderId(orderId);
			return res.json(OrderDetailResponseDTO.fromEntities(items));
		} catch (err) {
			return next(err);
		}
	}

	// DELETE /orders/:orderId/details
	async deleteByOrderId(req, res, next) {
		try {
			const orderId = req.params.orderId;
			await OrderDetailService.deleteByOrderId(orderId);
			return res.status(204).send();
		} catch (err) {
			return next(err);
		}
	}

	// GET /order-details/:id
	async getById(req, res, next) {
		try {
			const id = req.params.id;
			const detail = await OrderDetailService.getById(id);
			if (!detail) return res.status(404).json({ message: 'Order detail not found' });
			return res.json(OrderDetailResponseDTO.fromEntity(detail));
		} catch (err) {
			return next(err);
		}
	}
}

module.exports = new OrderDetailController();
