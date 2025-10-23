// src/services/products.js
import { request, requestWithFormData } from '@/utils/api';

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

// Import sản phẩm từ file CSV
export const importProductsCSV = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/products/import', {
        method: 'POST',
        body: formData,
        isFormData: true, // CHỗ này mình gửi form data nên cần đặt isFormData là true
    });
};

// Xuất toàn bộ sản phẩm ra file CSV
export const exportProductsCSV = async () => {
    return request('/products/export/csv', {
        method: 'GET',
        responseType: 'blob', // Ensure the response is treated as a Blob
    });
};

