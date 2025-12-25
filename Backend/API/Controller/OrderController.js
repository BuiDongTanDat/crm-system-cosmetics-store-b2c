const OrderService = require('../../Application/Services/OrderService');
const ORDER_STATUSES = [
  'draft_cart',
  'awaiting_customer_confirmation',
  'paid',
  'pending',
  'cancelled',
  'refunded',
  'failed',
  'processing',
  'shipped',
  'completed',
];

// (tuỳ chọn) rule chuyển trạng thái “nhẹ” – bật/tắt tuỳ bạn
const VALID_TRANSITIONS = {
  draft_cart: ['awaiting_customer_confirmation', 'cancelled'],
  awaiting_customer_confirmation: ['paid', 'cancelled'],
  paid: ['processing', 'refunded', 'failed'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed', 'refunded'],
  completed: [],
  cancelled: [],
  refunded: [],
  failed: [],
  pending: ['processing', 'cancelled'],
};

class OrderController {
  async createQuick(req, res, next) {
    try {
      console.log('OrderController.createQuick body =', req.body);
      const created = await OrderService.createQuickOrder(req.body);
      return res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng nhanh thành công',
        data: created,
      });
    } catch (err) {
      console.error('Error creating quick order:', err);
      return res.status(400).json({
        success: false,
        code: 'QUICK_ORDER_FAILED',
        message: err.message || 'Tạo đơn hàng nhanh thất bại',
      });
    }
  }
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
  // trong OrderController.js
  async getByLeadId(req, res, next) {
    try {
      const leadId = req.params.lead_id;
      const order = await OrderService.getByLeadId(leadId);
      if (!order) return res.status(404).json({ message: 'Chưa có đơn hàng cho lead này' });
      res.json(order);
    } catch (err) {
      next(err);
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
      const status = req.body?.status ?? req.query?.status;

      if (!status) return res.status(400).json({ message: 'Thiếu trường status' });
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Status không hợp lệ' });
      }

      // (tuỳ chọn) kiểm soát chuyển trạng thái sai flow
      try {
        const current = await OrderService.getOrderById(id);
        if (!current) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        const allowed = VALID_TRANSITIONS[current.status] || [];
        if (allowed.length && !allowed.includes(status)) {
          return res.status(409).json({
            message: `Không thể chuyển từ ${current.status} -> ${status}`,
            allowed,
          });
        }
      } catch {
        // bỏ qua nếu bạn chưa muốn ràng buộc
      }

      const updated = await OrderService.updateStatus(id, status);
      return res.json(updated);
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
  async sendCheckoutLink(req, res, next) {
    try {
      const { id } = req.params;
      // TODO: CheckoutService.sendLink(id);
      return res.json({ success: true, message: 'Đã gửi link xác nhận/checkout cho khách' });
    } catch (err) {
      return next(err);
    }
  }
  async addItem(req, res, next) {
    try {
      const { id } = req.params;
      const item = req.body;
      const updated = await OrderService.addItem(id, item);
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  }

  async getOrderByDateRange(req, res, next) {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        return res.status(400).json({ message: 'Thiếu tham số from hoặc to' });
      }
      const orders = await OrderService.getOrdersByDateRange(from, to);
      return res.json(orders);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new OrderController();
