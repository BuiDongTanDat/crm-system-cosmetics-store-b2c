const CampaignRepository = require('../../Infrastructure/Repositories/CampaignRepository');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');
class CampaignService {
    static async createCampaign(campaignData) {
        try {
            if (!campaignData || !campaignData.name) {
                throw new AppError('Campaign name is required', { status: 400, code: 'VALIDATION_ERROR' });
            }

            const campaign = {
                name: campaignData.name,
                description: campaignData.description || null,
                start_date: campaignData.start_date || new Date(),
                end_date: campaignData.end_date || null,
                budget: campaignData.budget || 0,
                owner_employee_id: campaignData.owner_employee_id || null,
                status: campaignData.status || 'draft',
                channel: campaignData.channel || 'unknown',
                target_filter: campaignData.target_filter || {},
                data_source: campaignData.data_source || null,
                expected_kpi: campaignData.expected_kpi || {},
            };

            const created = await CampaignRepository.create(campaign);
            return ok(created);

        } catch (err) {
            return fail(asAppError(err, { status: 500, code: 'CREATE_CAMPAIGN_FAILED' }));
        }
    }
}
module.exports = CampaignService;