const NotificationRepository = require('../../Infrastructure/Repositories/NotificationRepository');
const {getIO} = require('../../Infrastructure/Socket/SocketSetup');

class NotificationService {
    // Gửi thông báo mới và phát qua socket.io
    async sendNotification(notificationData) {
        // Tạo thông báo mới trong cơ sở dữ liệu
        const notification = await NotificationRepository.create(notificationData);
        // Phát thông báo qua socket.io
        const io = getIO();
        io.emit('new_notification', notification);
        //console.log('Đã emit new_notification qua socket:', notification);
        return notification;
    }

    // Lấy tất cả thông báo (Kèm số lượng nếu muốn)
    async getAllNotifications(limit) {
        return await NotificationRepository.getAllOrdered(limit);
    }

    // Lấy tất cả thông báo kèm trạng thái dựa theo userId
    async getAllNotificationsWithStatus(userId, limit) {
        // Lấy tất cả thông báo
        const notifications = await NotificationRepository.getAllOrdered(limit);

        // Map thêm trường trạng thái seen và read vào mỗi thông báo dựa trên userId
        return notifications.map(notification => {
            const isSeen = notification.seen_by.includes(userId);
            const isRead = notification.read_by.includes(userId);
            return {
                ...notification.toJSON(),
                isSeen,
                isRead,
            };
        });
    }

    // Đánh dấu thông báo đã seen bởi user
    async markAsSeen(notificationId, userId) {
        const notification = await NotificationRepository.getById(notificationId);
        if (!notification) {
            throw new Error('Thông báo không tồn tại');
        }
        // Cập nhật danh sách người đã seen
        const seenBy = new Set(notification.seen_by);
        seenBy.add(userId);
        notification.seen_by = Array.from(seenBy);
        await notification.save();
        return notification;
    }

    // Đánh dấu thông báo đã đọc bởi user
    async markAsRead(notificationId, userId) {
        const notification = await NotificationRepository.getById(notificationId);
        if (!notification) {
            throw new Error('Thông báo không tồn tại');
        }
        // Cập nhật danh sách người đã đọc
        const readBy = new Set(notification.read_by);
        readBy.add(userId);
        notification.read_by = Array.from(readBy);
        await notification.save();
        return notification;
    }


}


module.exports = new NotificationService();