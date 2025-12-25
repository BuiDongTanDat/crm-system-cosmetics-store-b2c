// backend/src/Domain/Entities/CustomerAnalyticsSnapshot.js
const { DataTypes, Model } = require('sequelize');
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
    },

    snapshot_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // =========================
    // A) Behavior KPIs (existing)
    // =========================
    total_views_7d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    add_to_cart_7d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    purchase_7d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // NOTE: tiền không nên dùng FLOAT. Dùng DECIMAL/NUMERIC để tránh sai số.
    revenue_30d: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },

    last_active_at: { type: DataTypes.DATE, allowNull: true },

    // =========================
    // B) RFM (raw) + derived
    // =========================
    // Recency: số ngày từ snapshot_date đến last_purchase_at
    recency_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // Frequency/Monetary theo cửa sổ 90d (phục vụ segmentation/CLV/churn)
    frequency_90d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    monetary_90d: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    avg_order_value_90d: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },

    // Diversity: số SKU/category distinct trong 90d (tuỳ cách bạn tính)
    product_diversity_90d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // (Optional) log features nếu bạn muốn backend tính sẵn để đúng format train
    // log1p(monetary_90d), log1p(avg_order_value_90d)
    log_monetary_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    log_avg_order_value_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },

    // =========================
    // C) Satisfaction / sensitivity proxies
    // =========================
    return_rate_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 }, // 0..1
    support_ticket_count_90d: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    email_open_rate_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 }, // 0..1

    // Discount sensitivity: tỉ trọng đơn có giảm giá hoặc mức discount trung bình (tuỳ định nghĩa)
    discount_sensitivity_90d: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },

    // =========================
    // D) Purchase timestamps (audit / recency chuẩn)
    // =========================
    first_purchase_at: { type: DataTypes.DATE, allowNull: true },
    last_purchase_at: { type: DataTypes.DATE, allowNull: true },

    // =========================
    // E) Model outputs per snapshot
    // =========================
    churn_score: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 }, // 0..1

    segment_id: { type: DataTypes.SMALLINT, allowNull: true },
    segment_name: { type: DataTypes.STRING, allowNull: true },

    clv_6m: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    clv_12m: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },

    // =========================
    // F) Flexible payload
    // =========================
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
      // Truy vấn snapshot mới nhất theo customer
      { fields: ['customer_id', 'snapshot_date'] },

      // Truy vấn theo segment / churn / CLV (tuỳ dashboard)
      { fields: ['segment_id'] },
      { fields: ['churn_score'] },
      { fields: ['clv_12m'] },
    ],
  }
);

module.exports = CustomerAnalyticsSnapshot;
