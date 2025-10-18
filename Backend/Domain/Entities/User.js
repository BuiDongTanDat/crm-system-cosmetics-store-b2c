// backend/src/Domain/Entities/User.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class User extends Model {
  activate() {
    this.status = 'active';
  }
  deactivate() {
    this.status = 'inactive';
  }
}

User.init(
  {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,                 // đảm bảo không trùng email
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,                 // có thể bỏ nếu muốn cho phép trùng
    },
    role_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',         // bạn có thể đổi thành 'admin'/'staff' tùy hệ thống
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',       // 'active' | 'inactive' | ...
    },
    // created_at / updated_at sẽ do timestamps quản lý
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,               // tự tạo created_at, updated_at
    underscored: true,              // dùng snake_case cho cột
    indexes: [
      { fields: ['full_name'] },
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['phone'] },
    ],
  }
);

module.exports = User;
