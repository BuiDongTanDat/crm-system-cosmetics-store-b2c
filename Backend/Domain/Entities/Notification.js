const { Model, DataTypes } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Notification extends Model {}

Notification.init(
  {
    notification_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Nếu là null thì có thể hiểu là thông báo cho TOÀN BỘ hệ thống
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, 
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Lưu danh sách ID những người đã đọc (Đánh dấu là đã đọc)
    read_by: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    // Lưu danh sách ID những người đã thấy thông báo (seen)
    seen_by: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    type: {
      type: DataTypes.STRING, // 'SYSTEM', 'ORDER', 'PROMOTION'
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB, // Chứa link, icon, hoặc ID vật thể liên quan
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true, // Đã tự động có created_at (ngày khởi tạo)
    underscored: true,
  }
);

module.exports = Notification;