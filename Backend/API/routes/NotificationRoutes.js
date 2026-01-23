const express = require('express');
const NotificationController = require('../Controller/NotificationController');

const protectedRoute = require('../Middleware/authMiddleware');

const router = express.Router();

router.use(protectedRoute);
router.post('/', NotificationController.sendNotification);
router.get('/', NotificationController.getAllNotifications);
router.get('/with-status', NotificationController.getAllNotificationsWithStatus);
router.patch('/mark-as-seen/:id', NotificationController.markAsSeen);
router.patch('/mark-as-read/:id', NotificationController.markAsRead);

module.exports = router;
