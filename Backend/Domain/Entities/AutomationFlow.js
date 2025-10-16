// đổi dòng import
const { Sequelize, DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class AutomationFlow extends Model {
  // ===== Domain logic =====
  enable() {
    this.enabled = true;
    this.touch();
  }

  disable() {
    this.enabled = false;
    this.touch();
  }

  addTrigger(triggerId) {
    const triggers = this.triggers || [];
    if (!triggers.includes(triggerId)) triggers.push(triggerId);
    this.triggers = triggers;
    this.touch();
  }

  addAction(actionId) {
    const actions = this.actions || [];
    if (!actions.includes(actionId)) actions.push(actionId);
    this.actions = actions;
    this.touch();
  }

  touch() {
    this.updated_at = new Date();
  }

  toJSON() {
    return {
      flow_id: this.flow_id,
      name: this.name,
      description: this.description,
      status: this.status,
      tags: this.tags,
      enabled: this.enabled,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
      triggers: this.triggers,
      actions: this.actions,
    };
  }
}

AutomationFlow.init(
  {
    flow_id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    status:{
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    tags:{
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull:false,
      defaultValue:[],
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    triggers: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: [],
    },
    actions: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    sequelize,
    modelName: 'AutomationFlow',
    tableName: 'automation_flows',
    timestamps: true,
    underscored: true,      
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = AutomationFlow;
