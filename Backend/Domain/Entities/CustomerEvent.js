// backend/src/Domain/Entities/CustomerEvent.js
const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class CustomerEvent extends Model {
  toJSON() {
    return {
      event_id: this.event_id,
      customer_id: this.customer_id,
      session_id: this.session_id,
      product_id: this.product_id,
      event_type: this.event_type,
      event_time: this.event_time,
      metadata: this.metadata,
    };
  }
}

CustomerEvent.init(
  {
    event_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: { type: DataTypes.UUID, allowNull: true },
    session_id: { type: DataTypes.STRING, allowNull: true },
    product_id: { type: DataTypes.UUID, allowNull: true },

    event_type: {
      type: DataTypes.STRING,
      allowNull: false,  // view | add_to_cart | purchase
    },

    event_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'CustomerEvent',
    tableName: 'customer_events',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['product_id'] },
      { fields: ['event_type'] },
      { fields: ['event_time'] },
    ],
  }
);

module.exports = CustomerEvent;
