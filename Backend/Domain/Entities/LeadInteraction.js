// backend/src/Domain/Entities/LeadInteraction.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class LeadInteraction extends Model {}

LeadInteraction.init(
  {
    interaction_id: {
      type: DataTypes.BIGINT, // BIGINT trong Postgres trả về dạng string
      autoIncrement: true,
      primaryKey: true,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'leads', key: 'lead_id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    occurred_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    score_delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_by: {
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
  },
  {
    sequelize,
    modelName: 'LeadInteraction',
    tableName: 'lead_interactions',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['lead_id', 'occurred_at'] },
      { fields: ['type'] },
    ],
  }
);

module.exports = LeadInteraction;
