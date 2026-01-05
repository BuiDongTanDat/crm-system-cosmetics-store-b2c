// Application/Services/LeadFeatureBuilderService.js
const Lead = require('../../Domain/Entities/Lead');
const LeadInteraction = require('../../Domain/Entities/LeadInteraction');
const LeadInterest = require('../../Domain/Entities/LeadInterest'); // bảng lead_interests
const Product = require('../../Domain/Entities/Product');
const { Op } = require('sequelize');

function priceBucket(price) {
  const p = Number(price || 0);
  if (p <= 0) return 'unknown';
  if (p < 100000) return 'low';
  if (p < 300000) return 'medium';
  return 'high';
}

class LeadFeatureBuilderService {
  /**
   * Build feature object theo schema bạn đang gửi:
   * { source, status, lead_score, priority, campaign_id, product_interest, ... }
   */
  static async buildLeadFeatures(leadId, options = {}) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) throw new Error('Lead not found');

    // Interactions aggregate
    const total_interactions = await LeadInteraction.count({ where: { lead_id: leadId } });

    const lastInteraction = await LeadInteraction.findOne({
      where: { lead_id: leadId },
      order: [['created_at', 'DESC']],
    });

    // Primary product interest: lấy interest mới nhất
    const interest = await LeadInterest.findOne({
      where: { lead_id: leadId },
      order: [['updated_at', 'DESC']],
    });

    let product = null;
    if (interest?.product_id) {
      product = await Product.findByPk(interest.product_id);
    }

    const createdAt = lead.created_at || lead.createdAt;
    const days_since_created = createdAt
      ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const product_price = product?.price_current ?? null;
    const product_discount = product?.discount_percent ?? null;

    const features = {
      // Lead state
      source: lead.source || null,
      status: lead.status || null,
      lead_score: lead.lead_score ?? 0,
      priority: lead.priority || null,
      campaign_id: lead.campaign_id || null,
      assigned_to: lead.assigned_to || null,

      // derived time/behavior
      days_since_created,
      total_interactions,
      last_interaction_type: lastInteraction?.interaction_type || lastInteraction?.type || null,

      // interest & product context
      product_interest: interest?.product_name || product?.name || lead.product_interest || null,
      product_brand: product?.brand || null,
      product_category: product?.category || null,
      product_price: product_price ?? 0,
      product_discount: product_discount ?? 0,
      product_rating: product?.rating ?? 0,
      product_n_ratings: product?.reviews_count ?? 0,
      product_stock: product?.inventory_qty ?? 0,

      price_bucket: priceBucket(product_price),
      is_discounted: (Number(product_discount || 0) > 0 ? 1 : 0),

      // tags nếu bạn lưu dạng array/json
      tags: Array.isArray(lead.tags) ? lead.tags : [],
    };

    return features;
  }
}

module.exports = LeadFeatureBuilderService;
