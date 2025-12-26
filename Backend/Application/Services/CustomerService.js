// backend/src/Domain/Services/CustomerService.js
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');
const CustomerAnalyticsSnapshotRepository = require('../../Infrastructure/Repositories/CustomerAnalyticsSnapshotRepository');
const AIClient = require('../../Infrastructure/external/AIClient');

const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

class CustomerService {
  constructor() {
    this.repo = customerRepository;
    this.analyticsRepo = CustomerAnalyticsSnapshotRepository;
    this.aiClient = AIClient;
  }

  // ============================================================
  // Helpers
  // ============================================================
  async _getCustomerOr404(customerId) {
    const customer = await this.repo.findById(customerId);
    if (!customer) {
      throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
    }
    return customer;
  }

  async _getLatestSnapshot(customerId) {
    // Repo nên implement: findLatestByCustomerId(customerId)
    // Return snapshot hoặc null
    if (!this.analyticsRepo?.findLatestByCustomerId) return null;
    return this.analyticsRepo.findLatestByCustomerId(customerId);
  }

  async _updateSnapshot(snapshotId, patch) {
    // Repo nên implement: updateById(snapshotId, patch)
    if (!snapshotId) return null;
    if (!this.analyticsRepo?.updateById) return null;
    return this.analyticsRepo.updateById(snapshotId, patch);
  }

  _num(x, fb = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fb;
  }

  // ============================================================
  // CRUD Customers (giữ nguyên)
  // ============================================================
  async createCustomer(customerData) {
    try {
      const customer = await this.repo.create(customerData);
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async getCustomerById(customerId) {
    try {
      const customer = await this.repo.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_CUSTOMER_FAILED' }));
    }
  }

  async listCustomers(params) {
    try {
      const customers = await this.repo.findAll(params);
      return ok(customers);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_CUSTOMERS_FAILED' }));
    }
  }

  async updateCustomer(customerId, patch) {
    try {
      const customer = await this.repo.update(customerId, patch);
      if (!customer) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_CUSTOMER_FAILED' }));
    }
  }

  async deleteCustomer(customerId) {
    try {
      const deleted = await this.repo.delete(customerId);
      if (!deleted) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok({ deleted: true });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'DELETE_CUSTOMER_FAILED' }));
    }
  }

  // ============================================================
  // Tags
  // ============================================================
  async addTagToCustomer(customerId, tag) {
    try {
      if (!tag) throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });

      const customer = await this.repo.addTag(customerId, tag);
      if (!customer) throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });

      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ADD_TAG_FAILED' }));
    }
  }

  async removeTagFromCustomer(customerId, tag) {
    try {
      if (!tag) throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });

      const customer = await this.repo.removeTag(customerId, tag);
      if (!customer) throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });

      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'REMOVE_TAG_FAILED' }));
    }
  }

  async findCustomersByTag(tag) {
    try {
      const customers = await this.repo.findByTag(tag);
      return ok(customers);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'FIND_BY_TAG_FAILED' }));
    }
  }

  async findCustomersBySource(source) {
    try {
      const customers = await this.repo.findBySource(source);
      return ok(customers);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'FIND_BY_SOURCE_FAILED' }));
    }
  }

  // ============================================================
  // AI / ML: Build payloads từ snapshot.metadata
  // ============================================================
  _buildChurnPayload(customer, snapshot) {
    const meta = snapshot?.metadata || {};
    // Theo body bạn test: (JSON thẳng, không bọc features)
    return {
      recency_days: this._num(meta.recency_days ?? meta.recency ?? 0),
      orders_90d: this._num(meta.orders_90d ?? meta.frequency_90d ?? 0),
      revenue_365d: this._num(meta.revenue_365d ?? 0),
      avg_order_value: this._num(meta.avg_order_value ?? 0),
      return_rate: this._num(meta.return_rate ?? 0),
      email_open_rate: this._num(meta.email_open_rate ?? 0),
    };
  }

  _buildCLVPayload(customer, snapshot, horizon = '12m') {
    const meta = snapshot?.metadata || {};
    // Khớp input train bạn đang dùng (như test_cases)
    return {
      horizon,
      clv_json: {
        acquisition_channel: meta.acquisition_channel ?? customer?.source ?? 'Unknown',
        campaign_type: meta.campaign_type ?? 'Unknown',
        acquisition_cost: this._num(meta.acquisition_cost ?? 0),

        recency: this._num(meta.recency ?? 0),
        frequency_90d: this._num(meta.frequency_90d ?? 0),
        product_diversity: this._num(meta.product_diversity ?? 0),

        return_rate: this._num(meta.return_rate ?? 0),
        email_open_rate: this._num(meta.email_open_rate ?? 0),
        support_ticket_count: this._num(meta.support_ticket_count ?? 0),

        first_purchase_year: this._num(meta.first_purchase_year ?? new Date().getFullYear()),
        // giữ đúng field name “first_purchase_purchase_month” (theo code train bạn đưa)
        first_purchase_purchase_month: this._num(
          meta.first_purchase_purchase_month ?? (new Date().getMonth() + 1)
        ),
        first_purchase_dayofweek: this._num(meta.first_purchase_dayofweek ?? new Date().getDay()),

        log_monetary_90d: this._num(meta.log_monetary_90d ?? 0),
        log_avg_order_value: this._num(meta.log_avg_order_value ?? 0),
      },
    };
  }

  _buildSegmentPayload(customer, snapshot, segmentMap) {
    const meta = snapshot?.metadata || {};
    // segmentation_json: đúng schema bạn gửi lên AI service
    return {
      segmentation_json: {
        Recency: this._num(meta.seg_recency ?? meta.recency_score ?? 0),
        Frequency: this._num(meta.seg_frequency ?? meta.frequency_score ?? 0),
        Monetary: this._num(meta.seg_monetary ?? meta.monetary_score ?? 0),
        Discount_Sensitivity: this._num(meta.discount_sensitivity ?? 0),
        Category_Breadth: this._num(meta.category_breadth ?? 0),
      },
      segment_map_json: segmentMap || {},
    };
  }

  // ============================================================
  // AI / ML: Public methods để Controller gọi
  // ============================================================

  // POST /customers/:id/analyze-churn
  async predictChurn(customerId, { debug = false } = {}) {
    try {
      const customer = await this._getCustomerOr404(customerId);
      const snap = await this._getLatestSnapshot(customerId);

      const churn_json = this._buildChurnPayload(customer, snap);
      const aiRes = await this.aiClient.predictCustomerChurn(churn_json, debug);

      // Chuẩn hoá output
      const churnScore = this._num(aiRes?.churn_score ?? aiRes?.probability ?? aiRes?.churn_probability ?? 0);

      // Persist vào snapshot nếu có
      if (snap?.snapshot_id) {
        await this._updateSnapshot(snap.snapshot_id, {
          churn_score: churnScore,
          metadata: { ...(snap.metadata || {}), churn_ai: aiRes },
        });
      }

      return ok({
        customer_id: customerId,
        churn_score: churnScore,
        raw: aiRes,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'PREDICT_CHURN_FAILED' }));
    }
  }

  // POST /customers/:id/analyze-clv?horizon=6m|12m
  async predictCLV(customerId, { horizon = '12m', debug = false } = {}) {
    try {
      const customer = await this._getCustomerOr404(customerId);
      const snap = await this._getLatestSnapshot(customerId);

      const payload = this._buildCLVPayload(customer, snap, horizon);
      const aiRes = await this.aiClient.predictCustomerCLV(payload.horizon, payload.clv_json, debug);

      const clvPred = this._num(aiRes?.CLV_pred ?? aiRes?.clv_pred ?? 0);

      if (snap?.snapshot_id) {
        await this._updateSnapshot(snap.snapshot_id, {
          metadata: { ...(snap.metadata || {}), [`clv_${horizon}`]: aiRes },
        });
      }

      return ok({
        customer_id: customerId,
        horizon,
        clv_pred: clvPred,
        raw: aiRes,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'PREDICT_CLV_FAILED' }));
    }
  }

  // POST /customers/:id/segment  body: { segment_map_json, debug }
  async segmentCustomer(customerId, { segmentMap = {}, debug = false } = {}) {
    try {
      const customer = await this._getCustomerOr404(customerId);
      const snap = await this._getLatestSnapshot(customerId);

      const payload = this._buildSegmentPayload(customer, snap, segmentMap);
      const aiRes = await this.aiClient.segmentCustomer(
        payload.segmentation_json,
        payload.segment_map_json,
        debug
      );

      if (snap?.snapshot_id) {
        await this._updateSnapshot(snap.snapshot_id, {
          metadata: { ...(snap.metadata || {}), segment_ai: aiRes },
        });
      }

      return ok({
        customer_id: customerId,
        segment_id: aiRes?.segment_id ?? null,
        segment_name: aiRes?.segment_name ?? null,
        distances_to_centers: aiRes?.distances_to_centers ?? null,
        used_preprocess: aiRes?.used_preprocess ?? null,
        raw: aiRes,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'SEGMENT_CUSTOMER_FAILED' }));
    }
  }
  // predict tất cả custommer churn+ clv + segment daily 
  async predictAlldaily({ debug = false } = {}) {
    try {
      const customers = await this.repo.findAll({});
      for (const customer of customers) {
        const customerId = customer.id;
        await this.predictChurn(customerId, { debug });
        await this.predictCLV(customerId, { horizon: '12m', debug });
        await this.segmentCustomer(customerId, { segmentMap: {}, debug });
      }
      return ok({ message: 'Predicted all customers daily successfully' });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'PREDICT_ALL_DAILY_FAILED' }));
    }
  }


  //Trả về tổng số khách hàng được thêm mới
  async getCustomersByDateRange(from, to){
    try {
      const totalCustomers = (await customerRepository.findAll()).length;
      const customersInRange = await customerRepository.getCustomersByDateRange(from, to);
      const newCustomersCount = customersInRange.length;

      return ok({
        totalCustomers,
        newCustomersCount,
        customersInRange
      });
    } catch (error) {
      return fail(asAppError(error, { status: 500, code: 'GET_CUSTOMERS_BY_DATE_RANGE_FAILED' }));
    }
  }
}

module.exports = new CustomerService();
