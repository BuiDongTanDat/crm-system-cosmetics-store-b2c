// backend/src/Domain/Entities/LeadAnalyticsSnapshot.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class LeadAnalyticsSnapshot extends Model {}

LeadAnalyticsSnapshot.init(
  {
    snapshot_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    lead_id: { type: DataTypes.UUID, allowNull: false },
    snapshot_date: { type: DataTypes.DATEONLY, allowNull: false },

    score: { type: DataTypes.INTEGER, defaultValue: 0 },
    predicted_prob: { type: DataTypes.FLOAT, defaultValue: 0 }, // AI model

    interactions_7d: { type: DataTypes.INTEGER, defaultValue: 0 },
    viewed_products: { type: DataTypes.JSONB, defaultValue: [] },

    metadata: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    sequelize,
    modelName: 'LeadAnalyticsSnapshot',
    tableName: 'lead_analytics_snapshots',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['lead_id'] },
      { fields: ['snapshot_date'] },
    ],
  }
);

module.exports = LeadAnalyticsSnapshot;
