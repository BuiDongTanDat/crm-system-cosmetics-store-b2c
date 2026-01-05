const CampaignChannelFlowService = require('../../Application/Services/CampaignChannelFlowService');

class CampaignChannelFlowController {
    static async add(req, res) {
        const channel_id = req.params.channel_id;
        const result = await CampaignChannelFlowService.addFlowToChannel(channel_id, req.body || {});
        return res.status(result.ok ? 201 : (result.error?.status || 400)).json(result);
    }

    static async list(req, res) {
        const channel_id = req.params.channel_id;
        const include_inactive = String(req.query.all || '') === '1';
        const result = await CampaignChannelFlowService.listFlowsByChannel(channel_id, { include_inactive });
        return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
    }

    static async update(req, res) {
        const id = req.params.id;
        const result = await CampaignChannelFlowService.updateMapping(id, req.body || {});
        return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
    }

    static async enable(req, res) {
        const id = req.params.id;
        const result = await CampaignChannelFlowService.enableMapping(id);
        return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
    }

    static async disable(req, res) {
        const id = req.params.id;
        const result = await CampaignChannelFlowService.disableMapping(id);
        return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
    }

    static async reorder(req, res) {
        const channel_id = req.params.channel_id;
        const result = await CampaignChannelFlowService.reorder(channel_id, req.body?.items);
        return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
    }

    static async remove(req, res) {
        const id = req.params.id;
        const result = await CampaignChannelFlowService.removeMapping(id);
        return res.status(result.ok ? 200 : (result.error?.status || 400)).json(result);
    }
}

module.exports = CampaignChannelFlowController;
