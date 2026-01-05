/* eslint-disable camelcase */
const CampaignChannelFlow = require('../../Domain/Entities/CampaignChannelFlow');

class CampaignChannelFlowRepository {
  async create(payload, opts = {}) {
    return CampaignChannelFlow.create(payload, opts);
  }
  async bulkCreate(rows = [], opts = {}) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return CampaignChannelFlow.bulkCreate(rows, opts);
  }
  async findAllByChannelId(channel_id, opts = {}) {
    return CampaignChannelFlow.findAll({
      where: { channel_id },
      order: [['order_index', 'ASC']],
      ...opts,
    });
  }
  async findByChannelIds(channel_ids, opts = {}) {
    if (!Array.isArray(channel_ids) || channel_ids.length === 0) return [];
    return CampaignChannelFlow.findAll({
      where: { channel_id: channel_ids, is_active: true },
      ...opts,
    });
  }
  async findByChannelId(channel_id, opts = {}) {
    return CampaignChannelFlow.findAll({
      where: { channel_id, is_active: true },
      order: [['order_index', 'ASC']],
      ...opts,
    });
  }

  async findByCampaignId(campaign_id, opts = {}) {
    return CampaignChannelFlow.findAll({
      where: { campaign_id, is_active: true },
      order: [['order_index', 'ASC']],
      ...opts,
    });
  }

  async findById(id, opts = {}) {
    return CampaignChannelFlow.findByPk(id, opts);
  }

  async updateById(id, patch = {}, opts = {}) {
    return CampaignChannelFlow.update(
      { ...patch },
      { where: { id }, ...opts }
    );
  }

  async deleteById(id, opts = {}) {
    return CampaignChannelFlow.destroy({ where: { id }, ...opts });
  }

  async deleteByChannelId(channel_id, opts = {}) {
    return CampaignChannelFlow.destroy({ where: { channel_id }, ...opts });
  }

  async deleteByCampaignId(campaign_id, opts = {}) {
    return CampaignChannelFlow.destroy({ where: { campaign_id }, ...opts });
  }

  async toggleActive(id, is_active, opts = {}) {
    return CampaignChannelFlow.update(
      { is_active: !!is_active },
      { where: { id }, ...opts }
    );
  }

  async reorder(channel_id, items = [], opts = {}) {
    if (!Array.isArray(items) || items.length === 0) return { updated: 0 };

    const tx = opts.transaction;
    let updated = 0;

    for (const it of items) {
      if (!it?.id) continue;
      await CampaignChannelFlow.update(
        { order_index: Number(it.order_index ?? 0) },
        { where: { id: it.id, channel_id }, transaction: tx }
      );
      updated++;
    }
    return { updated };
  }
}

module.exports = new CampaignChannelFlowRepository();
