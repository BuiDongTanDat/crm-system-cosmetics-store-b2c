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
  },
  {
    sequelize,
    modelName: 'Lead',
    tableName: 'leads',
    timestamps: false,   // nếu muốn có updated_at thì chuyển sang true và map lại tên cột
    underscored: true,
  }
);

module.exports = Lead;
