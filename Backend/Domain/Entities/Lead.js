// backend/src/Domain/Entities/Lead.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Lead extends Model {
  updateStatus(newStatus) {
    this.status = newStatus;
  }
}
Lead.init(
  {
    lead_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    anon_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Anonymous visitor id (from localStorage/cookie)',
    },

    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên hiển thị (có thể null với anonymous lead)',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      // validate: { isEmail: true },
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'inbound',
      comment: 'inbound | ads | zalo | ...',
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'new',
      validate: {
        isIn: [['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost']],
      },
    },

    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },

    lead_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    conversion_prob: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },

    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'campaigns', key: 'campaign_id' },
      onDelete: 'SET NULL',
      comment: 'Original campaign that created this lead (First Touch)',
    },

    // Last Touch Attribution
    last_campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Most recent campaign interaction',
    },
    last_channel_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Most recent channel interaction',
    },

    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'SET NULL',
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    predicted_prob: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },

    last_predicted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    predicted_value: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
    },

    predicted_value_currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'VND',
    },

    ai_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Giải thích của AI vì sao chấm điểm/ước lượng',
    },

    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [['low', 'medium', 'high', 'urgent']] },
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú từ form liên hệ / tư vấn',
    },
    product_interest: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '[DEPRECATED] Sẽ chuyển qua lead_interests',
    },
    deal_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '[DEPRECATED] Deal nên thuộc order/opportunity, không cố định trên lead',
    },
    ml_conversion_prob: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    ml_predicted_value: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
    },
    ml_last_scored_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ml_model_version: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Lead',
    tableName: 'leads',
    timestamps: false,
    underscored: true,

    indexes: [
      { fields: ['customer_id'] },
      { unique: true, fields: ['anon_id'] },
    ],
  }
);

module.exports = Lead;
