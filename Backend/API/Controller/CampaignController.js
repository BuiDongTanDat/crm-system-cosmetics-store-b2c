// Method	Endpoint	Description
// GET	/campaigns	Danh sách chiến dịch
// GET	/campaigns/:id	Xem chi tiết
// POST	/campaigns	Tạo chiến dịch mới
// PUT	/campaigns/:id	Cập nhật
// DELETE	/campaigns/:id	Xoá
// POST	/campaigns/:id/start	Kích hoạt chiến dịch
// POST	/campaigns/:id/complete	Hoàn thành chiến dịch
// POST	/campaigns/import	Import từ CSV
// GET	/campaigns/:id/performance	Phân tích hiệu quả (ROI, reach, click...)
// POST	/campaigns/ai/suggest	AI gợi ý chiến dịch (budget, kênh, thời gian, trigger)
const CampaignService = require('../../Application/Services/CampaignService');
class CampaignController {
  static async getAll(req, res) {
    try {
      // Lấy query params từ client (ví dụ ?page=1&limit=20)
      const params = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        status: req.query.status,
        channel: req.query.channel,
        owner_employee_id: req.query.owner_employee_id,
        from: req.query.from,
        to: req.query.to,
        sort: req.query.sort,
        order: req.query.order,
      };

      // Gọi service xử lý logic
      const result = await CampaignService.getAll(params);

      // Gửi kết quả về client
      res.status(200).json(result);
    } catch (err) {
      console.error("❌ Error in getAll:", err);
      res.status(err.status || 500).json({
        ok: false,
        code: err.code || "GET_CAMPAIGNS_FAILED",
        message: err.message || "Internal server error",
      });
    }
  }

  // static async getById(req, res) {
  //   const data = await CampaignService.getById(req.params.id);
  //   res.json(data);
  // }

  static async create(req, res) {
    const data = await CampaignService.createCampaign(req.body);
    res.json(data);
  }
  static async getRunning(req, res) {
    try {
      const { from, to } = req.query;
      const result = await CampaignService.getRunningWithProducts({ from, to });
      res.status(200).json(result);
    } catch (err) {
      console.error('getRunning controller error:', err);
      res.status(500).json({
        success: false,
        code: 'GET_RUNNING_CAMPAIGNS_FAILED',
        message: err.message || 'Internal Server Error',
      });
    }
  }
  static async updateStatus(req, res) {
    try {
      const { id } = req.params; // id campaign
      const { status } = req.body;

      if (!id) {
        return res.status(400).json({
          ok: false,
          code: "MISSING_ID",
          message: "Thiếu campaign_id.",
        });
      }

      if (!status) {
        return res.status(400).json({
          ok: false,
          code: "MISSING_STATUS",
          message: "Thiếu giá trị status cần cập nhật.",
        });
      }

      const result = await CampaignService.updateStatus(id, status);

      if (!result.ok) {
        return res.status(result.status || 400).json(result);
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("❌ Error in updateStatus:", err);
      res.status(500).json({
        ok: false,
        code: "UPDATE_STATUS_FAILED",
        message: "Internal server error.",
      });
    }
  }
  // static async update(req, res) {
  //   const data = await CampaignService.update(req.params.id, req.body);
  //   res.json(data);
  // }

  // static async delete(req, res) {
  //   const data = await CampaignService.delete(req.params.id);
  //   res.json(data);
  // }

  // static async start(req, res) {
  //   const data = await CampaignService.startCampaign(req.params.id);
  //   res.json(data);
  // }

  // static async complete(req, res) {
  //   const data = await CampaignService.completeCampaign(req.params.id);
  //   res.json(data);
  // }

  // static async importCampaigns(req, res) {
  //   if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  //   const result = await CampaignService.importCampaigns(req.file.path);
  //   res.json(result);
  // }

  // static async analyzePerformance(req, res) {
  //   const result = await CampaignService.analyzePerformance(req.params.id);
  //   res.json(result);
  // }

  // static async aiSuggest(req, res) {
  //   const result = await CampaignService.aiSuggestCampaign(req.body);
  //   res.json(result);
  // }
}

module.exports = CampaignController;
