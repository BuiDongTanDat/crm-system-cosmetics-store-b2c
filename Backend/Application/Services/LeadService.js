// backend/src/Domain/Services/LeadService.js
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();
const leadRepository = require('../../Infrastructure/Repositories/LeadRepository.js');
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository.js');
const campaignRepository = require('../../Infrastructure/Repositories/CampaignRepository.js');
const stateMachine = require('../../Domain/Entities/leadStateMachine.js');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');
const aiClient = require('../../Infrastructure/external/AIClient.js');
const { ImportLeadFromCSVDTO } = require('../DTOs/LeadDTO.js');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');
const csv = require('csvtojson');
const MAP_TO_DB = {
  leads: 'new', new: 'new', contacted: 'contacted', qualified: 'qualified',
  nurturing: 'nurturing', converted: 'converted', 'closed-lost': 'closed_lost',
  closed_lost: 'closed_lost', lost: 'closed_lost',
};
class LeadService {
  constructor() {
    this.repo = leadRepository;
  }

  // ----------------------------
  // CRUD cơ bản
  // ----------------------------
  async createLead(leadData) {
    try {
      if (!leadData) {
        throw new AppError('Lead data is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      // 1) Kiểm tra campaign_id nếu có
      let campaign = null;
      if (leadData.campaign_id) {
        campaign = await campaignRepository.findById(leadData.campaign_id);
        if (!campaign) console.log(`[WARN] Campaign ${leadData.campaign_id} not found`);
      }

      // 2) Validate cơ bản + kiểm tra trùng
      const {
        customer_id, source, status, lead_score, conversion_prob,
        assigned_to, tags, priority, product_interest
      } = leadData;

      if (leadData.email) {
        const dupEmail = await this.repo.findByEmail(leadData.email);
        if (dupEmail) throw new AppError('Email already exists', { status: 400, code: 'DUPLICATE_EMAIL' });
      }
      if (leadData.phone) {
        const dupPhone = await this.repo.findByPhone(leadData.phone);
        if (dupPhone) throw new AppError('Phone number already exists', { status: 400, code: 'DUPLICATE_PHONE' });
      }

      let finalCustomerId = null;
      if (customer_id) {
        const foundCustomer = await customerRepository.findById(customer_id);
        if (foundCustomer) finalCustomerId = customer_id;
      }

      if (lead_score !== undefined && isNaN(lead_score)) {
        throw new AppError('lead_score must be a number', { status: 400, code: 'VALIDATION_ERROR' });
      }
      if (conversion_prob !== undefined && (isNaN(conversion_prob) || conversion_prob < 0 || conversion_prob > 1)) {
        throw new AppError('conversion_prob must be between 0 and 1', { status: 400, code: 'VALIDATION_ERROR' });
      }

      // 3) Chuẩn bị payload cơ bản
      const payload = {
        customer_id: finalCustomerId,
        name: leadData.name || 'Unnamed Lead',
        phone: leadData.phone || null,
        email: leadData.email || null,
        source: source || 'inbound',          // NOTE: model default đang 'Inbound', bạn có thể đồng bộ lại
        status: status || 'new',
        campaign_id: leadData.campaign_id || null,
        tags: Array.isArray(tags) ? tags : [],
        lead_score: lead_score ?? 0,
        conversion_prob: conversion_prob ?? 0,
        assigned_to: assigned_to || null,
        created_at: new Date(),

        // 🔹 Trường mới:
        priority: priority || 'medium',
        product_interest: product_interest || null,
        // tên deal = tên chiến dịch (nếu có campaign)
        deal_name: campaign?.name || null,

        // 🔮 chỗ chứa kết quả AI (sẽ set sau khi gọi AI)
        predicted_prob: null,
        predicted_value: 0,
        predicted_value_currency: 'VND',
        last_predicted_at: null,
      };

      // 4) Gọi AI service để dự đoán (best-effort, không chặn luồng nếu lỗi)
      try {
        const features = {
          // Bạn có thể thêm nhiều feature hơn tùy mô hình của bạn
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          source: payload.source,
          lead_score: payload.lead_score,
          tags: payload.tags,
          campaign_id: payload.campaign_id,
          priority: payload.priority,
          product_interest: payload.product_interest,
          // Thêm thông tin campaign nếu có
          campaign_channel: campaign?.channel || null,
          campaign_name: campaign?.name || null,
          assigned_to: payload.assigned_to,
        };

        const aiResp = await aiService.scoreLead(features);
        if (aiResp) {
          const { predicted_prob, predicted_value, predicted_value_currency } = aiResp;

          if (predicted_prob !== undefined && !isNaN(predicted_prob)) {
            payload.predicted_prob = predicted_prob;
          }
          if (predicted_value !== undefined && !isNaN(predicted_value)) {
            payload.predicted_value = predicted_value;
          }
          if (predicted_value_currency) {
            payload.predicted_value_currency = predicted_value_currency;
          }
          payload.last_predicted_at = new Date();
        }
      } catch (aiErr) {
        console.warn('[AI] Failed to score lead, continue without predictions:', aiErr?.message || aiErr);
      }

      console.log('Creating lead with payload:', payload);

      // 5) Transaction: tạo lead + tạo interaction "interested"
      const result = await sequelize.transaction(async (t) => {
        const lead = await this.repo.create(payload, { transaction: t });

        await this.repo.addInteraction(lead.lead_id, {
          type: 'interested',
          channel: campaign?.channel || payload.source || 'unknown',
          occurred_at: new Date(),
          properties: {
            campaign_id: lead.campaign_id,
            campaign_name: campaign?.name || null,
            product_interest: payload.product_interest || null,
            note: 'Tương tác đầu tiên từ chiến dịch marketing',
            // đưa thêm kết quả AI vào interaction để trace
            ai_predicted_prob: payload.predicted_prob,
            ai_predicted_value: payload.predicted_value,
            ai_currency: payload.predicted_value_currency,
          },
          score_delta: 5,
          created_by: assigned_to || null, // hoặc 'system'
        }, { transaction: t });

        return lead;
      });

      // 6) Publish sự kiện (kèm predicted fields & trường mới)
      try {
        await Rabbit.publish('lead_created', {
          lead_id: result.lead_id,
          campaign_id: result.campaign_id,
          source: result.source,
          tags: result.tags,
          priority: result.priority,
          product_interest: result.product_interest,
          deal_name: result.deal_name,
          predicted_prob: result.predicted_prob,
          predicted_value: result.predicted_value,
          predicted_value_currency: result.predicted_value_currency,
        });
        console.log(`[EVENT] lead_created published for lead ${result.lead_id}`);
      } catch (pubErr) {
        console.error('[RabbitMQ] Failed to publish lead_created:', pubErr);
      }

      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'CREATE_LEAD_FAILED' }));
    }
  }

  async addInteraction(leadId, payload) {
    const toContacted = stateMachine.interactionHints?.toContacted?.(payload);
    const toClosedLost = stateMachine.interactionHints?.toClosedLost?.(payload);

    let nextStatus = null;
    if (toContacted && lead.status === 'new') nextStatus = 'contacted';
    if (toClosedLost) nextStatus = 'closed_lost';

    const scoreDelta = Number(payload.score_delta || 0);
    const newScore = (lead.lead_score || 0) + scoreDelta;
    if (!nextStatus &&
      newScore >= stateMachine.thresholds.qualifiedScore &&
      ['new', 'contacted'].includes(lead.status)) {
      nextStatus = 'qualified';
    }

    if (nextStatus && nextStatus !== lead.status && stateMachine.canTransition(lead.status, nextStatus)) {
      await this.changeStatus(
        leadId,
        nextStatus,
        `auto_transition_by_interaction:${payload.type}`,
        payload.created_by || null,
        { interaction_id: item.interaction_id }
      );
    }
  }
  // Thay thế hàm static cũ bằng bản instance dưới đây:
  async updateLeadStatus(leadId, rawStatus) {
    try {
      const norm = String(rawStatus || '').trim().toLowerCase();
      const toStatus = MAP_TO_DB[norm] || norm;

      const allowed = stateMachine.allowedStatuses ? stateMachine.allowedStatuses() : [
        'new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'
      ];
      if (!allowed.includes(toStatus)) {
        return fail({ status: 400, code: 'INVALID_STATUS', message: `Hợp lệ: ${allowed.join(', ')}` });
      }

      const found = await this.repo.findById(leadId);
      if (!found) return fail({ status: 404, code: 'LEAD_NOT_FOUND', message: 'Không tìm thấy lead cần cập nhật' });

      const from = String(found.status || '').toLowerCase();
      if (from === toStatus) return ok({ message: 'Status unchanged', data: found });

      //  enforce đồ thị bằng state machine
      if (!stateMachine.canTransition(from, toStatus)) {
        return fail({ status: 400, code: 'INVALID_TRANSITION', message: `Invalid transition ${from} → ${toStatus}` });
      }

      //  đi qua cổng chuẩn (repo.logStatusChange sẽ ghi history trong transaction)
      return await this.changeStatus(leadId, toStatus, 'pipeline_drag_drop', null, { source: 'pipeline' });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_LEAD_STATUS_FAILED' }));
    }
  }
  // Thêm mới: gom leads theo cột (stage) cho UI Kanban
  async getPipelineColumns() {
    try {
      const ORDER = [
        'new',
        'contacted',
        'qualified',
        'nurturing',
        'converted',
        'closed_lost',
      ];

      // Lấy toàn bộ lead (tuỳ bạn, có thể giới hạn theo campaign / owner sau)
      const leads = await this.repo.findAll();

      // Khởi tạo khung cột rỗng theo thứ tự cố định
      const columns = ORDER.reduce((acc, k) => {
        acc[k] = [];
        return acc;
      }, {});

      for (const l of leads) {
        const key = (l.status || 'new').toLowerCase();
        const bucket = ORDER.includes(key) ? key : 'new';
        columns[bucket].push(l);
      }

      return ok({ columns, order: ORDER });
    } catch (err) {
      return fail(
        asAppError(err, { status: 500, code: 'PIPELINE_FETCH_FAILED' })
      );
    }
  }

  async changeStatus(leadId, toStatus, reason = null, changedBy = null, meta = {}) {
    try {
      const to = String(toStatus || '').trim().toLowerCase();

      const lead = await this.repo.findById(leadId);
      if (!lead) return fail({ status: 404, code: 'LEAD_NOT_FOUND', message: 'Không tìm thấy lead' });

      const from = String(lead.status || '').toLowerCase();
      if (from === to) return ok({ message: 'Status unchanged', data: lead });

      // state machine guard
      if (!stateMachine.canTransition(from, to)) {
        return fail({ status: 400, code: 'INVALID_TRANSITION', message: `Invalid transition ${from} → ${to}` });
      }

      const updated = await this.repo.logStatusChange(leadId, to, {
        reason, changed_by: changedBy, meta
      }); // repo sẽ transaction + lock + ghi LeadStatusHistory
      if (!updated) return fail({ status: 404, code: 'LEAD_NOT_FOUND', message: 'Lead không tồn tại' });

      return ok(updated);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CHANGE_STATUS_FAILED' }));
    }
  }

  async getPipelineSummary() {
    try {
      const rows = await this.repo.aggregateByStatus();
      return ok({ rows });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'PIPELINE_SUMMARY_FAILED' }));
    }
  }

  async getLeadById(leadId) {
    try {
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_LEAD_FAILED' }));
    }
  }

  // Danh sách có phân trang (khớp với repo.paginate)
  // async listLeads() {
  //   try {
  //     const res = await this.repo.findAll();
  //     return ok(res);
  //   } catch (err) {
  //     return fail(asAppError(err, { status: 500, code: 'LIST_LEADS_FAILED' }));
  //   }
  // }
  async getAll() {
    const items = await this.repo.findAll();
    if (!items || items.length === 0) {
      throw new AppError('No leads found', { status: 404, code: 'LEADS_NOT_FOUND' });
    }
    return items;
  }

  async updateLead(leadId, patch) {
    try {
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      //kiểm tra dữ liệu trùng lặp nếu có thay đổi email hoặc phone
      if (patch.email && patch.email !== lead.email) {
        const dupEmail = await this.repo.findByEmail(patch.email);
        if (dupEmail) throw new AppError('Email already exists', { status: 400, code: 'DUPLICATE_EMAIL' });
      }
      if (patch.phone && patch.phone !== lead.phone) {
        const dupPhone = await this.repo.findByPhone(patch.phone);
        if (dupPhone) throw new AppError('Phone number already exists', { status: 400, code: 'DUPLICATE_PHONE' });
      }
      await this.repo.update(patch || {});
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_LEAD_FAILED' }));
    }
  }
  // chuyển lead thành khách hàng thủ công 
  async convertLeadToCustomer(leadId, { by = null, reason = 'Manual convert', customerPatch = {} } = {}) {
    try {
      const result = await sequelize.transaction(async (t) => {
        // 1) Lấy & khóa lead
        const lead = await this.repo.findById(leadId);
        if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

        // Nếu đã có customer_id thì coi như đã convert
        if (lead.customer_id) {
          const existingCustomer = await customerRepository.findById(lead.customer_id);
          return { lead, customer: existingCustomer };
        }

        // 2) Tạo dữ liệu khách hàng (kết hợp patch nếu có)
        const customerData = {
          name: lead.name || lead.full_name || 'Unnamed Customer',
          email: lead.email || null,
          phone: lead.phone || null,
          source: lead.source || 'lead',
          tags: Array.isArray(lead.tags) ? lead.tags : [],
          assigned_to: lead.assigned_to || null,
          ...customerPatch,
        };

        // 3) Tránh trùng: tìm theo email/phone, nếu chưa có thì tạo mới (trong transaction)
        const customer = await customerRepository.findOrCreateSmart(customerData, { transaction: t });

        // 4) Cập nhật Lead: set customer_id + đổi status & ghi lịch sử (transactional trong repo)
        await this.repo.updateById(
          leadId,
          { customer_id: customer.customer_id, status: 'converted', conversion_prob: 1 },
          { changed_by: by, reason, meta: { method: 'manual_convert' } }
        );

        // 5) Ghi interaction để audit
        await this.repo.addInteraction(leadId, {
          type: 'manual_convert',
          channel: 'system',
          properties: { reason },
          score_delta: 0,
          created_by: by || null,
        });

        // 6) Lấy lại lead mới nhất
        const updatedLead = await this.repo.findById(leadId);
        return { lead: updatedLead, customer };
      });

      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CONVERT_LEAD_FAILED' }));
    }
  }
  // chuyển lead thành khách hàng tự động khi có đơn hàng được chuyển đổi 
  async autoConvertLead(leadId, { orderId = null, by = null, customerPatch = {} } = {}) {
    try {
      const result = await sequelize.transaction(async (t) => {
        // 1) Khóa bản ghi lead để tránh race condition
        const lead = await this.repo.findById(leadId);
        if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

        // Nếu đã có customer_id thì coi như đã convert
        if (lead.customer_id) {
          return { lead, customer: await customerRepository.findById(lead.customer_id) };
        }

        // 2) Tìm Customer trùng (email/phone) hoặc tạo mới
        const customer = await customerRepository.findOrCreateSmart(
          {
            name: lead.name || lead.full_name || 'Unnamed Customer',
            email: lead.email || null,
            phone: lead.phone || null,
            source: lead.source || 'lead',
            assigned_to: lead.assigned_to || null,
            ...customerPatch, // cho phép override thêm field
          },
          { transaction: t }
        );

        // 3) Cập nhật Lead → set customer_id + đổi status & ghi lịch sử (transactional)
        const reason = orderId ? `Auto-convert by order ${orderId}` : 'Auto-convert';
        await this.repo.updateById(
          leadId,
          { customer_id: customer.customer_id, status: 'converted', conversion_prob: 1 },
          { changed_by: by, reason, meta: { order_id: orderId } }
        );

        // 4) Ghi interaction để audit timeline
        await this.repo.addInteraction(leadId, {
          type: 'order_converted',
          channel: 'system',
          properties: { order_id: orderId },
          score_delta: 0,
          created_by: by || null,
        });

        // lấy lại lead mới nhất
        const updatedLead = await this.repo.findById(leadId);
        return { lead: updatedLead, customer };
      });

      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'AUTO_CONVERT_LEAD_FAILED' }));
    }
  }
  async getPipelineMetrics() {
    const rows = await this.repo.getLeadsGroupedByStatus();

    const byStatus = {};
    let totalDeals = 0;
    let totalValue = 0;

    for (const r of rows) {
      const status = (r.status || 'new').toLowerCase();
      const count = Number(r.count) || 0;
      const sum = Number(r.sum_value) || 0;

      byStatus[status] = { count, sumValue: sum };
      totalDeals += count;
      totalValue += sum;
    }

    const converted = byStatus.converted?.count || 0;
    const closedLost = byStatus.closed_lost?.count || 0;
    const lost = byStatus.lost?.count || 0;
    const doneLeads = converted + closedLost + lost;
    const processingLeads = Math.max(0, totalDeals - doneLeads);
    const conversionRate = totalDeals > 0 ? (converted / totalDeals) * 100 : 0;

    return {
      totalDeals,
      totalValue,
      conversionRate: Number(conversionRate.toFixed(2)),
      processingLeads,
      doneLeads,
      byStatus,
    };
  }
  async getLeadDetails(leadId) {
    try {
      // 1) Lấy lead chính
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

      // 2) Lấy các bản ghi liên quan
      const [interactions, statusHistory, customer] = await Promise.all([
        this.repo.listInteractions?.(leadId) ?? [],
        this.repo.listStatusHistory?.(leadId) ?? [],
        lead.customer_id ? customerRepository.findById(lead.customer_id) : null,
      ]);

      // 3) Gom dữ liệu lại thành 1 object
      const details = {
        ...lead.toJSON(),
        customer: customer ? customer.toJSON?.() ?? customer : null,
        interactions: interactions.map(i => i.toJSON?.() ?? i),
        statusHistory: statusHistory.map(h => h.toJSON?.() ?? h),
      };

      return ok(details);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_LEAD_DETAILS_FAILED' }));
    }
  }
  async deleteLead(leadId) {
    try {
      const found = await this.repo.findById(leadId);
      if (!found) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      await this.repo.delete(leadId);
      return ok({ deleted: true });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'DELETE_LEAD_FAILED' }));
    }
  }
  // ======= SINGLE PREDICT =======
  async predictConversion(leadId, { force = false } = {}) {
    try {
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404 });

      // Caching — nếu đã có predicted_prob trong 24h, không gọi lại AI
      if (!force && lead.predicted_prob && lead.last_predicted_at) {
        const ageHours = (Date.now() - new Date(lead.last_predicted_at)) / (1000 * 60 * 60);
        if (ageHours < 24) {
          return ok({
            lead_id: lead.lead_id,
            probability: lead.predicted_prob,
            cached: true,
          });
        }
      }

      // Lấy interactions
      const interactions = await leadRepository.listInteractions(leadId);

      // Chuẩn hóa dữ liệu gửi AI
      const payload = {
        lead_id: lead.lead_id,
        lead_score: lead.lead_score,
        status: lead.status,
        source: lead.source,
        interaction_count: interactions.length,
        avg_score_delta:
          interactions.length > 0
            ? interactions.reduce((a, i) => a + (i.score_delta || 0), 0) / interactions.length
            : 0,
        last_interaction_days:
          interactions.length > 0
            ? (Date.now() - new Date(interactions[0].occurred_at)) / (1000 * 60 * 60 * 24)
            : null,
      };

      const aiRes = await aiClient.predictConversion(payload);
      const prob = aiRes.probability ?? 0;

      // Update cache
      await leadRepository.update(leadId, {
        predicted_prob: prob,
        last_predicted_at: new Date(),
      });

      return ok({
        lead_id: lead.lead_id,
        probability: prob,
        reason: aiRes.reason ?? null,
        cached: false,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'PREDICT_CONVERSION_FAILED' }));
    }
  }

  // ======= BATCH PREDICT =======
  async predictBatch(limit = 100) {
    try {
      // Lấy các lead chưa có dự báo hoặc quá 24h
      const leads = await leadRepository.findStalePredictions(limit);

      if (!leads.length) return ok({ message: 'No leads need prediction', count: 0 });

      // Gọi AI theo batch
      const payloads = [];
      for (const lead of leads) {
        const interactions = await leadRepository.listInteractions(lead.lead_id);
        payloads.push({
          lead_id: lead.lead_id,
          lead_score: lead.lead_score,
          status: lead.status,
          source: lead.source,
          interaction_count: interactions.length,
        });
      }

      const aiRes = await aiClient.predictBatch(payloads); // cần hỗ trợ batch bên AIClient

      // Update DB song song
      for (const r of aiRes.results) {
        await leadRepository.update(r.lead_id, {
          predicted_prob: r.probability,
          last_predicted_at: new Date(),
        });
      }

      return ok({ message: 'Batch prediction completed', count: aiRes.results.length });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'BATCH_PREDICT_FAILED' }));
    }
  }
  // ----------------------------
  // Nghiệp vụ: Trạng thái & Lịch sử
  // ----------------------------
  async changeStatus(leadId, toStatus, reason = null, changedBy = null, meta = {}) {
    try {
      if (!toStatus) throw new AppError('toStatus is required', { status: 400, code: 'VALIDATION_ERROR' });

      // dùng method transactional trong repo
      const lead = await this.repo.logStatusChange(leadId, toStatus, {
        reason,
        changed_by: changedBy,
        meta,
      });
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CHANGE_STATUS_FAILED' }));
    }
  }

  async listStatusHistory(leadId, params = {}) {
    try {
      const list = await this.repo.getStatusHistory(leadId, params);
      return ok(list || []);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_STATUS_HISTORY_FAILED' }));
    }
  }

  // (tùy chọn) Ghi thủ công 1 bản ghi lịch sử — thường không cần vì changeStatus đã tự ghi
  async appendStatusHistory(leadId, history) {
    try {
      // đảm bảo lead tồn tại
      const found = await this.repo.findById(leadId);
      if (!found) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

      // viết trực tiếp qua model nếu bạn muốn; ở đây tận dụng repo (có thể expose 1 helper riêng).
      // đơn giản: đổi trạng thái về chính nó để tạo record (không khuyến khích)
      // => tốt hơn là tạo 1 method repo dành riêng, nhưng ở repo hiện tại chưa mở sẵn.
      throw new AppError('Not supported directly. Use changeStatus()', { status: 400, code: 'NOT_SUPPORTED' });
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'APPEND_STATUS_HISTORY_FAILED' }));
    }
  }

  // ----------------------------
  // Interaction & Scoring
  // ----------------------------
  // async addInteraction(leadId, interactionData) {
  //   try {
  //     const result = await this.repo.addInteraction(leadId, interactionData);
  //     if (!result) {
  //       throw new AppError('Lead not found or cannot add interaction', {
  //         status: 404,
  //         code: 'LEAD_OR_INTERACTION_ERROR',
  //       });
  //     }
  //     return ok(result);
  //   } catch (err) {
  //     return fail(asAppError(err, { status: 500, code: 'ADD_INTERACTION_FAILED' }));
  //   }
  // }

  async listInteractions(leadId, params = {}) {
    try {
      const list = await this.repo.getInteractions(leadId, params);
      return ok(list || []);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_INTERACTIONS_FAILED' }));
    }
  }

  async deleteInteraction(interactionId) {
    try {
      await this.repo.deleteInteraction(interactionId);
      return ok({ deleted: true });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'DELETE_INTERACTION_FAILED' }));
    }
  }

  async recentActivity(params = {}) {
    try {
      const items = await this.repo.getRecentActivity(params);
      return ok(items || []);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'RECENT_ACTIVITY_FAILED' }));
    }
  }

  // Điều chỉnh điểm: ghi 1 interaction với score_delta để vừa audit vừa cập nhật điểm
  async adjustScore(leadId, delta = 0, { reason = null, by = null } = {}) {
    try {
      const res = await this.repo.addInteraction(leadId, {
        type: 'manual_score_adjust',
        channel: 'system',
        properties: reason ? { reason } : {},
        score_delta: Number(delta) || 0,
        created_by: by || null,
      });
      if (!res) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      return ok(res);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ADJUST_SCORE_FAILED' }));
    }
  }

  async recomputeLeadScore(leadId) {
    try {
      const lead = await this.repo.recomputeLeadScore(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'RECOMPUTE_SCORE_FAILED' }));
    }
  }

  // ----------------------------
  // Tagging (giả định cột tags là ARRAY/JSONB trên Lead)
  // ----------------------------
  async addTag(leadId, tag) {
    try {
      if (!tag) throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

      const tags = Array.isArray(lead.tags) ? lead.tags.slice() : [];
      if (!tags.includes(tag)) tags.push(tag);
      await lead.update({ tags });

      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ADD_TAG_FAILED' }));
    }
  }

  async removeTag(leadId, tag) {
    try {
      if (!tag) throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

      const tags = (Array.isArray(lead.tags) ? lead.tags : []).filter(t => t !== tag);
      await lead.update({ tags });

      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'REMOVE_TAG_FAILED' }));
    }
  }

  async findLeadsByTag(tag) {
    try {
      // nếu muốn tối ưu, chuyển qua repo query iLike JSONB/ARRAY; ở đây dùng paginate filter thô
      const res = await this.repo.paginate({ page: 1, pageSize: 100, filters: {} });
      const list = (res?.data || []).filter(l => Array.isArray(l.tags) && l.tags.includes(tag));
      return ok(list);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'FIND_BY_TAG_FAILED' }));
    }
  }

  // ----------------------------
  // Assign / Flow tiện ích
  // ----------------------------
  async assignLead(leadId, userId) {
    try {
      if (!userId) throw new AppError('userId is required', { status: 400, code: 'VALIDATION_ERROR' });
      const lead = await this.repo.assignOwner(leadId, userId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ASSIGN_LEAD_FAILED' }));
    }
  }

  async unassignLead(leadId) {
    try {
      const lead = await this.repo.assignOwner(leadId, null);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UNASSIGN_LEAD_FAILED' }));
    }
  }

  async updateFlow(leadId, { flow_id = null, trigger_type = null, trigger_at = null } = {}) {
    try {
      const lead = await this.repo.updateFlow(leadId, { flow_id, trigger_type, trigger_at });
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_FLOW_FAILED' }));
    }
  }

  // ----------------------------
  // Import CSV
  // ----------------------------
  async importLeadsFromCSV(filePath) {
    try {
      const rows = await csv().fromFile(filePath);
      const dtoList = ImportLeadFromCSVDTO.fromCSVArray(rows);

      const results = [];
      for (const dto of dtoList) {
        try {
          const created = await this.createLead(dto);
          results.push({ ok: true, data: created.data });
        } catch (e) {
          results.push({ ok: false, error: e?.message || String(e) });
        }
      }

      return ok({
        total: dtoList.length,
        succeeded: results.filter(r => r.ok).length,
        failed: results.filter(r => !r.ok).length,
        results,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'IMPORT_CSV_FAILED' }));
    }
  }
}

module.exports = new LeadService();
