// src/services/categories.js
import { request } from '@/utils/api';

//  Lấy tất cả category
export const getCategories = () => request('/categories', { method: 'GET' });
// Lấy category theo id
export const getCategory = (id) => request(`/categories/${id}`, { method: 'GET' });
// Tạo mới category 
export const createCategory = (payload) => request('/categories', { method: 'POST', body: payload });
// Cập nhật category theo id 
export const updateCategory = (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: payload });
// Xóa category theo id 
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' });
