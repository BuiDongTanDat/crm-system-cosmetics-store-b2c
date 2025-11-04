import { request } from '@/utils/api';

export const getFlow = async () => {
    const res = await request('/automation/flows', { method: 'GET' });
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.items?.data?.items)) return res.items.data.items; // case bạn đang có
    return [];
};