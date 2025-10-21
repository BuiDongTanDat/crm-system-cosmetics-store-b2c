const Campaign = require('../../Domain/Entities/Campaign');
class CampaignRepository {
    // ---------------- CRUD ----------------
    async create(campaign) {
        return await Campaign.create(campaign);
    }
    async findById(campaignId) {
        return Campaign.findByPk(campaignId);
    }
    async findAll() {
        return Campaign.findAll();
    }
    async update(campaignId, updateData) {
        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) return null;
        await campaign.update(updateData);
        return campaign;
    }
    async delete(campaignId) {
        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) return null;
        await campaign.destroy();
        return true;
    }
    async findByName(name) {
        return await Campaign.findAll({
            where: { name }
        });
    }
}
module.exports = new CampaignRepository();