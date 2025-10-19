// src/services/categories.js
import { request } from '@/utils/api';

export const getCategories    = ()           => request('/category', { method: 'GET' });
export const getCategory      = (id)         => request(`/category/${id}`, { method: 'GET' });
export const createCategory   = (payload)    => request('/category', { method: 'POST', body: payload });
export const updateCategory   = (id, payload)=> request(`/category/${id}`, { method: 'PUT', body: payload });
export const deleteCategory   = (id)         => request(`/category/${id}`, { method: 'DELETE' });
