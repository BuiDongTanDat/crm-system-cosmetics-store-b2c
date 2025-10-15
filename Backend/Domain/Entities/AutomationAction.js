const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class AutomationAction extends Model {
  // ===== Domain logic =====
  markSent(timestamp = null) {
    this.status = 'sent';
    this.executed_at = timestamp || new Date();
  }

  markFailed(reason = null) {
    this.status = 'failed';
    if (reason) {
      const content = this.content || {};
      content._last_error = reason;
      this.content = content;
    }
  }

  toJSON() {
    return {
      action_id: this.action_id,
      trigger_id: this.trigger_id,
      flow_id: this.flow_id,
      action_type: this.action_type,
      channel: this.channel,
      content: this.content,
      order_index: this.order_index,
      delay_minutes: this.delay_minutes,
      status: this.status,
      executed_at: this.executed_at,
      created_at: this.created_at,
      retry_count: this.retry_count,
      last_retry_at: this.last_retry_at,
    };
  }
}

AutomationAction.init(
  {
    action_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trigger_id: { type: DataTypes.UUID, allowNull: true },
    flow_id: { type: DataTypes.UUID, allowNull: true },
    // "email", "sms", "push", "tag_update", "create_task", ...
    action_type: { type: DataTypes.STRING, allowNull: false },
    // e.g. "email", "sms", "zalo"
    channel: { type: DataTypes.STRING, allowNull: true },
    // JSON content (subject/body/template id/params)
    content: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    delay_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },

    executed_at: { type: DataTypes.DATE, allowNull: true },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    retry_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    last_retry_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'AutomationAction',
    tableName: 'automation_actions',
    timestamps: false,     // đã có created_at custom
    underscored: true,     // đồng bộ snake_case như Product
  }
);

module.exports = AutomationAction;
