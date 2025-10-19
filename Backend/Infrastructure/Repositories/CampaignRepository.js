const Campaign = require('../../Domain/Entities/Campaign');
class CampaignRepository {
    // ---------------- CRUD ----------------
    async create(campaign) {
        return await Campaign.create(campaign);
    }
    async findById(campaignId) {
        return Campaign.findByPk(campaignId);
    }
}
module.exports = new CampaignRepository();