import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create((set, get) => ({
    socket: null,
    connectSocket: () => {
        const accessToken = useAuthStore.getState().accessToken;
        const existingSocket = get().socket;

        if (existingSocket) return; // Tránh tạo nhiều kết nối.
        
        // Tạo kết nối socket.io với token xác thực
        const socket = io(baseURL, {
            auth: { token: accessToken },
            transports: ['websocket'],
        });

        set({ socket: socket });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connect error:', err);
        });
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null });
            console.log('Socket disconnected');
        }
    },
}));