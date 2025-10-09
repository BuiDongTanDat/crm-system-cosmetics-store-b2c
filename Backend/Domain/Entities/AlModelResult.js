const { DataTypes } = require("sequelize");
class AIModelResult {
  constructor({
    model_result_id,
    model_name,
    customer_id = null,
    lead_id = null,
    result = {},
    score = 0.0,
    created_at = null,
  } = {}) {
    this.model_result_id = model_result_id;
    this.model_name = model_name;
    this.customer_id = customer_id;
    this.lead_id = lead_id;
    this.result = result;
    this.score = parseFloat(score) || 0.0;
    this.created_at = created_at || new Date();
  }

  updateResult(newResult, newScore = null) {
    this.result = newResult;
    if (newScore !== null) this.score = newScore;
  }

  toJSON() {
    return {
      model_result_id: this.model_result_id,
      model_name: this.model_name,
      customer_id: this.customer_id,
      lead_id: this.lead_id,
      result: this.result,
      score: this.score,
      created_at: this.created_at,
    };
  }
  static definePostgresModel(sequelize) {
    return sequelize.define(
      "AIModelResult",
      {
        model_result_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        model_name: { type: DataTypes.STRING, allowNull: false },
        customer_id: { type: DataTypes.UUID },
        lead_id: { type: DataTypes.UUID },
        result: { type: DataTypes.JSONB },
        score: { type: DataTypes.FLOAT, defaultValue: 0.0 },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      { tableName: "ai_model_results", timestamps: false }
    );
  }
}

module.exports = AIModelResult;
