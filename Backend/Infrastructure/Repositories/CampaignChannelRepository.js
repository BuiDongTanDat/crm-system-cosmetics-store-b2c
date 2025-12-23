// Infrastructure/Repositories/CampaignChannelRepository.js
const CampaignChannel = require('../../Domain/Entities/CampaignChannel');

class CampaignChannelRepository {
  static async findByCampaignId(campaign_id) {
    return CampaignChannel.findAll({ where: { campaign_id } });
  }

  static async updateById(channel_id, patch) {
    return CampaignChannel.update(
      { ...patch, updated_at: new Date() },
      { where: { channel_id } }
    );
  }

  static async bulkUpdateByCampaign(campaign_id, patch) {
    return CampaignChannel.update(
      { ...patch, updated_at: new Date() },
      { where: { campaign_id } }
    );
  }
}

module.exports = CampaignChannelRepository;
