const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();
const { DataTypes } = require('sequelize');

const CampaignChannelFlow = sequelize.define(
  'CampaignChannelFlow',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaign_id: { type: DataTypes.UUID, allowNull: false },
    channel_id: { type: DataTypes.UUID, allowNull: false },
    flow_id: { type: DataTypes.UUID, allowNull: false },
    order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'campaign_channel_flows',
    underscored: true,
    timestamps: true,
  }
);

module.exports = CampaignChannelFlow;
