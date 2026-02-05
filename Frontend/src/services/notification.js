import { request } from '@/utils/api';

// Lấy danh sách thông báo
export const getNotifications = () =>
    request('/notifications', {
        method: 'GET',
    });

// Lấy danh sách thông báo với trạng thái seen/read
export const getNotificationsWithStatus = () =>
    request('/notifications/with-status', {
        method: 'GET',
    });

// Đánh dấu thông báo đã seen
export const markNotificationAsSeen = (notificationId) =>
    request(`/notifications/mark-as-seen/${notificationId}`, {
        method: 'PATCH',
    });

// Đánh dấu thông báo đã read
export const markNotificationAsRead = (notificationId) =>
    request(`/notifications/mark-as-read/${notificationId}`, {
        method: 'PATCH',
    });