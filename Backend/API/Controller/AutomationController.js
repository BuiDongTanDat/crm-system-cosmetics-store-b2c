// Method	Endpoint	Description
// GET	/automation/flows	Danh sách flow tự động
// POST	/automation/flows	Tạo flow mới
// PUT	/automation/flows/:id	Cập nhật flow
// DELETE	/automation/flows/:id	Xóa flow
// POST	/automation/flows/:id/run	Thực thi flow
// GET	/automation/triggers	Danh sách trigger
// POST	/automation/triggers	Tạo trigger
// GET	/automation/actions	Danh sách action
// POST	/automation/actions	Tạo action
// POST	/automation/ai/analyze	AI phân tích hành vi khách hàng
// POST	/automation/ai/recommend	AI gợi ý sản phẩm phù hợp
const IAutomationService = require('../../Application/Interfaces/IAutomationService');
// const AutomationService = require('../../Application/Services/AutomationService');

class AutomationController {
  static async getFlows(req, res) {
    const result = await AutomationService.getAllFlows();
    res.json(result);
  }

  static async getFlowById(req, res) {
    const result = await AutomationService.getFlowById(req.params.id);
    res.json(result);
  }

  static async createFlow(req, res) {
    const result = await AutomationService.createFlow(req.body);
    res.json(result);
  }

  static async updateFlow(req, res) {
    const result = await AutomationService.updateFlow(req.params.id, req.body);
    res.json(result);
  }

  static async deleteFlow(req, res) {
    const result = await AutomationService.deleteFlow(req.params.id);
    res.json(result);
  }

  static async listTriggers(req, res) {
    const result = await AutomationService.listTriggers();
    res.json(result);
  }

  static async listActions(req, res) {
    const result = await AutomationService.listActions();
    res.json(result);
  }

  static async createTrigger(req, res) {
    const result = await AutomationService.createTrigger(req.body);
    res.json(result);
  }

  static async createAction(req, res) {
    const result = await AutomationService.createAction(req.body);
    res.json(result);
  }

  static async runFlow(req, res) {
    const result = await AutomationService.runFlow(req.params.id, req.body);
    res.json(result);
  }

  static async aiAnalyze(req, res) {
    const result = await AutomationService.aiAnalyzeCustomer(req.body.customerId);
    res.json(result);
  }

  static async aiRecommend(req, res) {
    const result = await AutomationService.aiRecommendProducts(req.body.customerId);
    res.json(result);
  }
}

module.exports = AutomationController;
