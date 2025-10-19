// backend/src/Domain/Entities/Campaign.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Campaign extends Model {}

Campaign.init({
  campaign_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  channel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  budget: {
    type: DataTypes.FLOAT,
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
  },
  data_source: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft',
  },
  owner_employee_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
    onDelete: 'SET NULL',
  },
  expected_kpi: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Campaign',
  tableName: 'campaigns',
  timestamps: false,
});

module.exports = Campaign;
