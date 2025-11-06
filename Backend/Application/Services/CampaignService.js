const CampaignRepository = require('../../Infrastructure/Repositories/CampaignRepository');
const ProductRepository = require('../../Infrastructure/Repositories/ProductRepository');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');
class CampaignService {
    static async updateStatus(campaignId, newStatus) {
        try {
            const validStatuses = ["draft", "running", "paused", "ended", "archived"];

            if (!validStatuses.includes(newStatus)) {
                return fail(
                    new AppError("Trạng thái không hợp lệ.", {
                        code: "INVALID_STATUS",
                        status: 400,
                    })
                );
            }

            const campaign = await CampaignRepository.findById(campaignId);
            if (!campaign) {
                return fail(
                    new AppError("Không tìm thấy chiến dịch.", {
                        code: "CAMPAIGN_NOT_FOUND",
                        status: 404,
                    })
                );
            }

            await CampaignRepository.updateStatus(campaignId, newStatus);

            return ok({
                message: `Cập nhật trạng thái thành công: ${newStatus}`,
                campaign,
            });
        } catch (err) {
            console.error("❌ updateStatus error:", err);
            return fail(asAppError(err, { status: 500, code: "UPDATE_STATUS_FAILED" }));
        }
    }

    static async createCampaign(campaignData) {
        try {
            if (!campaignData || !campaignData.name) {
                throw new AppError('Campaign name is required', { status: 400, code: 'VALIDATION_ERROR' });
            }

            const campaign = {
                name: campaignData.name,
                description: campaignData.summary_report || null,
                start_date: campaignData.start_date || new Date(),
                end_date: campaignData.end_date || null,
                budget: campaignData.budget || 0,
                owner_employee_id: campaignData.owner_employee_id || null,
                status: campaignData.status || 'draft',
                channel: campaignData.channel || 'unknown',
                target_filter: campaignData.target_filter || {},
                data_source: campaignData.data_source || 'AI',
                expected_kpi: campaignData.expected_kpi || {},
                products: Array.isArray(campaignData.products)
                    ? campaignData.products
                    : campaignData.product
                        ? [campaignData.product]
                        : [],
            };

            const created = await CampaignRepository.create(campaign);
            return ok(created);

        } catch (err) {
            return fail(asAppError(err, { status: 500, code: 'CREATE_CAMPAIGN_FAILED' }));
        }
    }
    // Trong service của bạn
    static async getAll(params = {}) {
        try {
            const {
                // Pagination
                page = 1,
                limit = 20,

                // Search & filters
                search = "",            // tìm theo name
                status,                 // 'draft' | 'active' | ...
                channel,                // 'Email' | 'SMS' | ...
                owner_employee_id,      // lọc theo người phụ trách
                from,                   // ISO date string (start_date >= from)
                to,                     // ISO date string (start_date <= to)

                // Sorting
                sort = "created_at",    // cột sắp xếp
                order = "desc",         // 'asc' | 'desc'
            } = params;

            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const perPage = Math.max(1, parseInt(limit, 10) || 20);
            const offset = (pageNum - 1) * perPage;

            // Xây filters (để Repository chuyển thành where clause)
            const filters = {};
            if (search) filters.search = String(search).trim();
            if (status) filters.status = String(status).toLowerCase();
            if (channel) filters.channel = String(channel);
            if (owner_employee_id) filters.owner_employee_id = owner_employee_id;
            if (from) filters.from = new Date(from);
            if (to) filters.to = new Date(to);

            // Gọi repository: trả items & total
            const { items, total } = await CampaignRepository.findAllWithCount({
                offset,
                limit: perPage,
                filters,
                sort,
                order,
            });

            return ok({
                items,
                page: pageNum,
                limit: perPage,
                total,
                totalPages: Math.ceil((total || 0) / perPage),
            });
        } catch (err) {
            return fail(asAppError(err, { status: 500, code: 'GET_CAMPAIGNS_FAILED' }));
        }
    }
    static async getRunningWithProducts(params = {}) {
        try {
            const { from, to } = params;

            const campaigns = await CampaignRepository.findAllRunning({
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined,
                sort: 'start_date',
                order: 'ASC',
            });

            const productIds = [
                ...new Set(
                    campaigns.flatMap(c =>
                        Array.isArray(c.products)
                            ? c.products.map(p => p.product_id).filter(Boolean)
                            : []
                    )
                ),
            ];

            const products = productIds.length
                ? await ProductRepository.findByIds(productIds) // nếu repo của bạn là findByIds, đổi tên cho đúng
                : [];

            const productMap = new Map(products.map(p => [p.product_id || p.id, p]));

            const items = campaigns.map(c => ({
                ...c.toJSON?.() || c,
                products: (Array.isArray(c.products) ? c.products : []).map(p => ({
                    ...p.toJSON?.() || p,
                    ...(productMap.get(p.product_id) || {}),
                })),
            }));

            return ok({
                items,
                total: items.length,
            });
        } catch (err) {
            console.error('getRunningWithProducts error:', err);
            return fail(asAppError(err, { status: 500, code: 'GET_RUNNING_CAMPAIGNS_FAILED' }));
        }
    }

}
module.exports = CampaignService;