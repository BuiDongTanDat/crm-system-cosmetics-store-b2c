// backend/src/Domain/Entities/CampaignChannel.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class CampaignChannel extends Model {}

CampaignChannel.init({
  channel_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // FK tới campaigns
  campaign_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'campaigns', key: 'campaign_id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  // Thông tin kênh
  channel: {
    type: DataTypes.STRING, // ví dụ: 'facebook_ads', 'google_ads', 'tiktok', 'email'
    allowNull: false,
  },
  account_name: {
    type: DataTypes.STRING, // tên tài khoản/platform
    allowNull: true,
  },
  budget: {
    type: DataTypes.FLOAT, // ngân sách riêng cho kênh (nếu có)
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  target_filter: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Targeting riêng cho kênh (ghi đè hoặc bổ sung)',
  },
  data_source: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nguồn đồng bộ số liệu của kênh (ví dụ: GA4, FB Ads API)',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft', // draft | active | paused | completed
  },

  // Số liệu hiệu quả cơ bản
  impressions: { type: DataTypes.BIGINT, defaultValue: 0 },
  clicks:      { type: DataTypes.BIGINT, defaultValue: 0 },
  conversions: { type: DataTypes.FLOAT,  defaultValue: 0 },
  cost:        { type: DataTypes.FLOAT,  defaultValue: 0 },
  revenue:     { type: DataTypes.FLOAT,  defaultValue: 0 },

  // Mở rộng: lưu thêm metric/raw payload nếu cần
  metrics_extra: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Bất kỳ metric khác (cpm, cpc chi tiết theo adset, v.v.)',
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // Các field ảo để tính nhanh
  ctr: {
    type: DataTypes.VIRTUAL,
    get() {
      const imp = Number(this.getDataValue('impressions') || 0);
      const clk = Number(this.getDataValue('clicks') || 0);
      return imp > 0 ? clk / imp : 0;
    }
  },
  cpc: {
    type: DataTypes.VIRTUAL,
    get() {
      const cost = Number(this.getDataValue('cost') || 0);
      const clk = Number(this.getDataValue('clicks') || 0);
      return clk > 0 ? cost / clk : 0;
    }
  },
  cpa: {
    type: DataTypes.VIRTUAL,
    get() {
      const cost = Number(this.getDataValue('cost') || 0);
      const cv = Number(this.getDataValue('conversions') || 0);
      return cv > 0 ? cost / cv : 0;
    }
  },
  roas: {
    type: DataTypes.VIRTUAL,
    get() {
      const rev = Number(this.getDataValue('revenue') || 0);
      const cost = Number(this.getDataValue('cost') || 0);
      return cost > 0 ? rev / cost : 0;
    }
  },
}, {
  sequelize,
  modelName: 'CampaignChannel',
  tableName: 'campaign_channels',
  timestamps: false,
  indexes: [
    { fields: ['campaign_id'] },
    { fields: ['campaign_id', 'channel'], unique: false },
  ],
});

module.exports = CampaignChannel;
