import { request } from '@/utils/api';

// Xử lý đăng nhập
export const login = async (email, password) => {
    return request('/auth/login', {
        method: 'POST',
        body: { email, password },
        isPublicRoute: true,
    });
};

// Xử lý đăng xuất
export const logout = async () => {
    return request('/auth/logout', {
        method: 'POST',
        isPublicRoute: true,
    });
};

// Lấy access token mới bằng refresh token (lưu trong cookie)
export const refreshAccessToken = async () => {
    return request('/auth/refresh-token', {
        method: 'POST',
        isPublicRoute: true,
    });
};

// Gửi email đặt lại mật khẩu
export const forgotPassword = async (email) => {
    return request('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        isPublicRoute: true,
    });
};

// Đặt lại mật khẩu
export const resetPassword = async (token, newPassword) => {
    return request('/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword },
        isPublicRoute: true,
    });
};