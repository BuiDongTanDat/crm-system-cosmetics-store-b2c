const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class AutomationTrigger extends Model {
  // ===== Domain logic =====
  activate() {
    this.is_active = true;
  }

  deactivate() {
    this.is_active = false;
  }

  updateConditions(newConditions) {
    this.conditions = newConditions || {};
  }

  matchesEvent(event) {
    //Matcher logic cơ bản, có thể mở rộng sau
    if (!this.is_active) return false;
    if (this.event_type && this.event_type !== event.type) return false;
    // TODO: parse thêm điều kiện phức tạp (JSON logic)
    return true;
  }

  toJSON() {
    return {
      trigger_id: this.trigger_id,
      flow_id: this.flow_id,
      event_type: this.event_type,
      conditions: this.conditions,
      is_active: this.is_active,
      created_at: this.created_at,
    };
  }
}

AutomationTrigger.init(
  {
    trigger_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    flow_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    event_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Ví dụ: order_completed, cart_abandoned, birthday...',
    },
    conditions: {
      type: DataTypes.JSONB, // PostgreSQL: JSONB, MySQL thì dùng JSON
      allowNull: true,
      defaultValue: {},
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AutomationTrigger',
    tableName: 'automation_triggers',
    timestamps: false,
    underscored: true,
  }
);

module.exports = AutomationTrigger;
