
const LeadService = require('../../Application/Services/LeadService');
const { ok, fail, asAppError } = require('../../Application/helpers/errors');
const { CreateRequestLeadDTO } = require('../../Application/DTOs/LeadDTO');
const LeadScoringService = require('../../Application/Services/LeadScoringService');
const NotificationService = require('../../Application/Services/NotificationService');
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
  static async trackInterest(req, res) {
    try {
      const {
        anon_id,
        product_id,
        product_name,
        source,
        campaign_id,
        meta,
      } = req.body || {};

      if (!anon_id) {
        throw new AppError('anon_id is required', { status: 400 });
      }
      if (!product_id) {
        throw new AppError('product_id is required', { status: 400 });
      }

      const result = await LeadService.trackInterest({
        anon_id,
        product_id,
        product_name: product_name || null,
        source: source || 'web',
        campaign_id: campaign_id || null,
        meta: meta || {},
      });

      return res
        .status(result.ok ? 200 : (result.error?.status || 500))
        .json(result);

    } catch (err) {
      return res
        .status(err.status || 500)
        .json(fail(asAppError(err, { code: 'TRACK_INTEREST_FAILED' })));
    }
  }
  static async fromInterest(req, res) {
    try {
      const {
        anon_id,
        name,
        email,
        phone,
        source,
        campaign_id,
        assigned_to,
        priority,
        note,
        tags,
        meta,
      } = req.body || {};

      const result = await LeadService.fromInterest({
        anon_id,
        name,
        email,
        phone,
        source: source || 'web',
        campaign_id: campaign_id || null,
        assigned_to: assigned_to || null,
        priority: priority || 'medium',
        note: note || null,
        tags: Array.isArray(tags) ? tags : [],
        meta: meta || {},
      });

      if (!result?.ok) {
        return res.status(result?.error?.status || 500).json(result);
      }
      return res.status(201).json(result);
    } catch (err) {
      const e = asAppError(err, { status: err?.status || 500, code: 'FROM_INTEREST_FAILED' });
      return res.status(e.status || 500).json(fail(e));
    }
  }
  static async getLeadDetails(req, res) {
    const { id } = req.params;
    const result = await LeadService.getLeadDetails(id);
    res.status(result.ok ? 200 : result.error?.status || 500).json(result);
  }
  static async create(req, res) {
    try {
      const dto = CreateRequestLeadDTO.from(req.body);
      const leadData = {
        ...dto,
        product_id: req.body?.product_id ?? dto.product_id ?? null,
        product_ids: req.body?.product_ids ?? dto.product_ids ?? null,
        product_name: req.body?.product_name ?? dto.product_name ?? null,
        meta: req.body?.meta ?? dto.meta ?? {},
      };
      const result = await LeadService.createLead(leadData);
      // Trả về kết quả cho client trước
      res.status(result.ok ? 201 : (result.error?.status || 400)).json(result);

      // Gửi notification sau, không chờ kết quả
      if (result.ok) {
        NotificationService.sendNotification({
          title: 'Lead mới đã được tạo',
          message: `Lead ${result.data.name} vừa được tạo trong hệ thống.`,
          type: 'LEAD',
        }).catch(err => {
          // Log lỗi, không ảnh hưởng tới client
          console.error('Lỗi gửi notification:', err);
        });
      }
    } catch (err) {
      const e = asAppError(err, { status: 400, code: 'CREATE_LEAD_FAILED' });
      return res
        .status(e.status || 400)
        .json(fail(e));
    }
  }
  static async getPipelineMetrics(req, res) {
    try {
      const data = await LeadService.getPipelineMetrics();
      res.json({ ok: true, data });
    } catch (err) {
      console.error('[LeadController] getPipelineMetrics error:', err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }
  static async getPipelineSummary(req, res) {
    try {
      const result = await LeadService.getPipelineSummary();
      return res
        .status(result.ok ? 200 : (result.error?.status || 500))
        .json(result);
    } catch (err) {
      return res
        .status(500)
        .json(
          fail(asAppError(err, { status: 500, code: 'PIPELINE_SUMMARY_FAILED' }))
        );
    }
  }
  static async getPipelineColumns(req, res) {
    try {
      const result = await LeadService.getPipelineColumns();
      return res
        .status(result.ok ? 200 : (result.error?.status || 500))
        .json(result);
    } catch (err) {
      return res
        .status(500)
        .json(
          fail(asAppError(err, { status: 500, code: 'PIPELINE_FETCH_FAILED' }))
        );
    }
  }
  static async updateLeadStatus(req, res) {
    try {
      const { leadId } = req.params;
      const { status } = req.body;
      const result = await LeadService.updateLeadStatus(leadId, status);
      return res
        .status(result.ok ? 200 : (result.error?.status || 400))
        .json(result);
    } catch (err) {
      return res
        .status(500)
        .json(
          fail(asAppError(err, { status: 500, code: 'UPDATE_LEAD_STATUS_FAILED' }))
        );
    }
  }
  static async getAll(req, res) {
    try {
      const result = await LeadService.getAll();
      if (result && result.error) {
        return res.status(result.error.status || 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
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
  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      const result = await LeadService.changeStatus(req.params.id, status);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
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
  static async getQualifiedLeads(req, res) {
    try {
      const result = await LeadService.getQualifiedLeads();

      if (result.error) {
        return res.status(result.error.status || 500).json({
          success: false,
          code: result.error.code,
          message: result.error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách lead qualified thành công',
        data: result.data,
      });
    } catch (err) {
      console.error('LeadController.getQualifiedLeads error:', err);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: err.message || 'Internal server error',
      });
    }
  }
  static async rescoreLead(req, res) {
    try {
      const { leadId } = req.params;
      const trigger = req.body?.trigger || 'manual';
      const out = await LeadScoringService.rescoreLead(leadId, { trigger });
      return res.status(200).json({ ok: true, data: out });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  static async rescoreDaily(req, res) {
    try {
      const limit = Number(req.query?.limit || 200);
      const offset = Number(req.query?.offset || 0);
      const out = await LeadScoringService.rescoreDailyBatch({ limit, offset });
      return res.status(200).json(out);
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }
  static async getPredictions(req, res) {
    try {
      const leadId = req.params.leadId || req.params.id;
      const { limit, offset, since, until, order } = req.query;

      const result = await LeadScoringService.getPredictions(leadId, {
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        since,
        until,
        order: order || 'desc',
      });

      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { status: 500, code: 'GET_LEAD_PREDICTIONS_FAILED', message: err.message },
      });
    }
  }
  static async addTag(req, res) {
    try {
      const leadId = req.params.id;
      const tag = req.body?.tag;

      const result = await LeadService.addTag(leadId, tag);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, data: null, error: { status: 500, code: 'ADD_TAG_FAILED', message: err.message } });
    }
  }
  static async removeTag(req, res) {
    try {
      const leadId = req.params.id;
      const tag = req.params.tag;

      const result = await LeadService.removeTag(leadId, tag);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, data: null, error: { status: 500, code: 'REMOVE_TAG_FAILED', message: err.message } });
    }
  }

  static async findLeadsByTag(req, res) {
    try {
      const tag = req.params.tag;

      const result = await LeadService.findLeadsByTag(tag);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, data: null, error: { status: 500, code: 'FIND_BY_TAG_FAILED', message: err.message } });
    }
  }
}

module.exports = LeadController;
