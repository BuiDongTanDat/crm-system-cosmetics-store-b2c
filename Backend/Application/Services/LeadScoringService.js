// Application/Services/LeadScoringService.js
const crypto = require('crypto');
const { Op } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const leadPredictionRepo = require('../../Infrastructure/Repositories/LeadPredictionRepository');
const Lead = require('../../Domain/Entities/Lead');
const LeadFeatureBuilderService = require('./LeadFeatureBuilderService');
const AIClient = require('../../Infrastructure/external/AIClient');

function hashFeatures(obj) {
    const keys = Object.keys(obj || {}).sort();
    const s = JSON.stringify(obj || {}, keys);
    return crypto.createHash('sha256').update(s).digest('hex');
}

class LeadScoringService {
    static async rescoreLead(
        leadId,
        { trigger = 'daily_job', modelVersion = null, saveFeaturesJson = true } = {}
    ) {
        const sequelize = DataManager.getSequelize();

        // 1) build features từ DB
        const features = await LeadFeatureBuilderService.buildLeadFeatures(leadId);

        // 2) call FastAPI
        const ml = await AIClient.predictConversion(features) || {};
        const now = new Date();

        const mlProb = Number(ml.predicted_prob ?? 0);
        const mlValue = Number(ml.predicted_value ?? 0);
        const currency = String(ml.predicted_value_currency || 'VND');

        const features_hash = hashFeatures(features);

        return sequelize.transaction(async (t) => {
            // history
            const row = await leadPredictionRepo.create(
                {
                    lead_id: leadId,
                    scored_at: now,
                    model_version: modelVersion || ml?.models?.version || null,
                    model_name: ml?.models?.cls || 'lead_cls_onehot',
                    conversion_prob: mlProb,
                    raw_score: ml.raw_score ?? null,
                    predicted_value: mlValue,
                    currency,
                    trigger,
                    features_hash,
                    features_json: saveFeaturesJson ? features : null,
                },
                { transaction: t }
            );

            // update lead snapshot fields
            await Lead.update(
                {
                    ml_conversion_prob: mlProb,
                    ml_predicted_value: mlValue,
                    ml_last_scored_at: now,
                    ml_model_version: modelVersion || ml?.models?.version || null,

                    // mirror to "legacy/current" fields nếu bạn đang dùng ở UI
                    conversion_prob: mlProb,
                    predicted_value: mlValue,
                    predicted_value_currency: currency,
                    last_predicted_at: now,
                },
                { where: { lead_id: leadId }, transaction: t }
            );

            return { lead_id: leadId, prediction: row, ml };
        });
    }
    static async getPredictions(leadId, { limit = 50, offset = 0, since, until, order = 'desc' } = {}) {
        const rows = await leadPredictionRepo.listByLeadId(leadId, {
            limit,
            offset,
            since,
            until,
            order,
        });

        // Trả JSON sạch
        return {
            ok: true,
            data: rows.map(r => (typeof r?.toJSON === 'function' ? r.toJSON() : r)),
            error: null,
        };
    }
    static async rescoreDailyBatch({ limit = 200, offset = 0 } = {}) {
        const leads = await Lead.findAll({
            where: {
                status: { [Op.notIn]: ['converted', 'closed_lost'] },
            },
            order: [['updated_at', 'DESC']],
            limit,
            offset,
        });

        const results = [];
        for (const l of leads) {
            try {
                const r = await this.rescoreLead(l.lead_id, { trigger: 'daily_job' });
                results.push({ lead_id: l.lead_id, ok: true, data: r.ml });
            } catch (e) {
                results.push({ lead_id: l.lead_id, ok: false, error: e.message });
            }
        }
        return { ok: true, total: leads.length, results };
    }
}

module.exports = LeadScoringService;
