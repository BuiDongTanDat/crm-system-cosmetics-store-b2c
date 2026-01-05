/* eslint-disable camelcase */
const CampaignChannelRepo = require('../../Infrastructure/Repositories/CampaignChannelRepository');
const ChannelFlowRepo = require('../../Infrastructure/Repositories/CampaignChannelFlowRepository');
const { ok, fail, asAppError, AppError } = require('../helpers/errors');

class CampaignChannelFlowService {
  async addFlowToChannel(channel_id, payload) {
    try {
      if (!channel_id) throw new AppError('channel_id is required', { status: 400 });
      if (!payload?.flow_id) throw new AppError('flow_id is required', { status: 400 });

      const ch = await CampaignChannelRepo.findById(channel_id);
      if (!ch) throw new AppError('Channel not found', { status: 404 });

      const row = await ChannelFlowRepo.create({
        campaign_id: ch.campaign_id,
        channel_id,
        flow_id: payload.flow_id,
        order_index: Number(payload.order_index ?? 0),
        is_active: payload.is_active !== undefined ? !!payload.is_active : true,
      });

      return ok(row);
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async listFlowsByChannel(channel_id, { include_inactive = false } = {}) {
    try {
      if (!channel_id) throw new AppError('channel_id is required', { status: 400 });

      const rows = include_inactive
        ? await ChannelFlowRepo.findAllByChannelId(channel_id)
        : await ChannelFlowRepo.findByChannelId(channel_id);

      return ok(rows);
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async updateMapping(mapping_id, patch) {
    try {
      if (!mapping_id) throw new AppError('mapping_id is required', { status: 400 });
      const existed = await ChannelFlowRepo.findById(mapping_id);
      if (!existed) throw new AppError('Mapping not found', { status: 404 });

      await ChannelFlowRepo.updateById(mapping_id, patch || {});
      const after = await ChannelFlowRepo.findById(mapping_id);
      return ok(after);
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async enableMapping(mapping_id) {
    return this.updateMapping(mapping_id, { is_active: true });
  }

  async disableMapping(mapping_id) {
    return this.updateMapping(mapping_id, { is_active: false });
  }

  async reorder(channel_id, items) {
    try {
      if (!channel_id) throw new AppError('channel_id is required', { status: 400 });
      if (!Array.isArray(items)) throw new AppError('items must be an array [{id, order_index}]', { status: 400 });

      const meta = await ChannelFlowRepo.reorder(channel_id, items);
      const rows = await ChannelFlowRepo.findAllByChannelId(channel_id);
      return ok({ rows, meta });
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async removeMapping(mapping_id) {
    try {
      if (!mapping_id) throw new AppError('mapping_id is required', { status: 400 });
      const existed = await ChannelFlowRepo.findById(mapping_id);
      if (!existed) throw new AppError('Mapping not found', { status: 404 });

      await ChannelFlowRepo.deleteById(mapping_id);
      return ok(true);
    } catch (err) {
      return fail(asAppError(err));
    }
  }
}

module.exports = new CampaignChannelFlowService();
