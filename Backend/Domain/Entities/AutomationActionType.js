const { DataTypes: ADT, Model: AModel } = require('sequelize');
const DataManager2 = require('../../Infrastructure/database/postgres');
const sequelize2 = DataManager2.getSequelize();

class AutomationActionType extends AModel {
  toJSON() {
    return {
      action_type: this.action_type,
      name: this.name,
      description: this.description,
      config_schema: this.config_schema,
      supported_channels: this.supported_channels,
      is_active: this.is_active,
      handler_kind: this.handler_kind,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

AutomationActionType.init(
  {
    action_type: { type: ADT.STRING, primaryKey: true, allowNull: false },
    name: { type: ADT.STRING, allowNull: false, defaultValue: '' },
    description: { type: ADT.TEXT, allowNull: true, defaultValue: '' },
    config_schema: { type: ADT.JSONB, allowNull: false, defaultValue: {} },
    supported_channels: { type: ADT.ARRAY(ADT.TEXT), allowNull: false, defaultValue: [] },
    is_active: { type: ADT.BOOLEAN, allowNull: false, defaultValue: true },
    handler_kind: { type: ADT.ENUM('primitive', 'universal'), allowNull: false, defaultValue: 'primitive' },

    created_at: { type: ADT.DATE, allowNull: false, defaultValue: ADT.NOW },
    updated_at: { type: ADT.DATE, allowNull: false, defaultValue: ADT.NOW },
  },
  {
    sequelize: sequelize2,
    modelName: 'AutomationActionType',
    tableName: 'automation_action_types',
    timestamps: false,
    underscored: true,
  }
);

module.exports = AutomationActionType;