import { request } from '@/utils/api';

// Lấy tất cả đơn hàng
export const getOrders = () => request('/orders', { method: 'GET' });

//Lấy đơn hàng theo khách hàng
export const getOrdersByCustomer = (customerId) => {
  const params = new URLSearchParams();
  if (customerId) params.append('customerId', customerId);
  const path = `/orders${params.toString() ? `?${params.toString()}` : ''}`;
  return request(path, { method: 'GET' });
}

// Lấy đơn hàng theo id
export const getOrder = (id) => request(`/orders/${id}`, { method: 'GET' });

// Tạo mới đơn hàng
export const createOrder = (payload) => request('/orders', { method: 'POST', body: payload });

// Cập nhật đơn hàng theo id
export const updateOrder = (id, payload) => request(`/orders/${id}`, { method: 'PUT', body: payload });

// Cập nhật trạng thái đơn hàng (PATCH /orders/:id/status)
export const updateOrderStatus = (id, payload) => request(`/orders/${id}/status`, { method: 'PATCH', body: payload });

// Xóa đơn hàng theo id
export const deleteOrder = (id) => request(`/orders/${id}`, { method: 'DELETE' });
