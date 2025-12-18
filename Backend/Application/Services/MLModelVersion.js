// backend/src/Domain/Entities/MLModelVersion.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class MLModelVersion extends Model {}

MLModelVersion.init(
  {
    model_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    model_name: { type: DataTypes.STRING, allowNull: false }, // churn / lead_conv / clv / recommend

    version: { type: DataTypes.STRING, allowNull: false }, // v1, v2, 2024-12-01

    status: {
      type: DataTypes.ENUM('training', 'active', 'archived', 'failed'),
      defaultValue: 'training',
    },

    metrics: {
      type: DataTypes.JSONB,
      defaultValue: {}, // accuracy, auc, loss…
    },

    artifact_path: { type: DataTypes.STRING, allowNull: false }, // URL file model

    trained_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deployed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'MLModelVersion',
    tableName: 'ml_model_versions',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['model_name'] },
      { fields: ['version'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = MLModelVersion;
