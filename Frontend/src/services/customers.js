import { request } from '@/utils/api';


// Lấy tất cả khách hàng
export const getCustomers = () => request('/customers', { method: 'GET' });