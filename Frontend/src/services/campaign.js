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
    const isFormData = payload instanceof FormData;
    const res = await request('/campaign', {
        method: 'POST',
        body: isFormData ? payload : JSON.stringify(payload),
        isFormData,
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data?.campaign || {};
};

export const updated = async (id, payload) => {
    const isFormData = payload instanceof FormData;
    const res = await request(`/campaign/${id}`, {
        method: 'PATCH',
        body: isFormData ? payload : JSON.stringify(payload),
        isFormData,
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
export const approveCampaign = async (
    id,
    { status = 'running', sendBody = true } = {}
) => {
    if (!id) throw new Error('Thiếu campaign id');

    const reqInit = {
        method: 'PATCH',
        ...(sendBody ? { body: JSON.stringify({ status }) } : {}),
    };
    const res = await request(`/campaign/${encodeURIComponent(id)}/status`, reqInit);
    // BE trả về { ok: true, data: { message, campaign } }
    if (!res.ok) throw new Error(res.error?.message || 'API error');

    const data = res?.data || {};
    const campaign = data.campaign || {};

    return {
        ok: res.ok,
        message: data.message || 'Cập nhật trạng thái thành công',
        status: campaign.status || status,
        campaign,
    };
};
// Tạo kênh cho campaign
export const createCampaignChannel = async (campaignId, payload) => {
    if (!campaignId) throw new Error('Thiếu campaignId');
    const res = await request(`/campaign/${encodeURIComponent(campaignId)}/channels`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data?.channel || res.data || {};
};

// Danh sách kênh của campaign
export const listCampaignChannels = async (campaignId) => {
    if (!campaignId) throw new Error('Thiếu campaignId');
    const res = await request(`/campaign/${encodeURIComponent(campaignId)}/channels`, {
        method: 'GET',
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    const data = res.data || {};
    return {
        items: data.items || data.channels || [],
        total: data.total ?? (data.items?.length ?? data.channels?.length ?? 0),
    };
};

// Cập nhật kênh
export const updateCampaignChannel = async (channelId, patch) => {
    if (!channelId) throw new Error('Thiếu channelId');
    const res = await request(`/campaign/channels/${encodeURIComponent(channelId)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data?.channel || res.data || {};
};

// Xoá kênh
export const removeCampaignChannel = async (channelId) => {
    if (!channelId) throw new Error('Thiếu channelId');
    const res = await request(`/campaign/channels/${encodeURIComponent(channelId)}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || { message: 'Deleted' };
};
// Add flow mapping vào 1 channel
export const addFlowToChannel = async (channelId, payload) => {
    if (!channelId) throw new Error('Thiếu channelId');
    const res = await request(`/campaign/channels/${encodeURIComponent(channelId)}/flows`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data?.mapping || res.data || {};
};
// List flow mappings của channel
export const listChannelFlows = async (channelId) => {
    if (!channelId) throw new Error('Thiếu channelId');
    const res = await request(`/campaign/channels/${encodeURIComponent(channelId)}/flows`, {
        method: 'GET',
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    const data = res.data || {};
    return {
        items: data.items || data.mappings || [],
        total: data.total ?? (data.items?.length ?? data.mappings?.length ?? 0),
    };
};
// Reorder mappings
export const reorderChannelFlows = async (channelId, payload) => {
    if (!channelId) throw new Error('Thiếu channelId');
    const res = await request(
        `/campaign/channels/${encodeURIComponent(channelId)}/flows/reorder`,
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || { message: 'Reordered' };
};

// Update mapping
export const updateChannelFlow = async (mappingId, patch) => {
    if (!mappingId) throw new Error('Thiếu mappingId');
    const res = await request(`/campaign/channel-flows/${encodeURIComponent(mappingId)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data?.mapping || res.data || {};
};

// Enable mapping
export const enableChannelFlow = async (mappingId) => {
    if (!mappingId) throw new Error('Thiếu mappingId');
    const res = await request(`/campaign/channel-flows/${encodeURIComponent(mappingId)}/enable`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || { message: 'Enabled' };
};

// Disable mapping
export const disableChannelFlow = async (mappingId) => {
    if (!mappingId) throw new Error('Thiếu mappingId');
    const res = await request(`/campaign/channel-flows/${encodeURIComponent(mappingId)}/disable`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || { message: 'Disabled' };
};

// Remove mapping
export const removeChannelFlow = async (mappingId) => {
    if (!mappingId) throw new Error('Thiếu mappingId');
    const res = await request(`/campaign/channel-flows/${encodeURIComponent(mappingId)}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || { message: 'Deleted' };
};

// List campaigns theo channel
export const listByChannel = async (params = {}) => {
    const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`/campaign/by-channel${qs ? `?${qs}` : ''}`, { method: 'GET' });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || { items: [], total: 0 };
};

// Lấy metrics của campaign
export const getMetrics = async (id) => {
    if (!id) throw new Error('Thiếu campaign id');
    const res = await request(`/campaign/${encodeURIComponent(id)}/metrics`, { method: 'GET' });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || {};
};

// Chạy campaign thủ công
export const runCampaign = async (id) => {
    if (!id) throw new Error('Thiếu campaign id');
    const res = await request(`/campaign/${encodeURIComponent(id)}/run`, { method: 'POST' });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || { message: 'Campaign started' };
};

export const submitForApproval = async (id) => {
    const res = await request(`/campaign/${id}/submit`, { method: 'POST' });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data;
};

export const rejectCampaign = async (id, reason) => {
    const res = await request(`/campaign/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data;
};

export const approveProposal = async (id) => {
    const res = await request(`/campaign/${id}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data;
};

export const getCampaignById = async (id) => {
    const res = await request(`/campaign/${id}`, { method: 'GET', isPublicRoute: true });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data;
};

export const getChannelStats = async () => {
    const res = await request('/campaign/stats/channels', { method: 'GET' });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data || [];
};


// Lấy chi tiết chiến dịch công khai
export const getPublicCampaignById = async (id) => {
    const res = await request(`/campaign/public/${id}`, { method: 'GET', isPublicRoute: true });
    if (!res.ok) throw new Error(res.error?.message || 'API error');
    return res.data;
}