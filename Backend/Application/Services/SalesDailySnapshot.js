// backend/src/Domain/Entities/SalesDailySnapshot.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class SalesDailySnapshot extends Model {}

SalesDailySnapshot.init(
  {
    snapshot_date: {
      type: DataTypes.DATEONLY,
      primaryKey: true,
    },

    total_orders: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_revenue: { type: DataTypes.FLOAT, defaultValue: 0 },
    avg_order_value: { type: DataTypes.FLOAT, defaultValue: 0 },

    new_customers: { type: DataTypes.INTEGER, defaultValue: 0 },
    repeat_customers: { type: DataTypes.INTEGER, defaultValue: 0 },

    by_channel: { type: DataTypes.JSONB, defaultValue: {} },
    by_product: { type: DataTypes.JSONB, defaultValue: {} },

    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'SalesDailySnapshot',
    tableName: 'sales_daily_snapshots',
    timestamps: false,
    underscored: true,
  }
);

module.exports = SalesDailySnapshot;
