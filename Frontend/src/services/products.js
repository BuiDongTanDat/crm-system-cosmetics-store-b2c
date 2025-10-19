// src/services/products.js
import { request } from '@/utils/api';

export const getProducts      = ()           => request('/product', { method: 'GET' });
export const getProduct       = (id)         => request(`/product/${id}`, { method: 'GET' });
export const createProduct    = (payload)    => request('/product', { method: 'POST', body: payload });
export const updateProduct    = (id, payload)=> request(`/product/${id}`, { method: 'PUT', body: payload });
export const deleteProduct    = (id)         => request(`/product/${id}`, { method: 'DELETE' });
