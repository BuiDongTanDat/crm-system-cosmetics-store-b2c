const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Product extends Model {
  // ---------------- NGHIỆP VỤ ----------------

  // Giảm tồn kho
  reduceInventory(quantity) {
    if (this.inventory_qty < quantity) {
      throw new Error('Not enough stock');
    }
    this.inventory_qty -= quantity;
  }

  // Tăng tồn kho
  increaseInventory(quantity) {
    this.inventory_qty += quantity;
  }

  // Áp dụng khuyến mãi (%)
  applyPromo(discountPercent) {
    this.price = this.price * (1 - discountPercent / 100);
  }
}

// ---------------- MAPPING DB ----------------
Product.init({
  product_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, allowNull: false },
  promo: { type: DataTypes.JSONB, defaultValue: {} },
  inventory_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  images: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  timestamps: true,
  underscored: true,
});

module.exports = Product;
