/* eslint-disable camelcase */
const DataManager = require('../../Infrastructure/database/postgres');
const { Op } = require('sequelize');
const sequelize = DataManager.getSequelize();
const CampaignRepository = require('../../Infrastructure/Repositories/CampaignRepository');
const CampaignChannelRepository = require('../../Infrastructure/Repositories/CampaignChannelRepository');
const CampaignChannelFlowRepository = require('../../Infrastructure/Repositories/CampaignChannelFlowRepository');
const ProductRepository = require('../../Infrastructure/Repositories/ProductRepository');
const RabbitMQPublisher = require('../../Infrastructure/Bus/RabbitMQPublisher');
const EVENTS = require('../../Domain/Events/eventscampaing.js');

const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

class CampaignService {
  static async updateStatus(campaignId, newStatus, options = {}) {
    try {
      const validStatuses = ['draft', 'submitted', 'approved', 'configuring', 'running', 'paused', 'ended', 'archived', 'rejected'];
      const next = String(newStatus || '').toLowerCase();
      if (!validStatuses.includes(next)) {
        return fail(
          new AppError('Trạng thái không hợp lệ.', {
            code: 'INVALID_STATUS',
            status: 400,
          })
        );
      }
      const campaign = await CampaignRepository.findById(campaignId);
      if (!campaign) {
        return fail(
          new AppError('Không tìm thấy chiến dịch.', {
            code: 'CAMPAIGN_NOT_FOUND',
            status: 404,
          })
        );
      }
      await CampaignRepository.updateStatus(campaignId, next);

      // Publish đúng campaign-level event để AutomationService fan-out theo channel
      let event = null;
      if (next === 'running') event = EVENTS.CAMPAIGN_RUN;
      else if (next === 'paused') event = EVENTS.CAMPAIGN_PAUSE;
      else if (next === 'ended') event = EVENTS.CAMPAIGN_END;

      if (event) {
        await RabbitMQPublisher.publish(event, {
          campaign_id: campaignId,
          options,
          triggered_by: 'status_update',
        });
      }

      const after = await CampaignRepository.findById(campaignId);

      return ok({
        message: `Cập nhật trạng thái thành công: ${next}`,
        campaign: after,
        published_event: event,
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_STATUS_FAILED' }));
    }
  }

  static async submitCampaign(id) {
    try {
      const campaign = await CampaignRepository.findById(id);
      if (!campaign) return fail(new AppError('Chiến dịch không tồn tại', { status: 404 }));

      if (!['draft', 'rejected'].includes(campaign.status)) {
        return fail(new AppError('Chỉ chiến dịch Draft hoặc Rejected mới được gửi duyệt', { status: 400 }));
      }

      await CampaignRepository.updateStatus(id, 'submitted');
      // Update metadata & History
      const settings = campaign.settings || {};
      settings.submitted_at = new Date();
      settings.history = settings.history || [];
      settings.history.push({
        action: 'submit',
        status: 'submitted',
        at: new Date(),
        by: 'user' // Placeholder, ideally owner_id
      });
      await CampaignRepository.update(id, { settings });

      return ok({ message: 'Đã gửi duyệt chiến dịch', status: 'submitted' });
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  static async rejectCampaign(id, reason) {
    try {
      if (!reason) return fail(new AppError('Cần nhập lý do từ chối', { status: 400 }));
      const campaign = await CampaignRepository.findById(id);
      if (!campaign) return fail(new AppError('Chiến dịch không tồn tại', { status: 404 }));

      if (campaign.status !== 'submitted') {
        return fail(new AppError('Chỉ chiến dịch đang chờ duyệt mới được từ chối', { status: 400 }));
      }

      await CampaignRepository.updateStatus(id, 'rejected');

      const settings = campaign.settings || {};
      settings.rejected_at = new Date();
      settings.reject_reason = reason;
      settings.history = settings.history || [];
      settings.history.push({
        action: 'reject',
        status: 'rejected',
        reason: reason,
        at: new Date(),
        by: 'owner'
      });
      await CampaignRepository.update(id, { settings });

      return ok({ message: 'Đã từ chối chiến dịch', status: 'rejected' });
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  static async approveCampaignFull(id, ownerId) {
    try {
      const campaign = await CampaignRepository.findById(id);
      if (!campaign) return fail(new AppError('Chiến dịch không tồn tại', { status: 404 }));

      if (campaign.status !== 'submitted') {
        return fail(new AppError('Chỉ chiến dịch đang chờ duyệt mới được duyệt', { status: 400 }));
      }

      await CampaignRepository.updateStatus(id, 'approved');

      const settings = campaign.settings || {};
      settings.approved_at = new Date();
      settings.approved_by = ownerId || null;
      settings.history = settings.history || [];
      settings.history.push({
        action: 'approve',
        status: 'approved',
        at: new Date(),
        by: ownerId || 'owner'
      });
      await CampaignRepository.update(id, { settings });

      return ok({ message: 'Đã duyệt chiến dịch', status: 'approved' });
    } catch (err) {
      return fail(asAppError(err));
    }
  }
  static async getCampaign(id) {
    try {
      const campaign = await CampaignRepository.findById(id);
      if (!campaign) {
        return fail(new AppError('Chiến dịch không tồn tại', { status: 404, code: 'NOT_FOUND' }));
      }

      const campaignData = campaign.toJSON?.() || campaign;

      // Enrich products if they exist
      if (Array.isArray(campaignData.products) && campaignData.products.length > 0) {
        const productIds = campaignData.products.map(p => p.product_id).filter(Boolean);
        if (productIds.length > 0) {
          const products = await ProductRepository.findByIds(productIds);
          const productMap = new Map(products.map(p => [p.product_id || p.id, p]));

          campaignData.products = campaignData.products.map(p => {
            const detail = productMap.get(p.product_id) || {};
            return { ...p, ...detail };
          });
        }
      }

      return ok(campaignData);
    } catch (err) {
      return fail(asAppError(err));
    }
  }
  static async updateCampaign(id, updates) {
    try {
      const campaign = await CampaignRepository.findById(id);
      if (!campaign) {
        return fail(new AppError('Chiến dịch không tồn tại', { status: 404, code: 'NOT_FOUND' }));
      }

      // Logic update products?
      // Simplified: Update persistence fields
      const Allowed = ['name', 'budget', 'start_date', 'end_date', 'target_filter', 'status', 'channel', 'data_source', 'image', 'image_id', 'note', 'summary_report', 'expected_kpi', 'settings', 'products'];
      const data = {};
      let hasChange = false;

      Allowed.forEach(k => {
        if (updates[k] !== undefined) {
          const oldVal = campaign[k];
          const newVal = updates[k];

          if (newVal && typeof newVal === 'object') {
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              data[k] = newVal;
              hasChange = true;
            }
          } else {
            // eslint-disable-next-line eqeqeq
            if (oldVal != newVal) {
              data[k] = newVal;
              hasChange = true;
            }
          }
        }
      });

      if (!hasChange) {
        return ok(campaign);
      }

      data.updated_at = new Date();
      await CampaignRepository.update(id, data);
      // Note: Product update logic might need complexity, for now we skip or add if needed.
      // If products passed?
      if (Array.isArray(updates.products)) {
        // This requires clearing old product links and adding new ones.
        // Assuming simple update for now, implementation of product update requires repository support
      }

      return ok(await CampaignRepository.findById(id));
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_FAILED' }));
    }
  }
  // {
  //   "name": "January VIP Blast",
  //   "budget": 5000000,
  //   "start_date": "2026-01-02T00:00:00.000Z",
  //   "end_date": "2026-01-10T00:00:00.000Z",
  //   "status": "draft",
  //   "target_filter": { "tags_in": ["VIP"] },

  //   "product_ids": ["<uuid1>", "<uuid2>"],

  //   "settings": {
  //     "from_name": "MyShop",
  //     "from_email": "no-reply@myshop.vn",
  //     "reply_to": "support@myshop.vn",
  //     "template_key": "campaign_email_blast",
  //     "subject": "Ưu đãi tháng 1 - {{campaign.name}}",
  //     "utm": {
  //       "source": "campaign",
  //       "medium": "email",
  //       "campaign": "{{campaign.campaign_id}}",
  //       "content": "blast"
  //     }
  //   }
  // }
  static async createCampaign(campaignData) {
    try {
      if (!campaignData?.name) {
        throw new AppError('Campaign name is required', {
          status: 400,
          code: 'VALIDATION_ERROR',
        });
      }
      const normalizeProducts = (data) => {
        // Nếu đã là mảng các object có meta, giữ nguyên (ưu tiên từ UI)
        if (Array.isArray(data?.products) && data.products.length > 0) {
          if (typeof data.products[0] === 'object') {
            return data.products.map(p => ({
              product_id: p.product_id || p.id,
              name: p.name || null,
              category: p.category || null,
              price_current: p.price_current || p.price || null,
              image: p.image || null,
              reason: p.reason || null,
              quantity: p.quantity || null,
              discount: p.discount || null,
              variant_id: p.variant_id || null
            }));
          }
        }

        const ids = [];

        // preferred: product_ids
        if (Array.isArray(data?.product_ids)) {
          ids.push(...data.product_ids.filter(Boolean));
        }

        // single: product_id
        if (data?.product_id) {
          ids.push(data.product_id);
        }

        // legacy fallback: products can be array of uuid
        if (Array.isArray(data?.products) && data.products.length) {
          for (const p of data.products) {
            if (!p) continue;
            if (typeof p === 'string') ids.push(p);
            else if (typeof p === 'object') ids.push(p.product_id || p.id);
          }
        }

        // legacy fallback: product object
        if (data?.product && typeof data.product === 'object') {
          ids.push(data.product.product_id || data.product.id);
        } else if (data?.product && typeof data.product === 'string') {
          ids.push(data.product);
        }

        // unique + remove falsy
        const uniq = [...new Set(ids.filter(Boolean))];

        // store as objects
        return uniq.map((id) => ({ product_id: id }));
      };

      const normalizedProducts = normalizeProducts(campaignData);

      // =========================
      // A2) Persist settings
      // =========================
      const campaignPayload = {
        name: campaignData.name,
        channel: campaignData.channel || 'unknown',
        budget: campaignData.budget || 0,
        start_date: campaignData.start_date || new Date(),
        end_date: campaignData.end_date || null,
        target_filter: campaignData.target_filter || {},
        data_source: campaignData.data_source || 'AI',

        image: campaignData.image || null,
        image_id: campaignData.image_id || null,
        note: campaignData.note || null,
        summary_report: campaignData.summary_report || null,

        // A1: normalized products
        products: normalizedProducts,

        status: campaignData.status || 'draft',
        owner_employee_id: campaignData.owner_employee_id || null,
        expected_kpi: campaignData.expected_kpi || {},

        // A2: save settings
        settings: campaignData.settings || {},

        created_at: new Date(),
        updated_at: new Date(),
      };

      const channel_configs = Array.isArray(campaignData.channel_configs)
        ? campaignData.channel_configs
        : [];

      const created = await sequelize.transaction(async (t) => {
        const campaign = await CampaignRepository.create(campaignPayload, { transaction: t });
        const campaign_id = campaign?.campaign_id ?? campaign?.id;

        if (!channel_configs.length) return campaign;

        for (const cfg of channel_configs) {
          const channel = String(cfg.channel || 'unknown').toLowerCase();

          const ch = await CampaignChannelRepository.create(
            {
              campaign_id,
              channel,
              account_name: cfg.account_name || null,
              budget: cfg.budget ?? null,
              start_date: cfg.start_date || null,
              end_date: cfg.end_date || null,
              target_filter: cfg.target_filter || {},
              data_source: cfg.data_source || null,
              status: cfg.status || 'draft',
              impressions: 0,
              clicks: 0,
              conversions: 0,
              cost: 0,
              revenue: 0,
              metrics_extra: cfg.metrics_extra || {},
              created_at: new Date(),
              updated_at: new Date(),
            },
            { transaction: t }
          );
          const channel_id = ch?.channel_id ?? ch?.id;
          const flow_ids = Array.isArray(cfg.flow_ids)
            ? cfg.flow_ids.filter(Boolean)
            : (cfg.flow_id ? [cfg.flow_id].filter(Boolean) : []);

          if (flow_ids.length) {
            const rows = flow_ids.map((fid, idx) => ({
              campaign_id,
              channel_id,
              flow_id: fid,
              order_index: idx,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            }));

            await CampaignChannelFlowRepository.bulkCreate(rows, { transaction: t });
          }
        }

        return campaign;
      });

      return ok(created);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CREATE_CAMPAIGN_FAILED' }));
    }
  }
  static async runCampaign(campaignId, options = {}) {
    try {
      const campaign = await CampaignRepository.findById(campaignId);
      if (!campaign) {
        return fail(
          new AppError('Không tìm thấy chiến dịch.', {
            code: 'CAMPAIGN_NOT_FOUND',
            status: 404,
          })
        );
      }

      const channels = await CampaignChannelRepository.findByCampaignId(campaignId);
      if (!channels?.length) {
        return fail(
          new AppError('Chiến dịch chưa có kênh để chạy.', {
            code: 'NO_CHANNELS',
            status: 400,
          })
        );
      }
      let mappedCount = 0;
      for (const ch of channels) {
        const channel_id = ch?.channel_id ?? ch?.id;
        const maps = await CampaignChannelFlowRepository.findByChannelId(channel_id);
        if (maps?.length) mappedCount++;
      }

      if (mappedCount === 0) {
        return fail(
          new AppError('Tất cả kênh đều chưa map flow.', {
            code: 'NO_MAPPED_FLOWS',
            status: 400,
          })
        );
      }

      // update status -> running
      await CampaignRepository.updateStatus(campaignId, 'running');
      // publish campaign.run (campaign-level)
      await RabbitMQPublisher.publish(EVENTS.CAMPAIGN_RUN, {
        campaign_id: campaignId,
        options,
        triggered_by: 'runCampaign',

      });
      return ok({
        message: 'Campaign dispatched (campaign.run) - automation will fan-out to channels',
        campaign_id: campaignId,
        published_event: EVENTS.CAMPAIGN_RUN,
        channel_count: channels.length,
        mapped_channel_count: mappedCount,
      });
    } catch (err) {
      console.error('runCampaign error:', err);
      return fail(asAppError(err, { status: 500, code: 'RUN_CAMPAIGN_FAILED' }));
    }
  }
  static async listByChannel(params = {}) {
    try {
      const {
        channel,
        status,
        page = 1,
        limit = 20,
        search = '',
        from,
        to,
        order = 'desc',
        sort = 'created_at',
      } = params;

      const ch = String(channel || '').trim().toLowerCase();
      if (!ch) throw new AppError('channel is required', { status: 400, code: 'MISSING_CHANNEL' });

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const perPage = Math.max(1, parseInt(limit, 10) || 20);
      const offset = (pageNum - 1) * perPage;

      // 1) Lấy campaign_ids có channel = ch (có thể filter status/ date ở campaign_channels nếu bạn muốn)
      const campaignIds = await CampaignChannelRepository.findCampaignIdsByChannel(ch);
      if (!campaignIds.length) {
        return ok({ items: [], page: pageNum, limit: perPage, total: 0, totalPages: 0 });
      }

      // 2) Lọc campaigns theo các filter UI
      const whereCampaign = { campaign_id: { [Op.in]: campaignIds } };

      if (status) whereCampaign.status = String(status).toLowerCase();
      if (search) whereCampaign.name = { [Op.iLike]: `%${String(search).trim()}%` };

      if (from || to) {
        whereCampaign.created_at = {};
        if (from) whereCampaign.created_at[Op.gte] = new Date(from);
        if (to) whereCampaign.created_at[Op.lte] = new Date(to);
      }

      // 3) Page campaigns
      const { items: campaigns, total } = await CampaignRepository.findAllWithCount({
        offset,
        limit: perPage,
        filters: { where: whereCampaign }, // nếu repo bạn đang nhận filters khác, xem note dưới
        sort,
        order,
      });

      const campaignList = (campaigns || []).map((c) => c?.toJSON?.() ?? c);
      const idsPage = campaignList.map((c) => c.campaign_id || c.id).filter(Boolean);

      // 4) Lấy đúng channel row cho mỗi campaign trong page
      const channelRows = await CampaignChannelRepository.findByCampaignIdsAndChannel(idsPage, ch);
      const channelMap = new Map(
        (channelRows || []).map((r) => {
          const x = r?.toJSON?.() ?? r;
          return [x.campaign_id, x];
        })
      );

      // 5) Build response: campaign + channel metrics + rates
      const out = campaignList.map((c) => {
        const channelRow = channelMap.get(c.campaign_id) || null;
        const delivered = Number(channelRow?.delivered || 0);
        const opensU = Number(channelRow?.opens_unique || 0);
        const clicksU = Number(channelRow?.clicks_unique || 0);

        return {
          campaign: c,
          channel: channelRow,
          rates: {
            open_rate: delivered > 0 ? opensU / delivered : 0,
            click_rate: delivered > 0 ? clicksU / delivered : 0,
          },
        };
      });

      return ok({
        items: out,
        page: pageNum,
        limit: perPage,
        total,
        totalPages: Math.ceil((total || 0) / perPage),
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_BY_CHANNEL_FAILED' }));
    }
  }
  static async getMetrics(campaignId) {
    try {
      const rows = await CampaignChannelRepository.findByCampaignId(campaignId);

      const sum = {
        campaign_id: campaignId,
        sent: 0,
        delivered: 0,
        opens_unique: 0,
        clicks_unique: 0,
        opens_total: 0,
        clicks_total: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        revenue: 0,
      };

      for (const r of (rows || [])) {
        const x = r?.toJSON?.() ?? r;
        sum.sent += Number(x.sent || 0);
        sum.delivered += Number(x.delivered || 0);
        sum.opens_unique += Number(x.opens_unique || 0);
        sum.clicks_unique += Number(x.clicks_unique || 0);
        sum.opens_total += Number(x.opens_total || 0);
        sum.clicks_total += Number(x.clicks_total || 0);

        sum.impressions += Number(x.impressions || 0);
        sum.clicks += Number(x.clicks || 0);
        sum.conversions += Number(x.conversions || 0);
        sum.cost += Number(x.cost || 0);
        sum.revenue += Number(x.revenue || 0);
      }

      sum.open_rate = sum.delivered > 0 ? sum.opens_unique / sum.delivered : 0;
      sum.click_rate = sum.delivered > 0 ? sum.clicks_unique / sum.delivered : 0;

      return ok(sum);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_CAMPAIGN_METRICS_FAILED' }));
    }
  }
  // ------------------------
  // List campaigns (pagination/filter/sort) - giữ nguyên như bạn
  // ------------------------
  static async getAll(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        status,
        channel,
        owner_employee_id,
        from,
        to,
        sort = 'created_at',
        order = 'desc',
      } = params;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const perPage = Math.max(1, parseInt(limit, 10) || 20);
      const offset = (pageNum - 1) * perPage;

      const filters = {};
      if (search) filters.search = String(search).trim();
      if (status) filters.status = String(status).toLowerCase();
      if (channel) filters.channel = String(channel);
      if (owner_employee_id) filters.owner_employee_id = owner_employee_id;
      if (from) filters.from = new Date(from);
      if (to) filters.to = new Date(to);

      const { items, total } = await CampaignRepository.findAllWithCount({
        offset,
        limit: perPage,
        filters,
        sort,
        order,
      });

      return ok({
        items,
        page: pageNum,
        limit: perPage,
        total,
        totalPages: Math.ceil((total || 0) / perPage),
      });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_CAMPAIGNS_FAILED' }));
    }
  }

  // ------------------------
  // Running campaigns with products - giữ nguyên như bạn
  // ------------------------
  static async getRunningWithProducts(params = {}) {
    try {
      const { from, to } = params;

      const campaigns = await CampaignRepository.findAllRunning({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sort: 'start_date',
        order: 'ASC',
      });

      const productIds = [
        ...new Set(
          campaigns.flatMap((c) =>
            Array.isArray(c.products)
              ? c.products.map((p) => p.product_id).filter(Boolean)
              : []
          )
        ),
      ];

      const products = productIds.length
        ? await ProductRepository.findByIds(productIds)
        : [];

      const productMap = new Map(products.map((p) => [p.product_id || p.id, p]));

      const items = campaigns.map((c) => ({
        ...(c.toJSON?.() || c),
        products: (Array.isArray(c.products) ? c.products : []).map((p) => ({
          ...(p.toJSON?.() || p),
          ...(productMap.get(p.product_id) || {}),
        })),
      }));

      return ok({
        items,
        total: items.length,
      });
    } catch (err) {
      console.error('getRunningWithProducts error:', err);
      return fail(asAppError(err, { status: 500, code: 'GET_RUNNING_CAMPAIGNS_FAILED' }));
    }
  }

  static async getChannelStats() {
    try {
      const stats = await CampaignChannelRepository.getChannelStats();
      return ok(stats);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_CHANNEL_STATS_FAILED' }));
    }
  }
}

module.exports = CampaignService;
