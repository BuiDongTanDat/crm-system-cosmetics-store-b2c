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
const { ok, fail, asAppError } = require('../../Application/helpers/errors');
const { CreateRequestLeadDTO } = require('../../Application/DTOs/LeadDTO');
class LeadController {
  
  static async importLeads(req, res) {
    try {
      if (!req.file) throw new Error("No file uploaded");
      const result = await LeadService.importLeadsFromCSV(req.file.path);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  
  static async getLeadDetails(req, res) {
    const { id } = req.params;
    const result = await LeadService.getLeadDetails(id);
    res.status(result.ok ? 200 : result.error?.status || 500).json(result);
  }
  static async create(req, res) {
    try {
      const leadData = CreateRequestLeadDTO.from(req.body);
      const result = await LeadService.createLead(leadData);
      res.status(result.ok ? 201 : result.error?.status || 400).json(result);
    } catch (err) {
      res.status(result.ok).json(fail(asAppError(err, { status: 400, code: 'CREATE_LEAD_FAILED' }))
      );
    }
  }
  // static async list(req, res) {
  //   const result = await LeadService.listLeads(req.query);
  //   res.status(result.ok ? 200 : 500).json(result);
  // }
  static async pipeline(req, res) {
    const result = await LeadService.getPipelineSummary();
    res.status(result.ok ? 200 : 500).json(result);
  }
  static async getAll(req, res) {
    try {
      const result = await LeadService.getAll();
      res.status(result.ok ? 200 : result.error?.status || 400).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const result = await LeadService.getLeadById(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }
  static async update(req, res) {
    try {
      const result = await LeadService.updateLead(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  // Toi so may cai vuong toi delete ong oi =))
  // static async delete(req, res) {
  //   try {
  //     await LeadService.delete(req.params.id);
  //     res.status(204).send();
  //   } catch (err) {
  //     res.status(400).json({ error: err.message });
  //   }
  // }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      const result = await LeadService.changeStatus(req.params.id, status);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // AI endpoints
  static async changeStatus(req, res) {
    try {
      const { toStatus, reason, changedBy } = req.body;
      const result = await LeadService.changeStatus(req.params.id, toStatus, reason, changedBy);
      res.status(200).json(result);
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  }

  static async listStatusHistory(req, res) {
    try {
      const list = await LeadService.listStatusHistory(req.params.id);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async convertLeadToCustomer(req, res) {
    try {
      const result = await LeadService.convertLeadToCustomer(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  // --- Interactions ---
  static async addInteraction(req, res) {
    try {
      const result = await LeadService.addInteraction(req.params.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  }

  static async listInteractions(req, res) {
    try {
      const list = await LeadService.listInteractions(req.params.id, req.query);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  // --- Conversion ---
  static async convert(req, res) {
    try {
      const result = await LeadService.convertLeadToCustomer(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  }

  static async autoConvert(req, res) {
    try {
      const result = await LeadService.autoConvertLead(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  }
  // --- AI Prediction ---
  static async predict(req, res) {
    try {
      const result = await LeadService.predictConversion(req.params.id, {
        force: req.query.force === 'true',
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async predictBatch(req, res) {
    try {
      const limit = Number(req.query.limit) || 100;
      const result = await LeadService.predictBatch(limit);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = LeadController;
