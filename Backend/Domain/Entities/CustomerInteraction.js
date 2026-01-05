// backend/src/Domain/Entities/CustomerInteraction.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class CustomerInteraction extends Model {}

CustomerInteraction.init(
  {
    interaction_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'customers', key: 'customer_id' },
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
    modelName: 'CustomerInteraction',
    tableName: 'customer_interactions',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['customer_id', 'occurred_at'] },
      { fields: ['type'] },
    ],
  }
);

module.exports = CustomerInteraction;
