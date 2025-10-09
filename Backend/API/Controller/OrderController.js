// Method	Endpoint	Mô tả
// GET	/orders	Danh sách đơn hàng
// GET	/orders/:id	Chi tiết đơn hàng (kèm order details)
// POST	/orders/import	Import đơn hàng từ CSV
// POST	/orders/sync	Đồng bộ dữ liệu từ web/POS/API
// GET	/orders/search?q=	Tìm kiếm đơn hàng
// GET	/orders/:id/status	Xem trạng thái đơn hàng
// GET	/orders/analyze/trends	Phân tích AI xu hướng mua (repeat, upsell)
// const OrderService = require('../../Application/Services/OrderService');
const IOrderService = require('../../Application/Interfaces/IOrderService');
class OrderController {
  static async getAll(req, res) {
    const data = await IOrderService.getAll();
    res.json(data);
  }

  static async getById(req, res) {
    const data = await IOrderService.getById(req.params.id);
    res.json(data);
  }

  static async importOrders(req, res) {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const result = await IOrderService.importOrders(req.file.path);
    res.json(result);
  }

  static async syncFromAPI(req, res) {
    const { source } = req.body;
    const result = await IOrderService.syncOrdersFromAPI(source);
    res.json(result);
  }

  static async search(req, res) {
    const { q } = req.query;
    const result = await IOrderService.searchOrders(q);
    res.json(result);
  }

  static async getStatus(req, res) {
    const result = await IOrderService.getOrderStatus(req.params.id);
    res.json(result);
  }

  static async analyzeTrends(req, res) {
    const result = await IOrderService.analyzeTrends();
    res.json(result);
  }
}

module.exports = OrderController;
