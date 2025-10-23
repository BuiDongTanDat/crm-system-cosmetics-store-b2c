const OrderService = require('../../Application/Services/OrderService');
const OrderDetailService = require('../../Application/Services/OrderDetailService');
const { OrderResponseDTO } = require('../../Application/DTOs/OrderDTO');

class OrderController {
  // POST /orders
  async create(req, res, next) {
    try {
      console.log('OrderController.create body=', req.body);
      const payload = req.body;
      const created = await OrderService.createOrder(payload);
      return res.status(201).json(OrderResponseDTO.fromEntity(created));
    } catch (err) {
      return next(err);
    }
  }

  async get(req, res, next) {
    try {
      const id = req.params.id;
      const order = await OrderService.getOrder(id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      const details = await OrderDetailService.getByOrderId(id);
      return res.json(OrderResponseDTO.fromEntity(order, details));
    } catch (err) {
      return next(err);
    }
  }

  // GET /orders
  async getAllOrders(req, res, next) {
    try {
      const customerId = req.query && (req.query.customerId || req.query.customer_id) ? (req.query.customerId || req.query.customer_id) : null;
      const opts = {};
      if (req.query.status) opts.status = req.query.status;
      // Nếu có customerId thì lọc theo customer, không thì lấy tất cả
      const orders = await OrderService.listByCustomer(customerId, opts);

      // Map sang DTO kèm details
      const mapped = await Promise.all(
        (orders || []).map(async (o) => {
          const id = o.order_id || o.id || o._id;
          const items = await OrderDetailService.getByOrderId(id);
          return OrderResponseDTO.fromEntity(o, items);
        })
      );

      return res.json(mapped);
    } catch (err) {
      return next(err);
    }
  }


  // PUT /orders/:id
  async update(req, res, next) {
    try {
      const id = req.params.id;
      const patch = req.body;
      const updated = await OrderService.updateOrder(id, patch);
      const details = await OrderDetailService.getByOrderId(id);
      return res.json(OrderResponseDTO.fromEntity(updated, details));
    } catch (err) {
      return next(err);
    }
  }

  // PATCH /orders/:id/status
  async updateStatus(req, res, next) {
    try {
      const id = req.params.id;
      const status = req && req.body ? req.body.status : undefined;
      const finalStatus = typeof status !== 'undefined' ? status : req.query && req.query.status ? req.query.status : undefined;

      if (typeof finalStatus === 'undefined' || finalStatus === null || finalStatus === '') {
        return res.status(400).json({ message: 'Thiếu trường status' });
      }

      const updated = await OrderService.updateStatus(id, finalStatus);
      const details = await OrderDetailService.getByOrderId(id);
      return res.json(OrderResponseDTO.fromEntity(updated, details));
    } catch (err) {
      return next(err);
    }
  }

  // DELETE /orders/:id
  async delete(req, res, next) {
    try {
      const id = req.params.id;
      await OrderService.deleteOrder(id);
      return res.status(201).json({ message: 'Đã xóa đơn hàng' });
    } catch (err) {
      return next(err);
    }
  }
  // GET /orders?customerId=? 
  async listByCustomer(req, res, next) {
    try {
      const customerId = req.query.customer_id || req.query.customerId;
      if (!customerId) {
        return res.status(400).json({ message: 'Missing customer_id' });
      }

      const opts = {};
      if (req.query.status) opts.status = req.query.status;

      const orders = await OrderService.listByCustomer(customerId, opts);

      const mapped = await Promise.all(
        (orders || []).map(async (o) => {
          const id = o.order_id || o.id || o._id;
          const items = await OrderDetailService.getByOrderId(id);
          return OrderResponseDTO.fromEntity(o, items);
        })
      );

      return res.json(mapped);
    } catch (err) {
      return next(err);
    }
  }

}

module.exports = new OrderController();
