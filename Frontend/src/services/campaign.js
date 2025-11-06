// src/services/campaign.js
import { request } from '@/utils/api';

export const suggest_marketing_campaign = async (topic) => {
    const res = await request('/ai/suggest-marketing-campaign', {
        method: 'POST',
        body: JSON.stringify({ topic }),
    });
    const c = res?.data?.campaign || {};
    return c;
};
export const created = async (payload) => {
    const res = await request('/campaign', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data?.campaign || {};
};
export const getAll = async (params = {}) => {
    const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();

    const res = await request(`/campaign${qs ? `?${qs}` : ''}`, { method: 'GET' });
    if (!res.ok) throw new Error(res.error?.message || 'API error');

    const data = res.data || {};
    return {
        items: data.items || [],
        page: data.page ?? 1,
        limit: data.limit ?? 20,
        total: data.total ?? 0,
        totalPages: data.totalPages ?? 1,
    };
};
export const getRunningCampaigns = async (params = {}) => {
    // build query string (lọc null/undefined/chuỗi rỗng)
    const qs = new URLSearchParams(
        Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== ""
        )
    ).toString();

    // gọi API
    const res = await request(`/campaign/running${qs ? `?${qs}` : ""}`, {
        method: "GET",
    });

    // kiểm tra kết quả
    if (!res.ok) throw new Error(res.error?.message || "API error");

    // chuẩn hóa format trả về y hệt getAll
    const data = res.data || {};
    return {
        items: data.items || [],
        page: data.page ?? 1,
        limit: data.limit ?? (data.items?.length || 0),
        total: data.total ?? data.items?.length ?? 0,
        totalPages: data.totalPages ?? 1,
    };
};
