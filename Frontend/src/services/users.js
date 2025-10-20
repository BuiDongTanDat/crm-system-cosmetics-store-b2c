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
