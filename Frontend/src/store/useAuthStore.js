// stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import * as authService from '@/services/auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      isAuthenticated: false,

      // Hàm đăng nhập
      signIn: async (email, password) => {
        try {
          set({ loading: true });
          const data = await authService.login(email, password);

          // cập nhật cả accessToken, user và isAuthenticated
          set({ accessToken: data.token, user: data.user, isAuthenticated: true });
          toast.success('Đăng nhập thành công!');
          return true;
        } catch (error) {
          toast.error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
          throw error; // ném lỗi
        } finally {
          set({ loading: false });
        }
      },

      // Hàm đăng xuất
      signOut: async () => {
        try {
          set({ loading: true });
          await authService.logout();
          set({ accessToken: null, user: null, isAuthenticated: false }); // cập nhật isAuthenticated
          toast.success('Đăng xuất thành công!');
        } catch (error) {
          toast.error(error.message || 'Đăng xuất thất bại.');
        } finally {
          set({ loading: false });
        }
      },

      // Hàm làm mới access token
      refreshSession: async () => {
        try {
          const data = await authService.refreshAccessToken();
          if (data?.token) {
            set({ accessToken: data.token, isAuthenticated: true }); // cập nhật isAuthenticated
            return true;
          }
          // nếu không có token thì reset state
          set({ accessToken: null, user: null, isAuthenticated: false });
          return false;
        } catch (err) {
          //console.warn('Refresh token failed', err.message);
          set({ accessToken: null, user: null, isAuthenticated: false });
          return false;
        }
      },

      setAccessToken: (token) => {
        set({ accessToken: token, isAuthenticated: !!token });
      },

      setUser: (user) => {
        // Hỗ trợ cả setUser(object) và setUser(prev => ({ ...prev, ...modified }))
        set((state) => {
          const newUser = typeof user === 'function' ? user(state.user) : user;
          return { user: newUser };
        });
      }

      // Kiểm tra xem đã đăng nhập chưa (bỏ hàm, giữ boolean trong state)
      // isAuthenticated: () => !!get().accessToken
    }),
    {
      name: 'auth-storage', // key lưu trong localStorage
      getStorage: () => localStorage,
    }
  )
);
