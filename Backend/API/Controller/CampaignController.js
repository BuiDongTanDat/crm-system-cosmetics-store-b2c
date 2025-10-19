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
  // static async getAll(req, res) {
  //   const data = await CampaignService.getAll();
  //   res.json(data);
  // }

  // static async getById(req, res) {
  //   const data = await CampaignService.getById(req.params.id);
  //   res.json(data);
  // }

  static async create(req, res) {
    const data = await CampaignService.createCampaign(req.body);
    res.json(data);
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
