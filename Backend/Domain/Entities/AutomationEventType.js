const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class AutomationEventType extends Model {
  toJSON() {
    return {
      event_type: this.event_type,
      name: this.name,
      description: this.description,
      payload_schema: this.payload_schema,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

AutomationEventType.init(
  {
    // PK as string: "lead.created", "order.paid", ...
    event_type: { type: DataTypes.STRING, primaryKey: true, allowNull: false },

    name: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },

    // JSON Schema-like or your own schema format
    payload_schema: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },

    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'AutomationEventType',
    tableName: 'automation_event_types',
    timestamps: false,
    underscored: true,
  }
);

module.exports = AutomationEventType;