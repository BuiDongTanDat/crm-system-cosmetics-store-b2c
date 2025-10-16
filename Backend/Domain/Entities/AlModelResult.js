const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class AIModelResult extends Model {
  // ✅ Method cập nhật kết quả model
  updateResult(newResult, newScore = null) {
    this.result = newResult;
    if (newScore !== null) this.score = newScore;
  }

  // ✅ Chuẩn hóa output JSON
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
}

AIModelResult.init(
  {
    model_result_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    model_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    result: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AIModelResult',
    tableName: 'ai_model_results',
    timestamps: false,
    underscored: true, 
  }
);

module.exports = AIModelResult;
