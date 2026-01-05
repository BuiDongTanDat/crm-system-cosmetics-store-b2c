
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class LeadPrediction extends Model {}

LeadPrediction.init(
  {
    lead_prediction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lead_id: { type: DataTypes.UUID, allowNull: false },

    scored_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

    model_version: { type: DataTypes.STRING },
    model_name: { type: DataTypes.STRING },

    conversion_prob: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    raw_score: { type: DataTypes.FLOAT },
    predicted_value: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'VND' },

    trigger: {
      type: DataTypes.ENUM('daily_job', 'status_change', 'manual', 'new_lead', 'interaction_added'),
      allowNull: false,
      defaultValue: 'daily_job',
    },

    features_hash: { type: DataTypes.STRING },
    features_json: { type: DataTypes.JSONB },
  },
  {
    sequelize,
    modelName: 'LeadPrediction',
    tableName: 'lead_predictions',
    timestamps: true,
    underscored: true,
  }
);

module.exports = LeadPrediction;
