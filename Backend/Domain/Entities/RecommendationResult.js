// backend/src/Domain/Entities/RecommendationResult.js

class RecommendationResult {
  constructor({
    recommendation_id,
    customer_id,
    generated_at = null,
    recommendations = [], // array of product ids or objects
    trigger_event = null  // e.g. "order_completed", "profile_view"
  } = {}) {
    this.recommendation_id = recommendation_id;
    this.customer_id = customer_id;
    this.generated_at = generated_at || new Date();
    this.recommendations = Array.isArray(recommendations) ? recommendations : [];
    this.trigger_event = trigger_event;
  }

  addRecommendation(item) {
    this.recommendations.push(item);
  }

  clearRecommendations() {
    this.recommendations = [];
  }

  toJSON() {
    return {
      recommendation_id: this.recommendation_id,
      customer_id: this.customer_id,
      generated_at: this.generated_at,
      recommendations: this.recommendations,
      trigger_event: this.trigger_event,
    };
  }
}

module.exports = RecommendationResult;
