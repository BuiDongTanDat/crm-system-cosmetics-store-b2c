const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Lead extends Model {
  // Bạn có thể dùng this.update({ status: ... }) thay cho method này
  updateStatus(newStatus) {
    this.status = newStatus;
  }
}

Lead.init(
  {
    lead_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // portable, không cần hàm Postgres
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'customer_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Inbound',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'new',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    lead_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    conversion_prob: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'campaigns', key: 'campaign_id' },
      onDelete: 'SET NULL'
    },
    product_interest: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Sản phẩm mà lead quan tâm',
    },
    deal_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên deal, mặc định lấy theo tên chiến dịch',
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'SET NULL',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    predicted_prob: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    last_predicted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    predicted_value: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0,
      comment: 'Giá trị doanh thu tiềm năng mà lead có thể mang lại',
    },
    predicted_value_currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'VND',
      comment: 'Đơn vị tiền tệ cho predicted_value',
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'urgent']],
      },
    },
  },
  {
    sequelize,
    modelName: 'Lead',
    tableName: 'leads',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Lead;
