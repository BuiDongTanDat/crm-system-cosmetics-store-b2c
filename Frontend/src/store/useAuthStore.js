// stores/authStore.js
import { create } from 'zustand';
import { toast } from 'sonner';
import * as authService from '@/services/auth';
import { authMe } from '@/services/users';

export const useAuthStore = create(
  (set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    setAccessToken: (accessToken) => set({ accessToken }),
    setUser: (user) => set({ user }),
    clearState: () => set({ accessToken: null, user: null, loading: false }),
    // Hàm đăng nhập
    signIn: async (email, password) => {
      try {
        set({ loading: true });

        //Call api đăng nhập
        const { token} = await authService.login(email, password);
        get().setAccessToken(token);

        await get().fetchMe();
        console.log('User after login:', get().user);
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
        get().clearState();
        await authService.logout();
        toast.success('Đăng xuất thành công!');
      } catch (error) {
        toast.error(error.message || 'Đăng xuất thất bại.');
      } finally {
        set({ loading: false });
      }
    },


    fetchMe: async () => {
      try {
        set({ loading: true });
        const user = await authMe(); // From user service
        set({ user }); // cập nhật isAuthenticated
      } catch (error) {
        console.error('Fetch me failed', error);
        set({ user: null, accessToken: null });
        toast.error(error.message || 'Lấy thông tin người dùng thất bại. Vui lòng thử lại.');
      } finally {
        set ({loading: false});
      }
    },

    // Hàm làm mới access token
    refresh: async () => {
      try {
        set({ loading: true });
        const data = await authService.refreshAccessToken();
        if (data?.token) {
          get().setAccessToken(data.token);
          await get().fetchMe();
          return true;
        }

        return false;
      } catch (err) {
        //console.warn('Refresh token failed', err.message);
        set({ accessToken: null, user: null, isAuthenticated: false });
        return false;
      }
      finally {
        set({loading: false});
      }
    },

  }),
);
