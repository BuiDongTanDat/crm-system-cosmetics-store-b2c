// backend/src/Domain/Entities/CampaignChannel.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class CampaignChannel extends Model { }

CampaignChannel.init({
  channel_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  campaign_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'campaigns', key: 'campaign_id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  channel: { type: DataTypes.STRING, allowNull: false }, // 'email', 'facebook_ads', ...
  account_name: { type: DataTypes.STRING, allowNull: true },
  budget: { type: DataTypes.FLOAT, allowNull: true },
  start_date: { type: DataTypes.DATE, allowNull: true },
  end_date: { type: DataTypes.DATE, allowNull: true },
  target_filter: { type: DataTypes.JSONB, defaultValue: {} },
  data_source: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'draft' },
  impressions: { type: DataTypes.BIGINT, defaultValue: 0 },
  clicks: { type: DataTypes.BIGINT, defaultValue: 0 },
  conversions: { type: DataTypes.FLOAT, defaultValue: 0 },
  cost: { type: DataTypes.FLOAT, defaultValue: 0 },
  revenue: { type: DataTypes.FLOAT, defaultValue: 0 },
  sent: { type: DataTypes.BIGINT, defaultValue: 0 },
  delivered: { type: DataTypes.BIGINT, defaultValue: 0 },
  opens_unique: { type: DataTypes.BIGINT, defaultValue: 0 },
  clicks_unique: { type: DataTypes.BIGINT, defaultValue: 0 },
  opens_total: { type: DataTypes.BIGINT, defaultValue: 0 },
  clicks_total: { type: DataTypes.BIGINT, defaultValue: 0 },
  last_engagement_sync_at: { type: DataTypes.DATE, allowNull: true },
  metrics_extra: { type: DataTypes.JSONB, defaultValue: {} },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  settings: { type: DataTypes.JSONB, defaultValue: {} },
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
  open_rate: {
    type: DataTypes.VIRTUAL,
    get() {
      const delivered = Number(this.getDataValue('delivered') || 0);
      const opensU = Number(this.getDataValue('opens_unique') || 0);
      return delivered > 0 ? opensU / delivered : 0;
    }
  },
  click_rate: {
    type: DataTypes.VIRTUAL,
    get() {
      const delivered = Number(this.getDataValue('delivered') || 0);
      const clicksU = Number(this.getDataValue('clicks_unique') || 0);
      return delivered > 0 ? clicksU / delivered : 0;
    }
  },
}, {
  sequelize,
  modelName: 'CampaignChannel',
  tableName: 'campaign_channels',
  timestamps: false,
  indexes: [
    { fields: ['campaign_id'] },
    { fields: ['campaign_id', 'channel'] },
    { fields: ['channel'] },
  ],
});

module.exports = CampaignChannel;
