const Notification = require('../../Domain/Entities/Notification');
class NotificationRepository {
    // Lấy tất cả thông báo
    async getAll() {
        return await Notification.findAll();
    }

    //Lấy tất cả thông báo theo thứ tự mới nhất, kèm limit
    async getAllOrdered(limit) {
        if (!limit) {
            return await Notification.findAll({
                order: [['created_at', 'DESC']],
            });
        }
        return await Notification.findAll({
            order: [['created_at', 'DESC']],
            limit,
        });
    }

    // Tạo mới thông báo
    async create(notificationData) {
        return await Notification.create(notificationData);
    }

    // Lấy thông báo theo ID
    async getById(notificationId) {
        return await Notification.findByPk(notificationId);
    }

    // Cập nhật thông báo
    async update(notificationId, notificationData) {
        const notification = await Notification.findByPk(notificationId);
        if (!notification) return null;
        await notification.update(notificationData);
        return notification;
    }

    // Lấy thông báo theo TYPE
    async getByType(type) {
        return await Notification.findAll({
            where: { type },
        });
    }
}

module.exports = new NotificationRepository();