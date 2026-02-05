const NotificationService = require('../../Application/Services/NotificationService')

class NotificationController {
    // Gửi thông báo mới
    async sendNotification(req, res) {
        try {
            const notificationData = req.body;
            const notification = await NotificationService.sendNotification(notificationData);
            res.status(201).json(notification);
        } catch (error) {
            console.error('Lỗi khi gửi thông báo:', error);
            res.status(500).json({ error: 'Lỗi máy chủ khi gửi thông báo' });
        }
    }
    // Lấy tất cả thông báo
    async getAllNotifications(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : null;
            const notifications = await NotificationService.getAllNotifications(limit);
            res.json(notifications);
        } catch (error) {
            console.error('Lỗi khi lấy thông báo:', error);
            res.status(500).json({ error: 'Lỗi máy chủ khi lấy thông báo' });
        }
    }

    // Lấy tất cả thông báo kèm trạng thái seen/read theo user
    async getAllNotificationsWithStatus(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : null;
            const userId = req.user.user_id;
            const notifications = await NotificationService.getAllNotificationsWithStatus(userId, limit);
            res.json(notifications);
        } catch (error) {

            console.error('Lỗi khi lấy thông báo với trạng thái cho userId', userId, ':', error);
        }
    }


    // Đánh dấu thông báo đã seen
    async markAsSeen(req, res) {
        try {
            const notificationId = req.params.id;
            const userId = req.user.user_id;
            console.log('User ID đánh dấu seen:', userId);
            const notification = await NotificationService.markAsSeen(notificationId, userId);
            res.json(notification);
        } catch (error) {
            console.error('Lỗi khi đánh dấu thông báo đã seen:', error);
            res.status(500).json({ error: 'Lỗi máy chủ khi đánh dấu thông báo đã seen' });
        }
    }

    // Đánh dấu thông báo đã read
    async markAsRead(req, res) {
        try {
            const notificationId = req.params.id;
            const userId = req.user.user_id;

            const notification = await NotificationService.markAsRead(notificationId, userId);
            res.json(notification);
        } catch (error) {
            console.error('Lỗi khi đánh dấu thông báo đã read:', error);
            res.status(500).json({ error: 'Lỗi máy chủ khi đánh dấu thông báo đã read' });
        }
    }
}
module.exports = new NotificationController();