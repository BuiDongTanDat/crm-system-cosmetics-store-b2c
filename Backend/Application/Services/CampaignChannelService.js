
const CampaignChannelRepo = require('../../Infrastructure/Repositories/CampaignChannelRepository');
const CampaignRepo = require('../../Infrastructure/Repositories/CampaignRepository');
const { ok, fail, asAppError, AppError } = require('../helpers/errors');
class CampaignChannelService {
  async createChannel(campaign_id, payload) {
    try {
      if (!campaign_id) throw new AppError('campaign_id is required', { status: 400 });
      if (!payload?.channel) throw new AppError('channel is required', { status: 400 });

      // Secure: Check campaign status
      const campaign = await CampaignRepo.findById(campaign_id);
      if (!campaign) throw new AppError('Campaign not found', { status: 404 });
      if (!['approved', 'configuring', 'running'].includes(campaign.status)) {
        throw new AppError('Chiến dịch phải được DUYỆT (Approved) mới được thêm kênh', { status: 403 });
      }

      const existed = await CampaignChannelRepo.findOneByCampaignAndChannel(campaign_id, payload.channel);
      if (existed) throw new AppError('Channel already exists in this campaign', { status: 409 });

      const row = await CampaignChannelRepo.create({
        campaign_id,
        channel: payload.channel,
        account_name: payload.account_name ?? null,
        budget: payload.budget ?? null,
        start_date: payload.start_date ?? null,
        end_date: payload.end_date ?? null,
        target_filter: payload.target_filter ?? {},
        data_source: payload.data_source ?? null,
        status: payload.status ?? 'draft',
        metrics_extra: payload.metrics_extra ?? {},
      });

      // Auto-transition: approved -> configuring
      if (campaign.status === 'approved') {
        try { await CampaignRepo.updateStatus(campaign_id, 'configuring'); } catch (e) { console.error('Auto-configuring update failed', e); }
      }

      return ok(row);
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async listChannelsByCampaign(campaign_id) {
    try {
      if (!campaign_id) throw new AppError('campaign_id is required', { status: 400 });
      const rows = await CampaignChannelRepo.findByCampaignId(campaign_id, { order: [['created_at', 'ASC']] });

      // Fetch flows for these channels manually since associations might not be set
      const channelIds = rows.map(r => r.channel_id);
      const flows = await require('../../Infrastructure/Repositories/CampaignChannelFlowRepository').findByChannelIds(channelIds);

      const enriched = rows.map(row => {
        const json = row.toJSON();
        const flow = flows.find(f => f.channel_id === row.channel_id);
        return {
          ...json,
          flow_id: flow ? flow.flow_id : null,
          flows: flow ? [flow] : []
        };
      });

      return ok({
        items: enriched,
        total: enriched.length
      });
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async updateChannel(channel_id, patch) {
    try {
      if (!channel_id) throw new AppError('channel_id is required', { status: 400 });
      const existed = await CampaignChannelRepo.findById(channel_id);
      if (!existed) throw new AppError('Channel not found', { status: 404 });

      await CampaignChannelRepo.updateById(channel_id, patch || {});
      const after = await CampaignChannelRepo.findById(channel_id);
      return ok(after);
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async removeChannel(channel_id) {
    try {
      if (!channel_id) throw new AppError('channel_id is required', { status: 400 });
      const existed = await CampaignChannelRepo.findById(channel_id);
      if (!existed) throw new AppError('Channel not found', { status: 404 });

      await CampaignChannelRepo.deleteById(channel_id);
      return ok(true);
    } catch (err) {
      return fail(asAppError(err));
    }
  }
}

module.exports = new CampaignChannelService();
