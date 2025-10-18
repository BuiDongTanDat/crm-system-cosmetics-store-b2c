// backend/src/Domain/Entities/LeadStatusHistory.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class LeadStatusHistory extends Model {}

LeadStatusHistory.init(
  {
    id: {
      type: DataTypes.BIGINT, // BIGINT trong Postgres sẽ trả về dạng string
      primaryKey: true,
      autoIncrement: true,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'leads', key: 'lead_id' },
      onDelete: 'CASCADE',
    },
    from_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    to_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changed_by: {
      type: DataTypes.UUID, 
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'SET NULL',
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'LeadStatusHistory',
    tableName: 'lead_status_history',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['lead_id'] },
      { fields: ['changed_at'] },
    ],
  }
);

module.exports = LeadStatusHistory;
