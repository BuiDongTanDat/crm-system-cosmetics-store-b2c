const CampaignChannelService = require('../../Application/Services/CampaignChannelService');
const ChannelSyncService = require('../../Application/Services/ChannelSyncService');

class CampaignChannelController {
  static async create(req, res) {
    const campaign_id = req.params.id;
    const result = await CampaignChannelService.createChannel(campaign_id, req.body || {});
    return res.status(result.ok ? 201 : (result.error?.status || 400)).json(result);
  }

  static async list(req, res) {
    const campaign_id = req.params.id;
    const result = await CampaignChannelService.listChannelsByCampaign(campaign_id);
    return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
  }

  static async update(req, res) {
    const channel_id = req.params.channel_id;
    const result = await CampaignChannelService.updateChannel(channel_id, req.body || {});
    return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
  }

  static async remove(req, res) {
    const channel_id = req.params.channel_id;
    const result = await CampaignChannelService.removeChannel(channel_id);
    return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
  }

  static async sync(req, res) {
    const channel_id = req.params.channel_id;
    try {
      const result = await ChannelSyncService.syncChannel(channel_id);
      return res.status(result.ok ? 200 : 400).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = CampaignChannelController;
