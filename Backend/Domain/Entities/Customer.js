// backend/src/Domain/Entities/Customer.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Customer extends Model {
  // ---------- Domain helpers ----------
  updateInfo(data) {
    Object.assign(this, data);
    // updated_at sẽ được Sequelize cập nhật khi .save()
  }

  addTag(tag) {
    const list = Array.isArray(this.tags) ? this.tags : [];
    if (!list.includes(tag)) {
      list.push(tag);
      this.tags = list;
    }
  }

  removeTag(tag) {
    const list = Array.isArray(this.tags) ? this.tags : [];
    this.tags = list.filter((t) => t !== tag);
  }

  addSocialChannel(platform, account) {
    const sc = this.social_channels ?? {};
    sc[platform] = account;
    this.social_channels = sc;
  }

  removeSocialChannel(platform) {
    const sc = this.social_channels ?? {};
    if (Object.prototype.hasOwnProperty.call(sc, platform)) {
      delete sc[platform];
      this.social_channels = sc;
    }
  }

  toJSON() {
    return {
      customer_id: this.customer_id,
      full_name: this.full_name,
      customer_type: this.customer_type,
      birth_date: this.birth_date,
      gender: this.gender,
      email: this.email,
      phone: this.phone,
      address: this.address,
      social_channels: this.social_channels,
      source: this.source,
      tags: this.tags,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

Customer.init(
  {
    customer_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birth_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // Postgres cho phép nhiều NULL trong unique
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    social_channels: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // created_at / updated_at sẽ tự tạo do timestamps: true + underscored: true
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true,
    underscored: true, // -> created_at, updated_at
    indexes: [
      // Tùy chọn: thêm index để search
      { fields: ['full_name'] },
      { fields: ['email'] },
      { fields: ['phone'] },
    ],
  }
);

module.exports = Customer;
