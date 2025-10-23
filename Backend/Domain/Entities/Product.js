const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Product extends Model {
  adjustInventory(amount) {
    this.inventory_qty = Math.max(0, this.inventory_qty + amount);
  }
}

Product.init({
  product_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  brand: { type: DataTypes.STRING },
  short_description: { type: DataTypes.TEXT },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING },
  image: { type: DataTypes.STRING },
  price_current: { type: DataTypes.FLOAT, allowNull: false },
  price_original: { type: DataTypes.FLOAT },
  discount_percent: { type: DataTypes.FLOAT },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  reviews_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  monthly_sales: { type: DataTypes.STRING },
  sell_progress: { type: DataTypes.STRING },
  inventory_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Trạng thái sản phẩm
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'),
    allowNull: false,
    defaultValue: 'AVAILABLE',
  },
  status_updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  timestamps: true,
  underscored: true,
});

module.exports = Product;
