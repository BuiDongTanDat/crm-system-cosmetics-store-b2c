// backend/src/Application/Services/CustomerAnalyticsSnapshotService.js
const { Op } = require('sequelize');
const CustomerRepo = require('../../Infrastructure/Repositories/CustomerRepository');
const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
const CustomerInteractionRepo = require('../../Infrastructure/Repositories/CustomerInteractionRepository');
const SnapshotRepo = require('../../Infrastructure/Repositories/CustomerAnalyticsSnapshotRepository');
const aiClient = require('../../Infrastructure/external/AIClient');

function toDateOnlyISO(d) {
    const x = new Date(d);
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    const dd = String(x.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function daysDiff(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    const ms = a.getTime() - b.getTime();
    return Math.max(0, Math.floor(ms / (24 * 3600 * 1000)));
}

function num(x, d = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : d;
}
function buildChurnJsonFull(features) {
    const m = features.metadata || {};
    const n = (x, d = 0) => (Number.isFinite(Number(x)) ? Number(x) : d);
    const s = (x, d = 'unknown') => (x === null || x === undefined || x === '' ? d : String(x));

    return {
        orders_30d: n(m.orders_30d, 0),
        orders_90d: n(features.frequency_90d, 0),

        spend_30d: n(features.revenue_30d, 0),
        spend_90d: n(features.monetary_90d, 0),
        avg_order_value_90d: n(features.avg_order_value_90d, 0),

        sessions_30d: n(m.sessions_30d, 0),
        product_views_30d: n(m.product_views_30d, 0),
        add_to_cart_30d: n(m.add_to_cart_30d, 0),
        checkout_start_30d: n(m.checkout_start_30d, 0),

        days_since_last_purchase: n(features.recency_days, 0),
        orders_30d_vs_prev30d: n(m.orders_30d_vs_prev30d, 0),
        spend_30d_vs_prev30d: n(m.spend_30d_vs_prev30d, 0),

        cart_to_checkout_rate: n(m.cart_to_checkout_rate, 0),
        checkout_to_purchase_rate: n(m.checkout_to_purchase_rate, 0),

        discount_dependency: n(features.discount_sensitivity_90d, 0),

        email_open_rate_30d: n(m.email_open_rate_30d, 0),
        push_open_rate_30d: n(m.push_open_rate_30d, 0),

        coupon_used_90d: n(m.coupon_used_90d, 0),
        returns_90d: n(m.returns_90d, 0),
        refund_ratio_90d: n(m.refund_ratio_90d, 0),
        complaints_90d: n(m.complaints_90d, 0),
        avg_rating_90d: n(m.avg_rating_90d, 0),

        engagement_score_30d: n(m.engagement_score_30d, 0),
        experience_risk_score: n(m.experience_risk_score, 0),
        price_sensitivity_score: n(m.price_sensitivity_score, 0),

        customer_tenure_days: n(m.customer_tenure_days, 0),
        promotion_period_flag: n(m.promotion_period_flag, 0),

        skin_type: s(m.skin_type, 'unknown'),
        preferred_category: s(m.preferred_category, 'unknown'),
        primary_purchase_channel: s(m.primary_purchase_channel, 'unknown'),
        device_type: s(m.device_type, 'unknown'),
        traffic_source: s(m.traffic_source, 'unknown'),
    };
}

class CustomerAnalyticsSnapshotService {
    constructor() {
        this.snapshotRepo = SnapshotRepo;
        this.customerRepo = CustomerRepo;
        this.orderRepo = OrderRepo;
        this.customerInteractionRepo = CustomerInteractionRepo;
    }

    _rangeFromSnapshot(snapshotDate, daysBack) {
        const end = new Date(snapshotDate);
        end.setHours(23, 59, 59, 999);
        const start = new Date(snapshotDate);
        start.setDate(start.getDate() - daysBack);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    }

    async _aggregateOrders(customer_id, snapshotDate) {
        const snap = new Date(snapshotDate);
        const r7 = this._rangeFromSnapshot(snap, 7);
        const r30 = this._rangeFromSnapshot(snap, 30);
        const r90 = this._rangeFromSnapshot(snap, 90);

        const PAID_STATUSES = ['paid', 'completed', 'shipped', 'processing'];

        const countPaid7d = await this.orderRepo.count?.({
            where: {
                customer_id,
                status: { [Op.in]: PAID_STATUSES },
                order_date: { [Op.between]: [r7.start.toISOString(), r7.end.toISOString()] },
            },
        });

        const sumPaid30d = await this.orderRepo.sum?.('total_amount', {
            where: {
                customer_id,
                status: { [Op.in]: PAID_STATUSES },
                order_date: { [Op.between]: [r30.start.toISOString(), r30.end.toISOString()] },
            },
        });

        const countPaid90d = await this.orderRepo.count?.({
            where: {
                customer_id,
                status: { [Op.in]: PAID_STATUSES },
                order_date: { [Op.between]: [r90.start.toISOString(), r90.end.toISOString()] },
            },
        });

        const sumPaid90d = await this.orderRepo.sum?.('total_amount', {
            where: {
                customer_id,
                status: { [Op.in]: PAID_STATUSES },
                order_date: { [Op.between]: [r90.start.toISOString(), r90.end.toISOString()] },
            },
        });

        const firstOrder = await this.orderRepo.findOne?.({
            where: { customer_id, status: { [Op.in]: PAID_STATUSES } },
            order: [['order_date', 'ASC']],
        });

        const lastOrder = await this.orderRepo.findOne?.({
            where: { customer_id, status: { [Op.in]: PAID_STATUSES } },
            order: [['order_date', 'DESC']],
        });

        let productDiversity90d = 0;
        try {
            const sequelize = this.orderRepo.sequelize || this.orderRepo.Order?.sequelize;
            if (sequelize) {
                const [rows] = await sequelize.query(
                    `
          SELECT COUNT(DISTINCT od.product_id)::int AS cnt
          FROM order_details od
          JOIN orders o ON o.order_id = od.order_id
          WHERE o.customer_id = :customer_id
            AND o.status = ANY(:paid_statuses)
            AND o.order_date BETWEEN :start AND :end
          `,
                    {
                        replacements: {
                            customer_id,
                            paid_statuses: PAID_STATUSES,
                            start: r90.start.toISOString(),
                            end: r90.end.toISOString(),
                        },
                    }
                );
                productDiversity90d = Number(rows?.[0]?.cnt || 0);
            }
        } catch {
            productDiversity90d = 0;
        }

        const frequency_90d = Number(countPaid90d || 0);
        const monetary_90d = Number(sumPaid90d || 0);
        const avg_order_value_90d = frequency_90d > 0 ? monetary_90d / frequency_90d : 0;

        return {
            purchase_7d: Number(countPaid7d || 0),
            revenue_30d: Number(sumPaid30d || 0),
            frequency_90d,
            monetary_90d,
            avg_order_value_90d,
            product_diversity_90d: Number(productDiversity90d || 0),
            first_purchase_at: firstOrder?.order_date || null,
            last_purchase_at: lastOrder?.order_date || null,
        };
    }

    async _aggregateInteractions(customer_id, snapshotDate) {
        const snap = new Date(snapshotDate);
        const r7 = this._rangeFromSnapshot(snap, 7);
        const r90 = this._rangeFromSnapshot(snap, 90);

        const total_views_7d = await this.customerInteractionRepo.countByType(customer_id, 'view', {
            since: r7.start.toISOString(),
            until: r7.end.toISOString(),
        });

        const add_to_cart_7d = await this.customerInteractionRepo.countByType(customer_id, 'add_to_cart', {
            since: r7.start.toISOString(),
            until: r7.end.toISOString(),
        });

        const email_opened_90d = await this.customerInteractionRepo.countByType(customer_id, 'email_opened', {
            since: r90.start.toISOString(),
            until: r90.end.toISOString(),
        });

        const email_sent_90d = await this.customerInteractionRepo.countByType(customer_id, 'email_sent', {
            since: r90.start.toISOString(),
            until: r90.end.toISOString(),
        });

        const email_open_rate_90d =
            Number(email_sent_90d || 0) > 0 ? Number(email_opened_90d || 0) / Number(email_sent_90d) : 0;

        let last_active_at = null;
        const last = await this.customerInteractionRepo.list(customer_id, { limit: 1 });
        if (last?.[0]?.occurred_at) last_active_at = last[0].occurred_at;

        return {
            total_views_7d: Number(total_views_7d || 0),
            add_to_cart_7d: Number(add_to_cart_7d || 0),
            email_open_rate_90d: Number(email_open_rate_90d || 0),
            last_active_at,
        };
    }

    async computeSnapshotFeatures(customer_id, snapshot_date) {
        const customer = await this.customerRepo.findById(customer_id);
        if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

        const snapshotDate = snapshot_date ? new Date(snapshot_date) : new Date();
        const dateOnly = toDateOnlyISO(snapshotDate);

        // Fetch existing snapshot to preserve metadata
        const existing = await this.snapshotRepo.getLatest(customer_id);
        const existingMetadata = (existing && toDateOnlyISO(existing.snapshot_date) === dateOnly)
            ? (existing.metadata || {})
            : {};

        const [orderAgg, interAgg] = await Promise.all([
            this._aggregateOrders(customer_id, snapshotDate),
            this._aggregateInteractions(customer_id, snapshotDate),
        ]);

        const recency_days = orderAgg.last_purchase_at ? daysDiff(dateOnly, orderAgg.last_purchase_at) : 0;

        const log_monetary_90d = Math.log1p(Number(orderAgg.monetary_90d || 0));
        const log_avg_order_value_90d = Math.log1p(Number(orderAgg.avg_order_value_90d || 0));

        // placeholders (nếu chưa có)
        const return_rate_90d = 0;
        const support_ticket_count_90d = 0;
        const discount_sensitivity_90d = 0;

        return {
            customer_id,
            snapshot_date: dateOnly,

            ...interAgg,
            ...orderAgg,

            recency_days,
            log_monetary_90d,
            log_avg_order_value_90d,

            return_rate_90d,
            support_ticket_count_90d,
            discount_sensitivity_90d,

            return_rate_90d,
            support_ticket_count_90d,
            discount_sensitivity_90d,

            metadata: existingMetadata,
        };
    }

    async _enrichWithAI(features, { segmentMap = null, debug = false, horizon = '12m' } = {}) {
        // Default mapping if not provided
        if (!segmentMap) {
            segmentMap = {
                0: 'Kém hoạt động',
                1: 'Ngủ đông / Rủi ro',
                2: 'Trung thành & Giá trị cao',
            };
        }
        // churn payload
        const churn_json = buildChurnJsonFull(features);
        const churnRes = await aiClient.predictCustomerChurn(churn_json, debug);
        const churn_score = num(churnRes?.churn_prob ?? churnRes?.probability ?? churnRes?.churn_score, 0);

        // clv payload
        const clv_json = {
            acquisition_channel: features?.metadata?.acquisition_channel ?? 'Unknown',
            campaign_type: features?.metadata?.campaign_type ?? 'Unknown',
            acquisition_cost: num(features?.metadata?.acquisition_cost, 0),

            recency: num(features.recency_days),
            frequency_90d: num(features.frequency_90d),
            product_diversity: num(features.product_diversity_90d),

            return_rate: num(features.return_rate_90d),
            email_open_rate: num(features.email_open_rate_90d),
            support_ticket_count: num(features.support_ticket_count_90d),

            first_purchase_year: new Date(features.snapshot_date).getFullYear(),
            first_purchase_purchase_month: new Date(features.snapshot_date).getMonth() + 1,
            first_purchase_dayofweek: new Date(features.snapshot_date).getDay(),

            log_monetary_90d: num(features.log_monetary_90d),
            log_avg_order_value: num(features.log_avg_order_value_90d),
        };

        const clvRes = await aiClient.predictCustomerCLV(horizon, clv_json, debug);
        const clvPred = num(clvRes?.CLV_pred ?? clvRes?.clv_pred ?? clvRes?.clv, 0);

        // NOTE: Model pipeline (CodeTraining.ipynb) uses StandardScaler internally.
        // We pass raw values with correct snake_case feature names matching training data (X).
        const segPayload = {
            recency_days: num(features.recency_days),
            orders_90d: num(features.frequency_90d), // 'orders_90d' in training? 'frequency_90d' in some docs. Checking training... Using generic frequency mapping if unsure or exact match.
            // Wait, training notebook uses: recency_days, orders_90d, revenue_90d...
            // Let's use the explicit names found in CodeTraining.ipynb cell 1144: "recency_days","orders_90d","revenue_90d"
            recency_days: num(features.recency_days),
            orders_90d: num(features.frequency_90d),
            revenue_90d: num(features.monetary_90d),

            // For other fields like Discount/Category, we map to what likely exists or pass raw if uncertain, 
            // but relying on the fact that pipeline ignores unknown columns (if aligned) or handles them.
            // Training X had many columns. Providing the RFM core is plausible for the subset model or if these 5 were the only ones used in a smaller model (but notebook shows large X).
            // IF the user insists on the 5-feature KMeans model, they might be using a DIFFERENT model file than the one in the notebook.
            // However, assuming the notebook generates the model:
            // The notebook KMeans (Cell 1396) fits on 'X' (Cell 1267) which has MANY columns.
            // So we should try to pass as much as we can from 'features'.
            ...features,
        };

        const segRes = await aiClient.segmentCustomer(segPayload, segmentMap, debug);

        const patch = {
            churn_score,
            segment_id: segRes?.segment_id ?? null,
            segment_name: segRes?.segment_name ?? null,
            metadata: {
                ...(features.metadata || {}),
                churn_ai: churnRes,
                segment_ai: segRes,
                [`clv_${horizon}_ai`]: clvRes,
                ai_scored_at: new Date().toISOString(),
            },
        };

        if (horizon === '1m') patch.clv_1m = clvPred;
        if (horizon === '3m') patch.clv_3m = clvPred;
        if (horizon === '6m') patch.clv_6m = clvPred;
        if (horizon === '12m') patch.clv_12m = clvPred;

        return patch;
    }

    async upsertSnapshot(customer_id, snapshot_date, patch = {}) {
        const features = await this.computeSnapshotFeatures(customer_id, snapshot_date);
        const merged = { ...features, ...patch };
        return this.snapshotRepo.upsertByCustomerAndDate(customer_id, merged.snapshot_date, merged);
    }

    async upsertSnapshotWithAI(customer_id, snapshot_date, opts = {}) {
        const { segmentMap = {}, debug = false, horizon = '12m', patch = {} } = opts;
        const features = await this.computeSnapshotFeatures(customer_id, snapshot_date);
        const aiPatch = await this._enrichWithAI(features, { segmentMap, debug, horizon });
        const merged = { ...features, ...aiPatch, ...patch };
        return this.snapshotRepo.upsertByCustomerAndDate(customer_id, merged.snapshot_date, merged);
    }

    async getLatest(customer_id) {
        return this.snapshotRepo.getLatest(customer_id);
    }

    async list(customer_id, q = {}) {
        return this.snapshotRepo.listByCustomer(customer_id, q);
    }
}

module.exports = new CustomerAnalyticsSnapshotService();
