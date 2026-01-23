// backend/src/Interface/Controller/CustomerController.js
const CustomerService = require('../../Application/Services/CustomerService');
const CustomerAnalyticsService = require('../../Application/Services/CustomerAnalyticsService');
const CustomerInteractionService = require('../../Application/Services/CustomerInteractionService');
const SnapshotService = require('../../Application/Services/CustomerAnalyticsSnapshotService');
const NotificationService = require('../../Application/Services/NotificationService');

class CustomerController {
  // CRUD
  static async getAll(req, res) {
    try {
      const result = await CustomerService.listCustomers({
        limit: req.query.limit,
        offset: req.query.offset,
      });
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async getById(req, res) {
    try {
      const result = await CustomerService.getCustomerById(req.params.id);
      if (result?.ok === false) return res.status(result.error?.status || 404).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async create(req, res) {
    try {
      const result = await CustomerService.createCustomer(req.body);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);

      // Trả về kết quả cho client trước
      res.status(201).json(result);

      // Gửi notification sau, không chờ kết quả
      NotificationService.sendNotification({
        title: 'Khách hàng mới đã được thêm vào hệ thống',
        message: `Khách hàng ${result.data.full_name} vừa được thêm vào hệ thống.`,
        type: 'CUSTOMER',
      }).catch(err => {
        // Log lỗi, không ảnh hưởng tới client
        console.error('Lỗi gửi notification:', err);
      });

    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async update(req, res) {
    try {
      const result = await CustomerService.updateCustomer(req.params.id, req.body);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async delete(req, res) {
    try {
      const result = await CustomerService.deleteCustomer(req.params.id);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }
  static async deleteMany(req, res) {
    try {
      const { customer_ids } = req.body;
      const result = await CustomerService.deleteCustomers(customer_ids);
      if (result?.ok === false) {
        return res.status(result.error?.status || 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: { message: err.message },
      });
    }
  }
  // Import
  static async importCustomers(req, res) {
    try {
      if (!req.file) return res.status(400).json({ ok: false, error: { message: 'No file uploaded' } });
      const result = await CustomerService.importCustomers(req.file.path);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  // Interactions
  static async addInteraction(req, res) {
    try {
      const customerId = req.params.id;
      const payload = req.body || {};
      const result = await CustomerInteractionService.add(customerId, payload);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(201).json(result);
    } catch (e) {
      return res.status(500).json({ ok: false, error: { message: e.message } });
    }
  }

  static async getInteractions(req, res) {
    try {
      const customerId = req.params.id;
      const { type, channel, since, until, limit, offset } = req.query;

      const query = {
        type: type || null,
        channel: channel || null,
        since: since || null,
        until: until || null,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      };

      const result = await CustomerInteractionService.list(customerId, query);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ ok: false, error: { message: e.message } });
    }
  }

  // Orders
  static async getOrders(req, res) {
    try {
      const customerId = req.params.id;
      const { limit, offset, since, until, status } = req.query;

      const opts = {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        since: since || undefined,
        until: until || undefined,
        status: status || undefined,
      };
      const result = await CustomerService.getOrders(customerId, opts);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  // Snapshot rebuild (feature + AI + persist)
  static async rebuildSnapshot(req, res) {
    try {
      const customerId = req.params.id;
      const snapshot_date = req.query.snapshot_date || null; // YYYY-MM-DD
      const horizon = req.query.horizon || '12m';
      const debug = String(req.query.debug || 'false') === 'true';
      const segmentMap = req.body?.segment_map_json || {};

      const snap = await SnapshotService.upsertSnapshotWithAI(customerId, snapshot_date, {
        horizon,
        debug,
        segmentMap,
      });

      return res.status(200).json({ ok: true, data: snap });
    } catch (e) {
      return res.status(500).json({ ok: false, error: { message: e.message } });
    }
  }

  // Dashboard Analytics
  static async getCFMSummary(req, res) {
    try {
      const result = await CustomerAnalyticsService.getCFMSummary(req.query.snapshot_date);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async getCFMList(req, res) {
    try {
      const snapshot_date = req.query.snapshot_date;
      const query = {
        page: req.query.page,
        page_size: req.query.page_size,
        sort: req.query.sort,
        search: req.query.search,
      };
      const result = await CustomerAnalyticsService.listCFM(snapshot_date, query);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async getChurnSummary(req, res) {
    try {
      const result = await CustomerAnalyticsService.getChurnSummary(req.query.snapshot_date);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async getChurnList(req, res) {
    try {
      const snapshot_date = req.query.snapshot_date;
      const query = {
        page: req.query.page,
        page_size: req.query.page_size,
        sort: req.query.sort,
        search: req.query.search,
      };
      const result = await CustomerAnalyticsService.listChurn(snapshot_date, query);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async getCLVSummary(req, res) {
    try {
      const result = await CustomerAnalyticsService.getCLVSummary(req.query.snapshot_date);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  static async getCLVList(req, res) {
    try {
      const snapshot_date = req.query.snapshot_date;
      const query = {
        page: req.query.page,
        page_size: req.query.page_size,
        sort: req.query.sort,
        search: req.query.search,
      };
      const result = await CustomerAnalyticsService.listCLV(snapshot_date, query);
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }

  // Report
  static async getCustomerByDateRange(req, res) {
    try {
      const { from, to } = req.query;
      const result = await CustomerService.getCustomersByDateRange(new Date(from), new Date(to));
      if (result?.ok === false) return res.status(result.error?.status || 400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }
}

module.exports = CustomerController;
