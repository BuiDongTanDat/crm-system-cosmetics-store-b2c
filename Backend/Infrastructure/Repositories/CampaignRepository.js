const Campaign = require('../../Domain/Entities/Campaign');
const { Op } = require('sequelize');
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
    async updateStatus(campaignId, status) {
        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) return null;
        await campaign.update({ status });
        return campaign;
    }
    async findByName(name) {
        return await Campaign.findAll({
            where: { name }
        });
    }
    async findAllRunning({ from, to, sort = 'start_date', order = 'ASC' } = {}) {
        const where = { status: 'running' };

        const hasFrom = from && !isNaN(new Date(from).getTime());
        const hasTo = to && !isNaN(new Date(to).getTime());
        if (hasFrom || hasTo) {
            where.start_date = {};
            if (hasFrom) where.start_date[Op.gte] = new Date(from);
            if (hasTo) where.start_date[Op.lte] = new Date(to);
        }

        const items = await Campaign.findAll({
            where,
            order: [[sort, String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC']],
        });

        return items;
    }
    async findAllWithCount({ offset, limit, filters = {}, sort, order }) {
        const where = {};

        if (filters.status)
            where.status = { [Op.iLike]: filters.status }; // chạy cho cả RUNNING, Running, running

        if (filters.channel) where.channel = filters.channel;
        if (filters.owner_employee_id) where.owner_employee_id = filters.owner_employee_id;

        if (filters.search)
            where.name = { [Op.iLike]: `%${filters.search}%` };

        if (filters.from || filters.to) {
            where.start_date = {};
            if (filters.from) where.start_date[Op.gte] = new Date(filters.from);
            if (filters.to) where.start_date[Op.lte] = new Date(filters.to);
        }
        const andConditions = [];
        if (filters.start_lte) {
            andConditions.push({ start_date: { [Op.lte]: new Date(filters.start_lte) } });
        }
        if (filters.end_gte_or_null) {
            const date = new Date(filters.end_gte_or_null);
            andConditions.push({
                [Op.or]: [
                    { end_date: { [Op.gte]: date } },
                    { end_date: null },
                ],
            });
        }

        if (andConditions.length > 0) {
            where[Op.and] = andConditions;
        }

        const { rows, count } = await Campaign.findAndCountAll({
            where,
            offset,
            limit,
            order: [[sort || "created_at", String(order).toUpperCase() === "ASC" ? "ASC" : "DESC"]],
        });

        return { items: rows, total: count };
    }
}
module.exports = new CampaignRepository();