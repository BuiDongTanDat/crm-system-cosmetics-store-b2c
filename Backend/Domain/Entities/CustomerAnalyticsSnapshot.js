// backend/src/Domain/Entities/CustomerAnalyticsSnapshot.js
const { DataTypes, Model } = require('sequelize');
const Customer = require('./Customer');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class CustomerAnalyticsSnapshot extends Model { }

CustomerAnalyticsSnapshot.init(
  {
    snapshot_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'customers', key: 'customer_id' }, // ✅ thêm FK
      onDelete: 'CASCADE', // ✅ xoá customer -> xoá snapshot
      onUpdate: 'CASCADE',
    },

    snapshot_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // A) Behavior KPIs
    total_views_7d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    add_to_cart_7d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    purchase_7d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    revenue_30d: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },

    last_active_at: { type: DataTypes.DATE, allowNull: true },

    // B) RFM
    recency_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    frequency_90d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    monetary_90d: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    avg_order_value_90d: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    product_diversity_90d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    log_monetary_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    log_avg_order_value_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },

    // C) Proxies
    return_rate_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    support_ticket_count_90d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    email_open_rate_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    discount_sensitivity_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },

    // D) Purchase timestamps
    first_purchase_at: { type: DataTypes.DATE, allowNull: true },
    last_purchase_at: { type: DataTypes.DATE, allowNull: true },

    // E) Model outputs
    churn_score: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    segment_id: { type: DataTypes.SMALLINT, allowNull: true },
    segment_name: { type: DataTypes.STRING, allowNull: true },
    clv_1m: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    clv_3m: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    clv_6m: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    clv_12m: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },

    // F) metadata
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
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
      { fields: ['customer_id', 'snapshot_date'] },
      {
        unique: true,
        name: 'ux_customer_snapshot_date',
        fields: ['customer_id', 'snapshot_date'],
      },

      { fields: ['segment_id'] },
      { fields: ['churn_score'] },
      { fields: ['clv_12m'] },
    ],
  }
);

CustomerAnalyticsSnapshot.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

module.exports = CustomerAnalyticsSnapshot;
