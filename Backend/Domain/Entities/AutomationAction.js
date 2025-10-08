// backend/src/Domain/Entities/AutomationAction.js

const { DataTypes } = require("sequelize");
const mongoose = require("mongoose");

class AutomationAction {
  constructor({
    action_id,
    trigger_id = null,
    flow_id = null,
    action_type,        // "email", "sms", "push", "tag_update", "create_task"
    channel = null,     // e.g. "email", "sms", "zalo"
    content = {},       // JSON content (subject/body/template id/params)
    delay_minutes = 0,
    status = "pending", // pending, sent, failed
    executed_at = null,
    created_at = null,
  } = {}) {
    this.action_id = action_id;
    this.trigger_id = trigger_id;
    this.flow_id = flow_id;
    this.action_type = action_type;
    this.channel = channel;
    this.content = content || {};
    this.delay_minutes = Number.isFinite(delay_minutes)
      ? delay_minutes
      : parseInt(delay_minutes) || 0;
    this.status = status;
    this.executed_at = executed_at;
    this.created_at = created_at || new Date();
  }

  // ===== Domain logic =====
  markSent(timestamp = null) {
    this.status = "sent";
    this.executed_at = timestamp || new Date();
  }

  markFailed(reason = null) {
    this.status = "failed";
    if (reason) this.content._last_error = reason;
  }

  toJSON() {
    return {
      action_id: this.action_id,
      trigger_id: this.trigger_id,
      flow_id: this.flow_id,
      action_type: this.action_type,
      channel: this.channel,
      content: this.content,
      delay_minutes: this.delay_minutes,
      status: this.status,
      executed_at: this.executed_at,
      created_at: this.created_at,
    };
  }

  // ===== ORM Definitions =====
  static definePostgresModel(sequelize) {
    return sequelize.define(
      "AutomationAction",
      {
        action_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        trigger_id: { type: DataTypes.UUID, allowNull: true },
        flow_id: { type: DataTypes.UUID, allowNull: true },
        action_type: { type: DataTypes.STRING, allowNull: false },
        channel: { type: DataTypes.STRING, allowNull: true },
        content: { type: DataTypes.JSONB, defaultValue: {} },
        delay_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: {
          type: DataTypes.ENUM("pending", "sent", "failed"),
          defaultValue: "pending",
        },
        executed_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        tableName: "automation_actions",
        timestamps: false,
      }
    );
  }
}

module.exports = AutomationAction;
