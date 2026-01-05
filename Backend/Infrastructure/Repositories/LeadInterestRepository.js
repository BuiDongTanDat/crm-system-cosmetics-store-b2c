const { Op, Transaction } = require('sequelize');
const LeadInterest = require('../../Domain/Entities/LeadInterest');
const Lead = require('../../Domain/Entities/Lead');
const sequelize = LeadInterest.sequelize;
class LeadInterestRepository {
    constructor() {
        this.LeadInterest = LeadInterest;
        this.Lead = Lead;
        this.sequelize = sequelize;
    }
    _normStatus(status) {
        const s = String(status || '').trim().toLowerCase();
        if (!s) return 'liked';
        // you can extend enum later
        if (['liked', 'removed'].includes(s)) return s;
        return 'liked';
    }
    async findOne(where, options = {}) {
        const { transaction, lock } = options;
        return this.LeadInterest.findOne({
            where,
            transaction,
            ...(lock ? { lock } : {}),
        });
    }
    async findById(id, options = {}) {
        const { transaction } = options;
        return this.LeadInterest.findByPk(id, { transaction });
    }

    async listByLeadId(leadId, opts = {}) {
        const {
            status = 'liked',
            limit = 50,
            offset = 0,
            order = [['last_interested_at', 'DESC'], ['created_at', 'DESC']],
            transaction,
        } = opts;

        const where = { lead_id: leadId };
        if (status) where.status = this._normStatus(status);

        return this.LeadInterest.findAll({
            where,
            limit,
            offset,
            order,
            transaction,
        });
    }

    async listByCustomer(customerId, opts = {}) {
        const lead = await this.Lead.findOne({
            where: { customer_id: customerId },
            order: [['created_at', 'DESC']],
        });
        if (!lead) return [];
        return this.listByLead(lead.lead_id, opts);
    }

    // =========================================================
    // Upsert / Toggle
    // =========================================================

    /**
     * Upsert interest: đảm bảo 1 lead-product chỉ có 1 row.
     * - Nếu chưa có: insert liked
     * - Nếu có: update status + bump counters + last_interested_at
     *
     * @param {string} leadId
     * @param {string} productId
     * @param {object} payload { product_name, source, note, created_by, meta }
     */
    async upsertLike(leadId, productId, payload = {}, options = {}) {
        const { transaction } = options;

        const now = new Date();
        const status = 'liked';

        // Để tránh race condition, lock row nếu tồn tại
        const existing = await this.LeadInterest.findOne({
            where: { lead_id: leadId, product_id: productId },
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
        });

        if (!existing) {
            return this.LeadInterest.create(
                {
                    lead_id: leadId,
                    product_id: productId,
                    product_name: payload.product_name || null,

                    status,
                    interest_count: 1,
                    first_interested_at: now,
                    last_interested_at: now,

                    source: payload.source || null,
                    note: payload.note || null,
                    meta: payload.meta || null,

                    created_by: payload.created_by || null,
                    created_at: now,
                    updated_at: now,
                },
                { transaction }
            );
        }

        // Nếu đã có: set liked + bump interest_count + last_interested_at
        const nextCount = Number(existing.interest_count || 0) + 1;

        await existing.update(
            {
                status,
                interest_count: nextCount,
                last_interested_at: now,
                product_name: payload.product_name ?? existing.product_name,
                source: payload.source ?? existing.source,
                note: payload.note ?? existing.note,
                meta: payload.meta ?? existing.meta,
                updated_at: now,
            },
            { transaction }
        );

        return existing;
    }
    async upsertInterest(payload = {}, options = {}) {
        const { lead_id, product_id, ...rest } = payload || {};
        if (!lead_id) throw new Error('lead_id is required');
        if (!product_id) throw new Error('product_id is required');
        return this.upsertLike(lead_id, product_id, rest, options);
    }
    /**
     * Soft-unlike: không xóa row, chỉ set removed + set removed_at
     */
    async unlike(leadId, productId, payload = {}, options = {}) {
        const { transaction } = options;
        const now = new Date();

        const row = await this.LeadInterest.findOne({
            where: { lead_id: leadId, product_id: productId },
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
        });

        if (!row) {
            // Không tồn tại: tùy bạn, có thể tạo row removed để audit state
            return null;
        }

        await row.update(
            {
                status: 'removed',
                removed_at: now,
                note: payload.note ?? row.note,
                meta: payload.meta ?? row.meta,
                updated_at: now,
            },
            { transaction }
        );

        return row;
    }

    /**
     * Toggle:
     * - Nếu chưa có: tạo liked
     * - Nếu đang removed: chuyển liked
     * - Nếu đang liked: chuyển removed
     */
    async toggle(leadId, productId, payload = {}, options = {}) {
        const { transaction } = options;
        const now = new Date();

        const row = await this.LeadInterest.findOne({
            where: { lead_id: leadId, product_id: productId },
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
        });

        if (!row) {
            const created = await this.LeadInterest.create(
                {
                    lead_id: leadId,
                    product_id: productId,
                    product_name: payload.product_name || null,
                    status: 'liked',
                    interest_count: 1,
                    first_interested_at: now,
                    last_interested_at: now,
                    source: payload.source || null,
                    note: payload.note || null,
                    meta: payload.meta || null,
                    created_by: payload.created_by || null,
                    created_at: now,
                    updated_at: now,
                },
                { transaction }
            );
            return { row: created, status: 'liked', toggled: 'created' };
        }

        const current = String(row.status || '').toLowerCase();
        if (current === 'liked') {
            await row.update(
                {
                    status: 'removed',
                    removed_at: now,
                    note: payload.note ?? row.note,
                    meta: payload.meta ?? row.meta,
                    updated_at: now,
                },
                { transaction }
            );
            return { row, status: 'removed', toggled: 'unliked' };
        }

        // removed -> liked
        const nextCount = Number(row.interest_count || 0) + 1;
        await row.update(
            {
                status: 'liked',
                removed_at: null,
                interest_count: nextCount,
                last_interested_at: now,
                product_name: payload.product_name ?? row.product_name,
                source: payload.source ?? row.source,
                note: payload.note ?? row.note,
                meta: payload.meta ?? row.meta,
                updated_at: now,
            },
            { transaction }
        );
        return { row, status: 'liked', toggled: 'reliked' };
    }

    // =========================================================
    // Query/Stats
    // =========================================================

    async exists(leadId, productId, options = {}) {
        const { transaction } = options;
        const c = await this.LeadInterest.count({
            where: { lead_id: leadId, product_id: productId },
            transaction,
        });
        return c > 0;
    }

    async isLiked(leadId, productId, options = {}) {
        const { transaction } = options;
        const c = await this.LeadInterest.count({
            where: { lead_id: leadId, product_id: productId, status: 'liked' },
            transaction,
        });
        return c > 0;
    }

    /**
     * Top products được quan tâm (theo count liked)
     * Nếu bạn có table products riêng thì join sau.
     */
    async topProducts({ limit = 20, from = null, to = null } = {}) {
        const where = { status: 'liked' };
        if (from || to) {
            where.last_interested_at = {};
            if (from) where.last_interested_at[Op.gte] = new Date(from);
            if (to) where.last_interested_at[Op.lte] = new Date(to);
        }

        // group by product_id, product_name
        const rows = await this.LeadInterest.findAll({
            attributes: [
                'product_id',
                'product_name',
                [sequelize.fn('COUNT', sequelize.col('lead_interest_id')), 'liked_count'],
                [sequelize.fn('MAX', sequelize.col('last_interested_at')), 'last_seen_at'],
            ],
            where,
            group: ['product_id', 'product_name'],
            order: [[sequelize.literal('liked_count'), 'DESC']],
            limit,
        });

        return rows;
    }

    // =========================================================
    // Hard delete (hiếm khi dùng)
    // =========================================================
    async deleteHard(leadId, productId, options = {}) {
        const { transaction } = options;
        return this.LeadInterest.destroy({
            where: { lead_id: leadId, product_id: productId },
            transaction,
        });
    }
}

module.exports = new LeadInterestRepository();
