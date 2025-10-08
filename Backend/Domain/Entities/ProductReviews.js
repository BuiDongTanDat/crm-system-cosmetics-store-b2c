const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class ProductReview extends Model {}

ProductReview.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  product_id: { type: DataTypes.UUID, allowNull: false },
  reviewer: { type: DataTypes.STRING },
  rating: { type: DataTypes.FLOAT },
  comment: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATE },
}, {
  sequelize,
  modelName: 'ProductReview',
  tableName: 'product_reviews',
  timestamps: false,
});

module.exports = ProductReview;
