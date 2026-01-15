const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();
const leadRepository = require('../../Infrastructure/Repositories/LeadRepository.js');
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository.js');
const campaignRepository = require('../../Infrastructure/Repositories/CampaignRepository.js');
const leadInterestRepository = require('../../Infrastructure/Repositories/LeadInterestRepository.js');
const stateMachine = require('../../Domain/Entities/leadStateMachine.js');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');
const aiClient = require('../../Infrastructure/external/AIClient.js');
const { LEAD_CREATED } = require('../../Domain/Events/LeadEvents.js');
const { ImportLeadFromCSVDTO } = require('../DTOs/LeadDTO.js');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');
const csv = require('csvtojson');
const MAP_TO_DB = {
  leads: 'new', new: 'new', contacted: 'contacted', qualified: 'qualified',
  nurturing: 'nurturing', converted: 'converted', 'closed-lost': 'closed_lost',
  closed_lost: 'closed_lost', lost: 'closed_lost',
};
function normSource(v) {
  const s = String(v || '').trim().toLowerCase();
  const ALLOWED = ['inbound', 'outbound', 'ads', 'referral'];
  return ALLOWED.includes(s) ? s : 'inbound';
}

class LeadService {
  constructor() {
    this.repo = leadRepository;
    this.interestRepo = leadInterestRepository;
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
        customer_id,
        source,
        status,
        lead_score,
        conversion_prob,
        assigned_to,
        tags,
        priority,
        product_interest,
        product_id = null,
        product_ids = null,
        product_name = null,
        meta = {},
      } = leadData;

      const sourceNorm = normSource(source);

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

      const dealName =
        (campaign?.name && String(campaign.name).trim())
          ? String(campaign.name).trim()
          : sourceNorm;

      // 3) Chuẩn bị payload cơ bản
      const payload = {
        customer_id: finalCustomerId,
        name: leadData.name || 'Unnamed Lead',
        phone: leadData.phone || null,
        email: leadData.email || null,
        source: sourceNorm,
        status: (status ? String(status).trim().toLowerCase() : 'new'),
        campaign_id: leadData.campaign_id || null,
        last_campaign_id: leadData.last_campaign_id || leadData.campaign_id || null, // New
        last_channel_id: leadData.last_channel_id || leadData.channel_id || null,     // New
        tags: Array.isArray(tags) ? tags : [],
        lead_score: lead_score ?? 0,
        conversion_prob: conversion_prob ?? 0,
        assigned_to: assigned_to || null,
        created_at: new Date(),
        priority: priority || 'medium',
        product_interest: product_interest || leadData.product_interest || null,
        deal_name: dealName,

        predicted_prob: null,
        predicted_value: 0,
        predicted_value_currency: 'VND',
        last_predicted_at: null,
        note: leadData.note,
      };

      // 4) Gọi AI service để dự đoán (best-effort, không chặn luồng nếu lỗi)
      try {
        const features = {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          source: payload.source,
          lead_score: payload.lead_score,
          tags: payload.tags,
          campaign_id: payload.campaign_id,
          priority: payload.priority,
          product_interest: payload.product_interest,
          campaign_channel: campaign?.channel || null,
          campaign_name: campaign?.name || null,
          assigned_to: payload.assigned_to,
          note: payload.note,
        };

        const aiResp = await aiClient.scoreLead(features);
        if (aiResp) {
          const { score, reason, predicted_prob, predicted_value, predicted_value_currency } = aiResp;

          if (Number.isFinite(score)) {
            payload.lead_score = Number(score);
            payload.ai_reason = reason || null;
          }
          if (Number.isFinite(predicted_prob) && predicted_prob >= 0 && predicted_prob <= 1) {
            payload.conversion_prob = Number(predicted_prob);
          }
          payload.predicted_prob = Number.isFinite(predicted_prob) ? Number(predicted_prob) : null;
          payload.predicted_value = Number.isFinite(predicted_value) ? Number(predicted_value) : 0;
          if (predicted_value_currency) payload.predicted_value_currency = predicted_value_currency;

          payload.last_predicted_at = new Date();
        }
      } catch (aiErr) {
        console.warn('[AI] Failed to score lead, continue without predictions:', aiErr?.message || aiErr);
      }

      console.log('Creating lead with payload:', payload);

      // 5) Transaction: tạo lead + tạo interaction "interested"
      const result = await sequelize.transaction(async (t) => {
        const lead = await this.repo.create(payload, { transaction: t });
        const ids = []
          .concat(product_id ? [product_id] : [])
          .concat(Array.isArray(product_ids) ? product_ids : [])
          .filter(Boolean);
        if (ids.length && this.interestRepo?.upsertInterest) {
          for (const pid of ids) {
            await this.interestRepo.upsertInterest(
              {
                lead_id: lead.lead_id,
                product_id: pid,
                product_name: product_name || product_interest || null,
                source: payload.source,                       // inbound/outbound/ads/referral
                campaign_id: payload.campaign_id || null,
                meta: meta || {},
              },
              { transaction: t }
            );
          }
        }
        await this.repo.addInteraction(
          lead.lead_id,
          {
            type: 'interested',
            channel: campaign?.channel || payload.source || 'unknown',
            occurred_at: new Date(),
            properties: {
              campaign_id: lead.campaign_id,
              campaign_name: campaign?.name || null,
              product_interest: payload.product_interest || null,
              product_id: product_id || (Array.isArray(product_ids) ? product_ids[0] : null),
              note: 'Tương tác đầu tiên từ chiến dịch marketing',
              ai_predicted_prob: payload.predicted_prob,
              ai_predicted_value: payload.predicted_value,
              ai_currency: payload.predicted_value_currency,
            },
            score_delta: 5,
            created_by: assigned_to || null,
          },
          { transaction: t }
        );
        return lead;
      });
      try {
        await Rabbit.publish(LEAD_CREATED, {
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
          product_id: product_id,
          product_ids: product_ids,
        });
        console.log(`[EVENT] lead_created published for lead ${result.lead_id}`);
        console.log('Published event payload:', { lead_id: result.lead_id, campaign_id: result.campaign_id, source: result.source, tags: result.tags, priority: result.priority, product_interest: result.product_interest, deal_name: result.deal_name, predicted_prob: result.predicted_prob, predicted_value: result.predicted_value, predicted_value_currency: result.predicted_value_currency, product_id: result.product_id });
      } catch (pubErr) {
        console.error('[RabbitMQ] Failed to publish lead_created:', pubErr);
      }

      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'CREATE_LEAD_FAILED' }));
    }
  }
  async trackInterest(input = {}) {
    try {
      const {
        anon_id,
        product_id,
        product_name = null,
        source = 'inbound',
        campaign_id = null,
        channel = null,
        occurred_at = null,
        meta = {},
        assigned_to = null,
      } = input;

      if (!anon_id) {
        throw new AppError('anon_id is required', { status: 400, code: 'VALIDATION_ERROR' });
      }
      if (!product_id) {
        throw new AppError('product_id is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      // validate campaign nếu có
      let campaign = null;
      if (campaign_id) {
        campaign = await campaignRepository.findById(campaign_id);
        if (!campaign) console.log(`[WARN] Campaign ${campaign_id} not found`);
      }

      const result = await sequelize.transaction(async (t) => {
        // 1) Upsert lead theo anon_id
        let lead = await this.repo.findByAnonId?.(anon_id, { transaction: t });

        if (!lead) {
          const sourceNorm = normSource(source);
          const dealName =
            (campaign?.name && String(campaign.name).trim())
              ? String(campaign.name).trim()
              : sourceNorm;

          // tạo anonymous lead tối thiểu
          lead = await this.repo.create(
            {
              anon_id,
              source: sourceNorm,
              deal_name: dealName,
              status: 'new',
              lead_score: 0,
              conversion_prob: 0,
              campaign_id: campaign_id || null,
              assigned_to: assigned_to || null,
              tags: [],
              priority: 'medium',
              created_at: new Date(),
            },
            { transaction: t }
          );
        } else {
          // nếu có campaign_id mới thì set (best-effort)
          if (campaign_id && !lead.campaign_id) {
            const newDealName =
              (campaign?.name && String(campaign.name).trim())
                ? String(campaign.name).trim()
                : normSource(lead.source);

            await this.repo.updateById?.(
              lead.lead_id,
              { campaign_id, deal_name: newDealName },
              { transaction: t }
            );
          }
        }

        // 2) Upsert lead_interest (lead_id + product_id unique)
        const interest = await this.interestRepo.upsertInterest(
          {
            lead_id: lead.lead_id,
            product_id,
            product_name,
            source: normSource(source || lead.source),
            campaign_id: campaign_id || lead.campaign_id || null,
            meta,
          },
          { transaction: t }
        );

        const interaction = await this.repo.addInteraction(
          lead.lead_id,
          {
            type: 'interested',
            channel: channel || campaign?.channel || lead.source || 'unknown',
            occurred_at: occurred_at ? new Date(occurred_at) : new Date(),
            properties: {
              anon_id,
              product_id,
              product_name,
              campaign_id: campaign_id || lead.campaign_id || null,
              campaign_name: campaign?.name || null,
              ...meta,
            },
            score_delta: 2,
            created_by: assigned_to || null,
          },
          { transaction: t }
        );

        return { lead, interest, interaction };
      });

      return ok({
        lead_id: result.lead.lead_id,
        anon_id: result.lead.anon_id,
        product_id,
        interested: true,
      });
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'TRACK_INTEREST_FAILED' }));
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
  async getQualifiedLeads() {
    try {
      // gọi trực tiếp repo, không phân trang
      const leads = await this.repo.findAll({ where: { status: 'qualified' } });

      if (!leads || leads.length === 0) {
        throw new AppError('Không có lead nào ở trạng thái qualified', {
          status: 404,
          code: 'QUALIFIED_LEADS_NOT_FOUND',
        });
      }

      return ok(leads);
    } catch (err) {
      return fail(
        asAppError(err, { status: err?.status || 500, code: 'GET_QUALIFIED_LEADS_FAILED' })
      );
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
      const updated = await this.repo.update(leadId, patch || {});
      return ok(updated || lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_LEAD_FAILED' }));
    }
  }
  // chuyển lead thành khách hàng thủ công 
  async convertLeadToCustomer(
    leadId,
    { by = null, reason = 'Manual convert', customerPatch = {} } = {}
  ) {
    try {
      const result = await sequelize.transaction(async (t) => {
        // 1) Lấy lead trong transaction
        const lead = await this.repo.findById(leadId, { transaction: t });
        if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

        if (lead.customer_id) {
          const existingCustomer = await customerRepository.findById(lead.customer_id, { transaction: t });
          if (customerPatch.address) {
            await existingCustomer.update({ address: customerPatch.address }, { transaction: t });
          }
          return { lead, customer: existingCustomer, already_converted: true };
        }

        // 2) Build customer data
        const customerData = {
          // tuỳ schema customer của bạn, ở đây giữ nguyên logic hiện tại
          full_name: lead.name || lead.full_name || 'Unnamed Customer',
          email: lead.email || null,
          phone: lead.phone || null,
          source: lead.source || 'lead',
          tags: Array.isArray(lead.tags) ? lead.tags : [],
          assigned_to: lead.assigned_to || null,
          ...customerPatch,
        };

        // 3) Find-or-create customer trong cùng transaction
        const createdOrFound = await customerRepository.findOrCreateSmart(customerData, { transaction: t });
        const customer = Array.isArray(createdOrFound) ? createdOrFound[0] : createdOrFound;

        const customerId =
          customer?.customer_id ??
          customer?.id ??
          customer?.dataValues?.customer_id ??
          customer?.dataValues?.id;

        if (!customerId) {
          throw new AppError('Customer id not returned from repository', {
            status: 500,
            code: 'CUSTOMER_ID_MISSING',
          });
        }

        await this.repo.updateById(
          leadId,
          { customer_id: customerId, conversion_prob: 1 },
          { transaction: t }
        );

        // status -> converted (có history) trong cùng transaction
        await this.repo.logStatusChange(leadId, 'converted', {
          reason,
          changed_by: by,
          meta: { method: 'manual_convert' },
          transaction: t,
        });

        // 5) Interaction audit trong cùng transaction
        await this.repo.addInteraction(
          leadId,
          {
            type: 'manual_convert',
            channel: 'system',
            occurred_at: new Date(),
            properties: { reason, customer_id: customerId },
            score_delta: 0,
            created_by: by || null,
          },
          { transaction: t }
        );

        // 6) Lấy lead mới nhất trong transaction
        const updatedLead = await this.repo.findById(leadId, { transaction: t });

        return { lead: updatedLead, customer, already_converted: false };
      });

      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'CONVERT_LEAD_FAILED' }));
    }
  }
  async autoConvertLead(leadId, { orderId = null, by = null, customerPatch = {} } = {}) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const lead = await this.repo.findByIdForUpdate
          ? await this.repo.findByIdForUpdate(leadId, { transaction: t })
          : await this.repo.findById(leadId, { transaction: t });
        if (lead.customer_id) {
          const existingCustomer = await customerRepository.findById(lead.customer_id, { transaction: t });
          if (customerPatch.address) {
            await existingCustomer.update({ address: customerPatch.address }, { transaction: t });
          }
          return { lead, customer: existingCustomer, already_converted: true };
        }
        const createdOrFound = await customerRepository.findOrCreateSmart(
          {
            full_name: lead.name || 'Guest',
            email: lead.email || null,
            phone: lead.phone || null,
            source: lead.source || 'lead',
            assigned_to: lead.assigned_to || null,
            ...customerPatch,
          },
          { transaction: t }
        );

        const customer = Array.isArray(createdOrFound) ? createdOrFound[0] : createdOrFound;

        const customerId =
          customer?.customer_id ??
          customer?.id ??
          customer?.dataValues?.customer_id ??
          customer?.dataValues?.id;

        if (!customerId) {
          throw new AppError('Customer id not returned from repository', {
            status: 500,
            code: 'CUSTOMER_ID_MISSING',
          });
        }
        const reason = orderId ? `Auto-convert by order ${orderId}` : 'Auto-convert';
        await this.repo.updateById(
          leadId,
          { customer_id: customerId, conversion_prob: 1 },
          { transaction: t }
        );
        await this.repo.logStatusChange(leadId, 'converted', {
          reason,
          changed_by: by,
          meta: { method: 'auto_convert', order_id: orderId },
          transaction: t,
        });
        await this.repo.addInteraction(
          leadId,
          {
            type: 'order_converted',
            channel: 'system',
            occurred_at: new Date(),
            properties: { order_id: orderId, customer_id: customerId },
            score_delta: 0,
            created_by: by || null,
          },
          { transaction: t }
        );

        const updatedLead = await this.repo.findById(leadId, { transaction: t });
        return { lead: updatedLead, customer, already_converted: false };
      });

      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'AUTO_CONVERT_LEAD_FAILED' }));
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
      const detail = await this.repo.findDetailById?.(leadId);
      if (!detail) {
        const lead = await this.repo.findById(leadId);
        if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
        const [interactions, statusHistory, customer, productInterests] = await Promise.all([
          this.repo.listInteractions?.(leadId) ?? [],
          this.repo.listStatusHistory?.(leadId) ?? [],
          lead.customer_id ? customerRepository.findById(lead.customer_id) : null,
          this.interestRepo?.listByLeadId?.(leadId) ?? [],   // bạn implement bên LeadInterestRepository
        ]);
        return ok({
          ...lead.toJSON(),
          customer: customer ? (customer.toJSON?.() ?? customer) : null,
          product_interests: productInterests.map(x => x.toJSON?.() ?? x),
          interactions: interactions.map(i => i.toJSON?.() ?? i),
          statusHistory: statusHistory.map(h => h.toJSON?.() ?? h),
        });
      }

      const { lead, productInterests, interactions } = detail;

      const customer = lead.customer_id ? await customerRepository.findById(lead.customer_id) : null;

      return ok({
        ...lead.toJSON(),
        customer: customer ? (customer.toJSON?.() ?? customer) : null,
        product_interests: (productInterests || []).map(x => x.toJSON?.() ?? x),
        interactions: (interactions || []).map(x => x.toJSON?.() ?? x),
      });
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
  async predictConversion(leadId, { force = false } = {}) {
    try {
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404 });
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
      const interactions = await leadRepository.listInteractions(leadId);
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
  async changeStatus(leadId, toStatus, reason = null, changedBy = null, meta = {}) {
    try {
      if (!toStatus) throw new AppError('toStatus is required', { status: 400, code: 'VALIDATION_ERROR' });
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
  async appendStatusHistory(leadId, history) {
    try {
      // đảm bảo lead tồn tại
      const found = await this.repo.findById(leadId);
      if (!found) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      throw new AppError('Not supported directly. Use changeStatus()', { status: 400, code: 'NOT_SUPPORTED' });
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'APPEND_STATUS_HISTORY_FAILED' }));
    }
  }
  async addInteraction(leadId, payload) {
    try {
      const lead = await this.repo.findById(leadId);
      if (!lead) throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });

      const item = await this.repo.addInteraction(leadId, payload);
      if (!item) throw new AppError('Cannot add interaction', { status: 400, code: 'ADD_INTERACTION_FAILED' });
      const toContacted = stateMachine.interactionHints?.toContacted?.(payload);
      const toClosedLost = stateMachine.interactionHints?.toClosedLost?.(payload);
      let nextStatus = null;
      if (toContacted && lead.status === 'new') nextStatus = 'contacted';
      if (toClosedLost) nextStatus = 'closed_lost';
      const scoreDelta = Number(payload?.score_delta || 0);
      const newScore = (lead.lead_score || 0) + scoreDelta;

      if (
        !nextStatus &&
        newScore >= stateMachine.thresholds.qualifiedScore &&
        ['new', 'contacted'].includes(lead.status)
      ) {
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

      return ok(item);
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'ADD_INTERACTION_FAILED' }));
    }
  }
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
      const t = String(tag || '').trim();
      if (!t) throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });
      const list = await this.repo.findByConditions({
        tags_in: [t],
        limit: 100,
        offset: 0,
        order: 'created_at:DESC',
      });
      return ok(list || []);
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'FIND_BY_TAG_FAILED' }));
    }
  }
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
  async fromInterest(input = {}) {
    try {
      const {
        anon_id,
        name,
        email,
        phone,
        source = 'inbound',
        campaign_id = null,
        assigned_to = null,
        priority = 'medium',
        note = null,
        tags = [],
        meta = {},
        rescore = true,
      } = input;

      if (!anon_id) {
        throw new AppError('anon_id is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      const hasAnyInfo = Boolean(
        (name && String(name).trim()) ||
        (email && String(email).trim()) ||
        (phone && String(phone).trim())
      );
      if (!hasAnyInfo) {
        throw new AppError('Missing contact info (name/email/phone)', { status: 400, code: 'MISSING_CONTACT_INFO' });
      }

      let campaign = null;
      if (campaign_id) campaign = await campaignRepository.findById(campaign_id);

      const sourceNorm = normSource(source);
      const dealName =
        (campaign?.name && String(campaign.name).trim())
          ? String(campaign.name).trim()
          : sourceNorm;

      const result = await sequelize.transaction(async (t) => {
        const lead = await this.repo.findByAnonId(anon_id, { transaction: t });

        if (!lead) {
          const created = await this.repo.create(
            {
              anon_id,
              name: name || null,
              email: email || null,
              phone: phone || null,
              source: sourceNorm,
              status: 'new',
              campaign_id: campaign_id || null,
              deal_name: dealName,
              assigned_to: assigned_to || null,
              priority: priority || 'medium',
              tags: Array.isArray(tags) ? tags : [],
              notes: note || null,
              lead_score: 0,
              conversion_prob: 0,
              created_at: new Date(),
            },
            { transaction: t }
          );

          await this.repo.addInteraction(
            created.lead_id,
            {
              type: 'promote_from_interest',
              channel: campaign?.channel || created.source || 'web',
              occurred_at: new Date(),
              properties: { anon_id, meta },
              score_delta: 5,
              created_by: assigned_to || null,
            },
            { transaction: t }
          );

          return { lead: created, created_new: true };
        }

        const sourceNorm2 = normSource(source || lead.source);
        const dealName2 =
          (campaign?.name && String(campaign.name).trim())
            ? String(campaign.name).trim()
            : sourceNorm2;

        const patch = {
          name: name ?? lead.name,
          email: email ?? lead.email,
          phone: phone ?? lead.phone,
          source: sourceNorm2,
          campaign_id: lead.campaign_id || campaign_id || null,
          deal_name: dealName2,
          assigned_to: lead.assigned_to || assigned_to || null,
          priority: priority || lead.priority || 'medium',
          notes: note ?? lead.notes,
        };

        const currentTags = Array.isArray(lead.tags) ? lead.tags : [];
        const incomingTags = Array.isArray(tags) ? tags : [];
        patch.tags = Array.from(new Set([...currentTags, ...incomingTags]));

        const updated = await this.repo.updateById(lead.lead_id, patch, { transaction: t });

        await this.repo.addInteraction(
          lead.lead_id,
          {
            type: 'promote_from_interest',
            channel: campaign?.channel || updated.source || 'web',
            occurred_at: new Date(),
            properties: {
              anon_id,
              updated_fields: Object.keys(patch),
              campaign_id: patch.campaign_id,
              campaign_name: campaign?.name || null,
              meta,
            },
            score_delta: 5,
            created_by: assigned_to || null,
          },
          { transaction: t }
        );

        return { lead: updated, created_new: false };
      });

      if (rescore) {
        try {
          const lead = result.lead;
          const interactions = await this.repo.listInteractions?.(lead.lead_id) ?? [];
          const features = {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            tags: lead.tags,
            campaign_id: lead.campaign_id,
            priority: lead.priority,
            note: lead.notes,
            interaction_count: interactions.length,
            campaign_channel: campaign?.channel || null,
            campaign_name: campaign?.name || null,
            meta,
          };

          const aiResp = await aiClient.scoreLead(features);
          if (aiResp) {
            const patchAI = {};
            if (Number.isFinite(aiResp.score)) patchAI.lead_score = Number(aiResp.score);
            if (Number.isFinite(aiResp.predicted_prob) && aiResp.predicted_prob >= 0 && aiResp.predicted_prob <= 1) {
              patchAI.conversion_prob = Number(aiResp.predicted_prob);
              patchAI.predicted_prob = Number(aiResp.predicted_prob);
            }
            if (Number.isFinite(aiResp.predicted_value)) patchAI.predicted_value = Number(aiResp.predicted_value);
            if (aiResp.predicted_value_currency) patchAI.predicted_value_currency = aiResp.predicted_value_currency;
            if (aiResp.reason) patchAI.ai_reason = aiResp.reason;
            patchAI.last_predicted_at = new Date();

            if (Object.keys(patchAI).length) {
              await this.repo.updateById(result.lead.lead_id, patchAI);
            }
          }
        } catch (aiErr) {
          console.warn('[AI] fromInterest(rescore) failed:', aiErr?.message || aiErr);
        }
      }

      // Sau khi result có lead
      try {
        const lead = result.lead;

        // 1) Lấy lại product interests trước đó
        let productInterests = [];
        if (this.interestRepo?.listByLeadId) {
          productInterests = await this.interestRepo.listByLeadId(lead.lead_id);
        }
        const product_ids = (productInterests || [])
          .map(x => x.product_id || x?.toJSON?.()?.product_id)
          .filter(Boolean);
        await Rabbit.publish(
          result.created_new ? LEAD_CREATED : LEAD_CREATED,
          {
            lead_id: lead.lead_id,
            anon_id: lead.anon_id,
            campaign_id: lead.campaign_id,
            source: lead.source,
            tags: lead.tags,
            priority: lead.priority,
            product_ids,
            product_id: product_ids[0] || null,
            product_interests: (productInterests || []).map(x => x.toJSON?.() ?? x),
            predicted_prob: lead.predicted_prob,
            predicted_value: lead.predicted_value,
            predicted_value_currency: lead.predicted_value_currency,
          }
        );
      } catch (pubErr) {
        console.error('[RabbitMQ] Failed to publish lead event (fromInterest):', pubErr?.message || pubErr);
      }


      return ok({
        lead: result.lead,
        created_new: result.created_new,
      });
    } catch (err) {
      return fail(asAppError(err, { status: err?.status || 500, code: 'FROM_INTEREST_FAILED' }));
    }
  }
}
module.exports = new LeadService();
