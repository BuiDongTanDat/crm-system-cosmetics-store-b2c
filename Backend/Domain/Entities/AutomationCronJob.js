// backend/src/Domain/Entities/AutomationCronJob.js
const { DataTypes } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();// chỉnh theo dự án bạn

const AutomationCronJob = sequelize.define(
  'AutomationCronJob',
  {
    cron_job_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    job_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cron_expr: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Asia/Ho_Chi_Minh',
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'automation_cron_jobs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = AutomationCronJob;
