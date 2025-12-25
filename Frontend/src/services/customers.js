import { request } from '@/utils/api';

// Lấy tất cả khách hàng
export const getCustomers = () => request('/customers', { method: 'GET' });

// Lấy chi tiết khách hàng theo ID
export const getCustomerById = (id) => request(`/customers/${id}`, { method: 'GET' });

// Tạo khách hàng mới
export const createCustomer = (data) => request('/customers', { method: 'POST', body: data });

// Cập nhật thông tin khách hàng
export const updateCustomer = (id, data) => request(`/customers/${id}`, { method: 'PUT', body: data });

// Xóa khách hàng
export const deleteCustomer = (id) => request(`/customers/${id}`, { method: 'DELETE' });

// Import danh sách khách hàng từ file
export const importCustomers = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/customers/import', {
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// Lấy danh sách tương tác của khách hàng
export const getCustomerInteractions = (id) => request(`/customers/${id}/interactions`, { method: 'GET' });

// Lấy danh sách đơn hàng của khách hàng
export const getCustomerOrders = (id) => request(`/customers/${id}/orders`, { method: 'GET' });

// Lấy danh sách sản phẩm/đề xuất dành cho khách hàng
export const getCustomerRecommendations = (id) => request(`/customers/${id}/recommendations`, { method: 'GET' });

// Phân tích giá trị vòng đời khách hàng (CLV)
export const analyzeCustomerCLV = (id) => request(`/customers/${id}/analyze-clv`, { method: 'GET' });

// Phân tích rủi ro rời bỏ (Churn)
export const analyzeCustomerChurn = (id) => request(`/customers/${id}/analyze-churn`, { method: 'GET' });

// Phân tích hành vi khách hàng
export const analyzeCustomerBehavior = (id) => request(`/customers/${id}/analyze-behavior`, { method: 'GET' });

// Tự động phân nhóm toàn bộ khách hàng
export const autoSegmentCustomers = () => request('/customers/auto-segment', { method: 'POST' });

export const getCustomersByDateRange = (from, to) => {
    const query = new URLSearchParams({ from, to }).toString();
    return request(`/customers/stat/by-date-range?${query}`, { method: 'GET' });
}