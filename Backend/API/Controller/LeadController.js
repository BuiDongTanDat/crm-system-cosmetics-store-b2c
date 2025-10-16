// Method	Endpoint	Mô tả	Gọi AI Service
// GET	/leads	Danh sách leads	
// GET	/leads/:id	Chi tiết lead	
// POST	/leads	Tạo lead mới	
// PUT	/leads/:id	Cập nhật lead	
// DELETE	/leads/:id	Xóa lead	
// POST	/leads/:id/assign	Gán lead cho nhân viên	
// POST	/leads/:id/status	Cập nhật trạng thái	
// GET	/leads/:id/analyze-score	Chấm điểm lead	
// GET	/leads/:id/auto-classify	Phân loại lead	
// POST	/leads/auto-distribute	AI tự gán leads	
// POST	/leads/:id/convert	AI tự chuyển thành khách hàng
// POST	/leads/import	Import danh sách khách hàng tiềm năng từ CSV
// const LeadService = require('../../Application/Services/LeadService');
const LeadService = require('../../Application/Services/LeadService');
const {CreateRequestLeadDTO} = require('../../Application/DTOs/LeadDTO');
class LeadController {
  static async create(req, res) {
    try {
      const leadData = CreateRequestLeadDTO.from(req.body);
      const result = await LeadService.createLead(leadData);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async getAll(req, res) {
    try {
      const result = await LeadService.getAll();
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const result = await LeadService.getById(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  

  static async update(req, res) {
    try {
      const result = await ILeadService.update(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await ILeadService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async assignLead(req, res) {
    try {
      const { userId } = req.body;
      const result = await ILeadService.assignLead(req.params.id, userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      const result = await ILeadService.changeStatus(req.params.id, status);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // AI endpoints
  static async analyzeLeadScore(req, res) {
    try {
      const result = await ILeadService.analyzeLeadScore(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async autoClassifyLead(req, res) {
    try {
      const result = await ILeadService.autoClassifyLead(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async autoDistributeLeads(req, res) {
    try {
      const result = await ILeadService.autoDistributeLeads();
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async convertLeadToCustomer(req, res) {
    try {
      const result = await ILeadService.convertLeadToCustomer(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async importLeads(req, res) {
  try {
    if (!req.file) throw new Error("No file uploaded");
    const result = await ILeadService.importLeads(req.file.path);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

}

module.exports = LeadController;
