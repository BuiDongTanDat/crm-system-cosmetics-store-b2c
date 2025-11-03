const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class Order extends Model {
    updateStatus(newStatus) {
        this.status = newStatus;
        this.updated_at = new Date();
    }

    // helper để thêm item (không tạo bản ghi DB tự động, chỉ thao tác instance)
    addItem(item) {
        if (!Array.isArray(this.items)) this.items = [];
        this.items.push(item);
    }

    toJSON() {
        // ...existing fields...
        return {
            order_id: this.order_id,
            customer_id: this.customer_id,
            order_date: this.order_date,
            total_amount: this.total_amount,
            currency: this.currency,
            payment_method: this.payment_method,
            status: this.status,
            channel: this.channel,
            ai_suggested_crosssell: this.ai_suggested_crosssell,
            notes: this.notes,
            created_at: this.created_at,
            updated_at: this.updated_at,
            items: this.items ?? undefined,
        };
    }
}

Order.init(
    {
        order_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        customer_id: { type: DataTypes.UUID, allowNull: false },
        order_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        total_amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
        currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'VND' },
        payment_method: {
            type: DataTypes.ENUM(
                'credit_card',
                'paypal',
                'bank_transfer',
                'cash_on_delivery'
            ), allowNull: false,
            defaultValue: 'cash_on_delivery',
        },
        status: {
            type: DataTypes.ENUM(
                'draft_cart',
                'awaiting_customer_confirmation',
                'paid',
                'pending',
                'cancelled',
                'refunded',
                'failed',
                'processing',
                'shipped',
                'completed'
            ),
            allowNull: false,
            defaultValue: 'paid',
        },
        channel: { type: DataTypes.STRING, allowNull: true },
        ai_suggested_crosssell: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
        notes: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['customer_id'] },
            { fields: ['status'] },
            { fields: ['order_date'] },
        ],
    }
);

// Removed Sequelize associations: Order.hasMany / Order.belongsTo removed per request.
module.exports = Order;


