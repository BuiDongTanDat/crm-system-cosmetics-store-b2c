import { create } from 'zustand';
import { getNotificationsWithStatus, markNotificationAsRead } from '@/services/notification';
import { formatDateTime } from '@/utils/helper';
import { useSocketStore } from './useSocketStore';

// Hàm hỗ trợ định dạng notification
const formatNotif = (n) => ({
  id: n.notification_id,
  title: n.title,
  message: n.message,
  time: formatDateTime(n.createdAt),
  read: n.isRead,
  sender: n.user_id || 'Hệ thống',
});

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  socketListening: false, // Thêm biến này

  // Fetch notifications from API
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const data = await getNotificationsWithStatus();
      const notifs = data.map(formatNotif);
      set({ notifications: notifs });
    } catch (err) {
      set({ notifications: [] });
    } finally {
      set({ loading: false });
    }
  },

  // Đánh dấu notification đã đọc
  markAsRead: async (id) => {
    try {
      await markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));
    } catch (err) {
      // handle error if needed
    }
  },

  // Thêm notification mới vào store dựa theo socket event
  addNotification: (notif) => {
    const formatted = formatNotif(notif);
    set((state) => ({
      notifications: [formatted, ...state.notifications]
    }));
  },

  // Lắng nghe sự kiện socket để nhận notification mới
  listenSocket: () => {
    const { socketListening } = get();
    if (socketListening) return; // Đã lắng nghe rồi thì không đăng ký lại

    const { socket } = useSocketStore.getState();
    if (!socket) return;

    const handler = (notif) => get().addNotification(notif);
    socket.on('new_notification', handler);

    set({ socketListening: true });

    // Cleanup function (optional, call on disconnect)
    return () => {
      socket.off('new_notification', handler);
      set({ socketListening: false });
    };
  },
}));
