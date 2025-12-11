// backend/src/Domain/Entities/CustomerAnalyticsSnapshot.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class CustomerAnalyticsSnapshot extends Model {}

CustomerAnalyticsSnapshot.init(
  {
    snapshot_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customer_id: { type: DataTypes.UUID, allowNull: false },

    snapshot_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    total_views_7d: { type: DataTypes.INTEGER, defaultValue: 0 },
    add_to_cart_7d: { type: DataTypes.INTEGER, defaultValue: 0 },
    purchase_7d: { type: DataTypes.INTEGER, defaultValue: 0 },
    revenue_30d: { type: DataTypes.FLOAT, defaultValue: 0 },
    last_active_at: { type: DataTypes.DATE, allowNull: true },

    churn_score: { type: DataTypes.FLOAT, defaultValue: 0 },  // 0..1

    metadata: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    sequelize,
    modelName: 'CustomerAnalyticsSnapshot',
    tableName: 'customer_analytics_snapshots',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['snapshot_date'] },
    ],
  }
);

module.exports = CustomerAnalyticsSnapshot;
