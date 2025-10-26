const OrderService = require('../../Application/Services/OrderService');


class OrderController {
  // Tạo đơn hàng
  async create(req, res, next) {
    try {
      console.log('OrderController.create body =', req.body);
      const created = await OrderService.createOrder(req.body);
      // createOrder đã trả về OrderResponseDTO sẵn
      return res.status(201).json(created);
    } catch (err) {
      console.error('Error creating order:', err);
      return next(err);
    }
  }

  // Lấy đơn hàng theo ID
  async getOrderById(req, res, next) {
    try {
      const id = req.params.id;
      const order = await OrderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
      // getOrder đã trả về OrderResponseDTO rồi
      return res.json(order);
    } catch (err) {
      return next(err);
    }
  }

  // Lấy tất cả đơn hàng (hoặc lọc theo ?customerId=... / ?customer_id=... )
  async getAllOrders(req, res, next) {
    try {
      const customerId = req.query.customer_id || req.query.customerId || null;
      const opts = {};
      if (req.query.status) opts.status = req.query.status;

      let orders;
      if (customerId) {
        // nếu có customerId trong query -> lấy theo customer
        orders = await OrderService.listByCustomer(customerId, opts);
      } else {
        orders = await OrderService.getAllOrders();
      }
      return res.json(orders);
    } catch (err) {
      return next(err);
    }
  }

  // Cập nhật đơn hàng
  async update(req, res, next) {
    try {
      const id = req.params.id;
      const patch = req.body;
      const updated = await OrderService.updateOrder(id, patch);
      return res.json(updated); // updateOrder trả về OrderResponseDTO
    } catch (err) {
      return next(err);
    }
  }

  //Cập nhật trạng thái đơn hàng
  async updateStatus(req, res, next) {
    try {
      const id = req.params.id;
      const status =
        req.body?.status ??
        req.query?.status ??
        undefined;

      if (!status) {
        return res.status(400).json({ message: 'Thiếu trường status' });
      }

      const updated = await OrderService.updateStatus(id, status);
      return res.json(updated); // updateStatus trả về OrderResponseDTO
    } catch (err) {
      return next(err);
    }
  }

  // Xóa đơn hàng
  async delete(req, res, next) {
    try {
      const id = req.params.id;
      await OrderService.deleteOrder(id);
      return res.status(200).json({ message: 'Đã xoá đơn hàng thành công' });
    } catch (err) {
      return next(err);
    }
  }

  // Lấy đơn hàng theo id khách hàng
  async listByCustomer(req, res, next) {
    try {
      const customerId = req.query.customer_id || req.query.customerId;
      if (!customerId) {
        return res.status(400).json({ message: 'Thiếu customer_id' });
      }

      const opts = {};
      if (req.query.status) opts.status = req.query.status;

      const orders = await OrderService.listByCustomer(customerId, opts);
      return res.json(orders);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new OrderController();
