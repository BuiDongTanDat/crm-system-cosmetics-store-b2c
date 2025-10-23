const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class OrderDetail extends Model {
  // Trả về line total (giả sử discount là tỉ lệ 0..1)
  getLineTotal() {
    const unit = parseFloat(this.price_unit || 0);
    const qty = Number(this.quantity || 0);
    const disc = parseFloat(this.discount || 0);
    const gross = unit * qty;
    const net = gross * (1 - disc);
    // giữ cùng kiểu DECIMAL/number caller mong đợi (đây trả number)
    return Math.max(0, net);
  }

  toJSON() {
    return {
      order_detail_id: this.order_detail_id,
      order_id: this.order_id,
      product_id: this.product_id,
      quantity: this.quantity,
      price_unit: this.price_unit,
      discount: this.discount,
      line_total: this.getLineTotal(),
      created_at: this.created_at,
    };
  }
}

OrderDetail.init(
  {
    order_detail_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: { type: DataTypes.UUID, allowNull: false },
    product_id: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    price_original: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.0 },
    price_unit: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    // Nếu discount là tỉ lệ phần trăm 0..1 -> DECIMAL(5,4)
    discount: { type: DataTypes.DECIMAL(5, 4), allowNull: false, defaultValue: 0.0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'OrderDetail',
    tableName: 'order_details',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['product_id'] },
    ],
  }
);

module.exports = OrderDetail;
