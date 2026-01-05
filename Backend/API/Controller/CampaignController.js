// backend/src/Application/Controllers/CampaignController.js
const CampaignService = require('../../Application/Services/CampaignService');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

class CampaignController {
  static async metrics(req, res) {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ ok: false, error: { code: 'MISSING_ID', message: 'Thiếu campaign_id.' } });
      }

      const result = await CampaignService.getMetrics(id);
      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: { code: 'GET_CAMPAIGN_METRICS_FAILED', message: err?.message || 'Internal server error' },
      });
    }
  }
  static async listByChannel(req, res) {
    try {
      const params = {
        channel: req.query.channel,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        from: req.query.from,
        to: req.query.to,
        sort: req.query.sort,
        order: req.query.order,
      };

      const result = await CampaignService.listByChannel(params);
      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: { code: 'LIST_BY_CHANNEL_FAILED', message: err?.message || 'Internal server error' },
      });
    }
  }
  static async getAll(req, res) {
    try {
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

      const result = await CampaignService.getAll(params);

      // result theo chuẩn ok/fail của bạn
      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      console.error('Error in CampaignController.getAll:', err);
      return res.status(500).json({
        ok: false,
        error: {
          code: 'GET_CAMPAIGNS_FAILED',
          message: err?.message || 'Internal server error',
        },
      });
    }
  }
  static async getOne(req, res) {
    try {
      const { id } = req.params;
      const result = await CampaignService.getCampaign(id);
      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }
  static async create(req, res) {
    try {
      const payload = { ...req.body };

      // 1. Upload Image if exists
      if (req.file) {
        try {
          const uploadRes = await cloudinary.uploader.upload(req.file.path, {
            folder: 'campaigns',
            resource_type: 'image',
          });
          payload.image = uploadRes.secure_url;
          payload.image_id = uploadRes.public_id;

          // Cleanup
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        } catch (uErr) {
          console.error('Cloudinary upload failed:', uErr);
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }
      }

      // 2. Parse JSON fields if string (FormData support)
      const jsonFields = ['products', 'target_filter', 'expected_kpi', 'settings', 'channel_configs', 'performance'];
      jsonFields.forEach(field => {
        if (typeof payload[field] === 'string') {
          try {
            payload[field] = JSON.parse(payload[field]);
          } catch (e) {
            // keep as string or ignore?
            console.warn(`Failed to parse JSON for field ${field}:`, e);
          }
        }
      });

      if (!payload?.name) {
        return res.status(400).json({
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'Campaign name is required' },
        });
      }
      const result = await CampaignService.createCampaign(payload);
      const httpStatus = result?.ok ? 201 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      console.error('❌ Error in CampaignController.create:', err);
      // Cleanup if error occurs after upload but before finish (edge case)
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) { }
      }
      return res.status(500).json({
        ok: false,
        error: { code: 'CREATE_CAMPAIGN_FAILED', message: err?.message || 'Internal server error' },
      });
    }
  }
  static async update(req, res) {
    try {
      const { id } = req.params;
      const payload = { ...req.body };

      // Handle Image Upload update
      if (req.file) {
        try {
          const uploadRes = await cloudinary.uploader.upload(req.file.path, {
            folder: 'campaigns',
            resource_type: 'image',
          });
          payload.image = uploadRes.secure_url;
          payload.image_id = uploadRes.public_id;
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        } catch (uErr) {
          console.error('Cloudinary update failed:', uErr);
        }
      }

      // Parse JSON fields
      const jsonFields = ['products', 'target_filter', 'expected_kpi', 'settings', 'channel_configs', 'performance'];
      jsonFields.forEach(field => {
        if (typeof payload[field] === 'string') {
          try { payload[field] = JSON.parse(payload[field]); } catch (e) { }
        }
      });

      const result = await CampaignService.updateCampaign(id, payload);
      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { code: 'UPDATE_ERROR', message: err.message } });
    }
  }

  static async submit(req, res) {
    try {
      const result = await CampaignService.submitCampaign(req.params.id);
      return res.status(result.ok ? 200 : 400).json(result);
    } catch (err) { return res.status(500).json({ ok: false, error: { message: err.message } }); }
  }

  static async reject(req, res) {
    try {
      const result = await CampaignService.rejectCampaign(req.params.id, req.body?.reason);
      return res.status(result.ok ? 200 : 400).json(result);
    } catch (err) { return res.status(500).json({ ok: false, error: { message: err.message } }); }
  }

  static async approve(req, res) {
    try {
      // Mock owner ID until Auth is fully integrated
      const ownerId = req.body?.owner_id || req.user?.user_id || 'sys_admin';
      const result = await CampaignService.approveCampaignFull(req.params.id, ownerId);
      return res.status(result.ok ? 200 : 400).json(result);
    } catch (err) { return res.status(500).json({ ok: false, error: { message: err.message } }); }
  }

  static async getRunning(req, res) {
    try {
      const { from, to } = req.query || {};
      const result = await CampaignService.getRunningWithProducts({ from, to });

      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      console.error(' Error in CampaignController.getRunning:', err);
      return res.status(500).json({
        ok: false,
        error: {
          code: 'GET_RUNNING_CAMPAIGNS_FAILED',
          message: err?.message || 'Internal server error',
        },
      });
    }
  }
  // PATCH /campaigns/:id/status
  static async updateStatus(req, res) {
    try {
      const { id } = req.params || {};
      const { status } = req.body || {};

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: { code: 'MISSING_ID', message: 'Thiếu campaign_id.' },
        });
      }

      if (!status) {
        return res.status(400).json({
          ok: false,
          error: { code: 'MISSING_STATUS', message: 'Thiếu giá trị status cần cập nhật.' },
        });
      }

      // service sẽ validate status + update DB + publish campaign.run nếu running
      const result = await CampaignService.updateStatus(id, status);

      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      console.error('Error in CampaignController.updateStatus:', err);
      return res.status(500).json({
        ok: false,
        error: { code: 'UPDATE_STATUS_FAILED', message: err?.message || 'Internal server error' },
      });
    }
  }
  // POST /campaigns/:id/run
  static async run(req, res) {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({
          ok: false,
          error: { code: 'MISSING_ID', message: 'Thiếu campaign_id.' },
        });
      }

      const result = await CampaignService.runCampaign(id, {});

      const httpStatus = result?.ok ? 200 : (result?.error?.status || result?.status || 400);
      return res.status(httpStatus).json(result);
    } catch (err) {
      console.error(' Error in CampaignController.run:', err);
      return res.status(500).json({
        ok: false,
        error: { code: 'RUN_CAMPAIGN_FAILED', message: err?.message || 'Internal server error' },
      });
    }
  }
}

module.exports = CampaignController;
