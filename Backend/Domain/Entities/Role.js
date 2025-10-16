// backend/src/Domain/Entities/Role.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Role extends Model {
  hasPermission(permission) {
    if (!Array.isArray(this.permissions)) return false;
    return this.permissions.includes(permission);
  }
}

Role.init(
  {
    role_name: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING), // mảng quyền, ví dụ: ["read", "write"]
      allowNull: false,
      defaultValue: [],
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
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Role;
