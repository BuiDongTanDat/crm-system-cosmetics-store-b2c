// backend/src/Domain/Entities/LeadInterest.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class LeadInterest extends Model { }

LeadInterest.init(
  {
    lead_interest_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Lead quan tâm sản phẩm nào',
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Sản phẩm được quan tâm',
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên sản phẩm (denormalized)',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'liked',
      validate: {
        isIn: [['liked', 'removed', 'ordered']],
      },
    },
    first_interested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_interested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    interest_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'web',
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    removed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'user_id nếu biết ai tạo/ghi nhận interest',
    },
  },
  {
    sequelize,
    modelName: 'LeadInterest',
    tableName: 'lead_interests',
    timestamps: false,
    underscored: true,

    indexes: [
      { unique: true, fields: ['lead_id', 'product_id'] },

      // query nhanh theo lead hoặc product
      { fields: ['lead_id'] },
      { fields: ['product_id'] },
      { fields: ['status'] },
      { fields: ['last_interested_at'] },
    ],
  }
);

module.exports = LeadInterest;
