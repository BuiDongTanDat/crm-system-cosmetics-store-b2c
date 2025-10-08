const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Category extends Model {}

Category.init({
  category_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },        // Tên danh mục (VD: "Trang điểm môi")
  description: { type: DataTypes.TEXT },                      // Mô tả chi tiết danh mục
  parent_id: { type: DataTypes.UUID, allowNull: true },       // Dùng cho danh mục cha (nếu có)
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
  },
}, {
  sequelize,
  modelName: 'Category',
  tableName: 'categories',
  timestamps: true,
  underscored: true,
});

module.exports = Category;
