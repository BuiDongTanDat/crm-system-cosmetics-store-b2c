import { request } from '@/utils/api';

// Lấy tất cả role
export const getRoles = () => request('/roles', { method: 'GET' });

// Lấy role theo role_name
export const getRoleByName = (role_name) => request(`/roles/${role_name}`, { method: 'GET' });

// Tạo mới role
export const createRole = (payload) => request('/roles', { method: 'POST', body: payload });

// Cập nhật role theo role_name
export const updateRole = (role_name, payload) => request(`/roles/${role_name}`, { method: 'PUT', body: payload });

// Xóa role theo role_name
export const deleteRole = (role_name) => request(`/roles/${role_name}`, { method: 'DELETE' });
