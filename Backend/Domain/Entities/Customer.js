const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Customer extends Model {
  // ---------------- NGHIỆP VỤ ----------------

  // Cập nhật thông tin khách hàng
  updateInfo(data) {
    Object.assign(this, data);
    this.updated_at = new Date();
  }

  // Thêm tag
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  // Xóa tag
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  // Thêm kênh xã hội
  addSocialChannel(platform, account) {
    this.social_channels = this.social_channels || {};
    this.social_channels[platform] = account;
  }

  // Loại bỏ kênh xã hội
  removeSocialChannel(platform) {
    if (this.social_channels) {
      delete this.social_channels[platform];
    }
  }
}

// ---------------- MAPPING DB ----------------
Customer.init({
  customer_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  full_name: { type: DataTypes.STRING, allowNull: false },
  customer_type: { type: DataTypes.STRING }, // VIP, Regular, etc.
  birth_date: { type: DataTypes.DATE },
  gender: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  phone: { type: DataTypes.STRING, unique: true },
  address: { type: DataTypes.TEXT },
  social_channels: { type: DataTypes.JSONB, defaultValue: {} },
  source: { type: DataTypes.STRING }, // nguồn khách hàng
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  notes: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: 'Customer',
  tableName: 'customers',
  timestamps: true,
  underscored: true,
});

module.exports = Customer;
