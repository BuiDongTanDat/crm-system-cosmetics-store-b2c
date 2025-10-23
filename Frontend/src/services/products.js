// src/services/products.js
import { request } from '@/utils/api';

// Lấy tất cả sản phẩm
export const getProducts = () => request('/products', { method: 'GET' });

// Lấy sản phẩm theo id
export const getProduct = (id) => request(`/products/${id}`, { method: 'GET' });

// Tạo mới sản phẩm
export const createProduct = (payload) => request('/products', { method: 'POST', body: payload });

// Cập nhật sản phẩm theo id
export const updateProduct = (id, payload) => request(`/products/${id}`, { method: 'PUT', body: payload });

// Xóa sản phẩm theo id
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });
