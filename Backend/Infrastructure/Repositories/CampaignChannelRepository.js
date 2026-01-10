// Infrastructure/Repositories/CampaignChannelRepository.js
const CampaignChannel = require('../../Domain/Entities/CampaignChannel');
const { Op, Sequelize } = require('sequelize');

class CampaignChannelRepository {
  async findByCampaignId(campaign_id, options = {}) {
    return CampaignChannel.findAll({ where: { campaign_id }, ...options });
  }

  async create(payload, options = {}) {
    return CampaignChannel.create(payload, options);
  }

  async bulkCreate(rows, options = {}) {
    return CampaignChannel.bulkCreate(rows, options);
  }

  async deleteByCampaignId(campaign_id, options = {}) {
    return CampaignChannel.destroy({ where: { campaign_id }, ...options });
  }

  async findById(channel_id, options = {}) {
    return CampaignChannel.findOne({ where: { channel_id }, ...options });
  }

  async updateById(channel_id, patch, options = {}) {
    return CampaignChannel.update(
      { ...patch, updated_at: new Date() },
      { where: { channel_id }, ...options }
    );
  }

  async findOneByCampaignAndChannel(campaign_id, channel, options = {}) {
    return CampaignChannel.findOne({
      where: {
        campaign_id,
        channel: String(channel || '').toLowerCase(),
      },
      ...options,
    });
  }

  async bulkUpdateByCampaign(campaign_id, patch, options = {}) {
    return CampaignChannel.update(
      { ...patch, updated_at: new Date() },
      { where: { campaign_id }, ...options }
    );
  }

  /**
   * Increment numeric counters by channel_id.
   * Example: incById(id, { sent: 1, delivered: 1, clicks_total: 2 })
   */
  async incById(channel_id, fields = {}, options = {}) {
    if (!channel_id) return;

    const updates = {};

    for (const [key, val] of Object.entries(fields || {})) {
      const n = Number(val || 0);
      if (!Number.isFinite(n) || n === 0) continue;

      // "field" = "field" + n
      updates[key] = Sequelize.literal(`"${key}" + ${n}`);
    }

    if (!Object.keys(updates).length) return;

    updates.updated_at = new Date();

    return CampaignChannel.update(updates, { where: { channel_id }, ...options });
  }

  async findCampaignIdsByChannel(channel, options = {}) {
    const rows = await CampaignChannel.findAll({
      attributes: ['campaign_id'],
      where: { channel: String(channel || '').toLowerCase() },
      group: ['campaign_id'],
      ...options,
    });
    return (rows || []).map((r) => r.campaign_id);
  }

  async findByCampaignIdsAndChannel(campaignIds = [], channel, options = {}) {
    if (!Array.isArray(campaignIds) || !campaignIds.length) return [];
    return CampaignChannel.findAll({
      where: {
        campaign_id: { [Op.in]: campaignIds },
        channel: String(channel || '').toLowerCase(),
      },
      ...options,
    });
  }

  async getChannelStats(options = {}) {
    return CampaignChannel.findAll({
      attributes: [
        'channel',
        [Sequelize.fn('COUNT', Sequelize.col('campaign_id')), 'campaign_count'],
        [Sequelize.fn('SUM', Sequelize.col('cost')), 'total_cost'],
        [Sequelize.fn('SUM', Sequelize.col('revenue')), 'total_revenue'],
        [Sequelize.fn('SUM', Sequelize.col('sent')), 'total_sent'],
        [Sequelize.fn('SUM', Sequelize.col('conversions')), 'total_conversions'],
        [Sequelize.fn('SUM', Sequelize.col('clicks')), 'total_clicks'],
        [Sequelize.fn('SUM', Sequelize.col('impressions')), 'total_impressions'],
      ],
      group: ['channel'],
      raw: true,
      ...options,
    });
  }
}

module.exports = new CampaignChannelRepository();
