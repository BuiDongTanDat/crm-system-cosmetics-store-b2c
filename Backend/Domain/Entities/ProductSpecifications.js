const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class ProductSpecification extends Model {}

ProductSpecification.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  product_id: { type: DataTypes.UUID, allowNull: false },
  barcode: { type: DataTypes.STRING },
  brand_origin: { type: DataTypes.STRING },
  made_in: { type: DataTypes.STRING },
  property: { type: DataTypes.STRING },
  volume: { type: DataTypes.STRING },
}, {
  sequelize,
  modelName: 'ProductSpecification',
  tableName: 'product_specifications',
  timestamps: false,
});

module.exports = ProductSpecification;
