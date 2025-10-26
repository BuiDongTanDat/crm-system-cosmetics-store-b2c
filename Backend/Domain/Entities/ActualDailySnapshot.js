const { DataTypes, Model } = require('sequelize');
const DataManager = require('../../Infrastructure/database/postgres');
const sequelize = DataManager.getSequelize();

class ActualDailySnapshot extends Model {
    toJSON() {
        return {
            snapshot_id: this.snapshot_id,
            snapshot_date: this.snapshot_date,
            total_deals: this.total_deals,
            total_value: this.total_value,
            active_deals: this.active_deals,
            converted_deals: this.converted_deals,
            lost_deals: this.lost_deals,
            actual_conversion_rate: this.actual_conversion_rate,
            by_status: this.by_status,
            by_channel: this.by_channel,
            metadata: this.metadata,
            created_at: this.created_at,
        };
    }
}

ActualDailySnapshot.init(
    {
        snapshot_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },

        // Ngày snapshot (YYYY-MM-DD)
        snapshot_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            unique: true, // mỗi ngày chỉ có một snapshot
        },

        // Tổng số lead/deal
        total_deals: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        // Tổng giá trị dự đoán (hoặc thực tế nếu có)
        total_value: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },

        // Số deal đang hoạt động
        active_deals: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        // Số deal đã chuyển đổi thành công
        converted_deals: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        // Số deal bị mất
        lost_deals: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        // Tỷ lệ chuyển đổi thực tế (%)
        actual_conversion_rate: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0,
        },

        // Dữ liệu chi tiết theo trạng thái (JSON)
        by_status: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },

        // Dữ liệu chi tiết theo kênh, chiến dịch (JSON)
        by_channel: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },

        // Metadata phụ: ví dụ người chạy job, nguồn dữ liệu, version…
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },

        // Thời gian tạo snapshot
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'ActualDailySnapshot',
        tableName: 'actual_daily_snapshots',
        timestamps: false,
        underscored: true,
    }
);

module.exports = ActualDailySnapshot;
