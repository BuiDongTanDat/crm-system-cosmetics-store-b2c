import { request } from '@/utils/api';

// Lấy tất cả user
export const getUsers = () => request('/users', { method: 'GET' });

// Lấy user theo id
export const getUserById = (id) => request(`/users/${id}`, { method: 'GET' });

// Tạo mới user
export const createUser = (payload) => request('/users', { method: 'POST', body: payload });

// Cập nhật user theo id
export const updateUser = (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload });

// Xóa user theo id
export const deleteUser = (id) => request(`/users/${id}`, { method: 'DELETE' });

// Kích hoạt user
export const activateUser = (id) => request(`/users/${id}/activate`, { method: 'PUT' });

// Hủy kích hoạt user
export const deactivateUser = (id) => request(`/users/${id}/deactivate`, { method: 'PUT' });

// Lấy thông tin user đã xác thực (đang đăng nhập)
export const authMe = () => request('/users/me/info', { method: 'GET' });

// Thay đổi mật khẩu
export const changePassword = async (oldPassword, newPassword) => {
    return request('/users/me/change-password', {
        method: 'POST',
        body: { oldPassword, newPassword },
    });
};

// Cập nhật avatar cho user đã xác thực (đang đăng nhập)
export const updateAvatar = (formData) =>
    request('/users/me/change-avatar', {
        method: 'POST',
        body: formData,
        isFormData: true // <- thêm flag để request biết đây là FormData
    });

