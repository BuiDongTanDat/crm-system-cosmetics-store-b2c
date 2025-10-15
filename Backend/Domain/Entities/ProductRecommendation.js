class ProductRecommendation {
  constructor({
    rec_id,
    product_id,
    recommended_product_id,
    score = 0.0,
    metadata = {},    // ví dụ: { reason: "similar_category", channel: "email" }
    updated_at = null
  } = {}) {
    this.rec_id = rec_id;
    this.product_id = product_id;
    this.recommended_product_id = recommended_product_id;
    this.score = typeof score === 'number' ? score : parseFloat(score) || 0.0;
    this.metadata = metadata || {};
    this.updated_at = updated_at || new Date();
  }

  setScore(newScore) {
    this.score = newScore;
    this.touch();
  }

  setMetadata(key, value) {
    this.metadata = this.metadata || {};
    this.metadata[key] = value;
    this.touch();
  }

  touch() {
    this.updated_at = new Date();
  }

  toJSON() {
    return {
      rec_id: this.rec_id,
      product_id: this.product_id,
      recommended_product_id: this.recommended_product_id,
      score: this.score,
      metadata: this.metadata,
      updated_at: this.updated_at,
    };
  }
}

module.exports = ProductRecommendation;
