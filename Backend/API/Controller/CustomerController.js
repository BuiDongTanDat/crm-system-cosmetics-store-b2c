// const CustomerService = require('../../Application/Services/CustomerService');
// Method	Endpoint	Chức năng	Gọi AI Service
// GET	/customers	Danh sách khách hàng	
// GET	/customers/:id	Chi tiết khách hàng	
// POST	/customers	Tạo khách hàng mới	
// PUT	/customers/:id	Cập nhật khách hàng	
// DELETE	/customers/:id	Xóa khách hàng	
// GET	/customers/:id/interactions	Lịch sử tương tác	
// GET	/customers/:id/orders	Đơn hàng của khách hàng	
// GET	/customers/:id/recommendations	Gợi ý sản phẩm	 gọi /ai/recommend-products
// GET	/customers/:id/analyze-clv	Phân tích CLV	/ai/analyze-clv
// GET	/customers/:id/analyze-churn	Dự đoán churn /ai/predict-churn
// GET	/customers/:id/analyze-behavior	Phân tích hành vi /ai/analyze-behavior
// POST	/customers/auto-segment	Phân nhóm khách hàng tự động /ai/auto-segment

// /customers/import — Import danh sách khách hàng chính thức
const CustomerService = require('../../Application/Services/CustomerService');
const CustomerAnalyticsService = require('../../Application/Services/CustomerAnalyticsService');
class CustomerController {
  static async getAll(req, res) {
    try {
      const result = await CustomerService.listCustomers();
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const result = await CustomerService.getCustomerById(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const result = await CustomerService.createCustomer(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const result = await CustomerService.updateCustomer(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getInteractions(req, res) {
    try {
      const result = await CustomerService.getInteractions(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getOrders(req, res) {
    try {
      const result = await CustomerService.getOrders(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getRecommendations(req, res) {
    try {
      const result = await CustomerService.getRecommendations(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async analyzeCLV(req, res) {
    try {
      const result = await CustomerService.analyzeCLV(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async analyzeChurn(req, res) {
    try {
      const result = await CustomerService.analyzeChurn(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async analyzeBehavior(req, res) {
    try {
      const result = await CustomerService.analyzeBehavior(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async autoSegmentAll(req, res) {
    try {
      const result = await CustomerService.autoSegmentAll();
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async importCustomers(req, res) {
  try {
    if (!req.file) throw new Error("No file uploaded");
    const result = await CustomerService.importCustomers(req.file.path);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
  // =========================================================
  // =============== ANALYTICS (CFM / CHURN / CLV) ============
  // =========================================================

  // ---- CFM summary (thẻ KPI) ----
  // GET /customers/analytics/cfm/summary?snapshot_date=YYYY-MM-DD
  static async getCFMSummary(req, res) {
    try {
      const result = await CustomerAnalyticsService.getCFMSummary({
        snapshot_date: req.query.snapshot_date,
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // ---- CFM list (bảng bên dưới) ----
  // GET /customers/analytics/cfm/list?snapshot_date=...&page=1&page_size=20&sort=-cfm_score&search=...
  static async getCFMList(req, res) {
    try {
      const result = await CustomerAnalyticsService.listCFM({
        snapshot_date: req.query.snapshot_date,
        page: req.query.page,
        page_size: req.query.page_size,
        sort: req.query.sort,
        search: req.query.search,
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // ---- Churn summary (thẻ KPI) ----
  // GET /customers/analytics/churn/summary?snapshot_date=YYYY-MM-DD
  static async getChurnSummary(req, res) {
    try {
      const result = await CustomerAnalyticsService.getChurnSummary({
        snapshot_date: req.query.snapshot_date,
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // ---- Churn list (bảng bên dưới) ----
  // GET /customers/analytics/churn/list?snapshot_date=...&page=1&page_size=20&sort=-churn_score&search=...
  static async getChurnList(req, res) {
    try {
      const result = await CustomerAnalyticsService.listChurn({
        snapshot_date: req.query.snapshot_date,
        page: req.query.page,
        page_size: req.query.page_size,
        sort: req.query.sort,
        search: req.query.search,
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // ---- CLV summary (thẻ KPI) ----
  // GET /customers/analytics/clv/summary?snapshot_date=YYYY-MM-DD
  static async getCLVSummary(req, res) {
    try {
      const result = await CustomerAnalyticsService.getCLVSummary({
        snapshot_date: req.query.snapshot_date,
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // ---- CLV list (bảng bên dưới) ----
  // GET /customers/analytics/clv/list?snapshot_date=...&page=1&page_size=20&sort=-clv_12m&search=...
  static async getCLVList(req, res) {
    try {
      const result = await CustomerAnalyticsService.listCLV({
        snapshot_date: req.query.snapshot_date,
        page: req.query.page,
        page_size: req.query.page_size,
        sort: req.query.sort,
        search: req.query.search,
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }


  // Báo cáo khách hàng
  static async getCustomerByDateRange(req, res) {
    try {
      const { from, to } = req.query;
      const result = await CustomerService.getCustomersByDateRange(new Date(from), new Date(to));
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = CustomerController;
