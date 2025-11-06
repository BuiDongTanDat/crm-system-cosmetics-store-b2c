import { request } from '@/utils/api';

export const getFlow = async () => {
    const res = await request('/automation/flows', { method: 'GET' });
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.items?.data?.items)) return res.items.data.items; 
};
export const createFlow = (body) =>
    request('/automation/flows', { method: 'POST', body });

export const getFlowEditor = (flow_id) =>
    request(`/automation/flows/${flow_id}/editor`, { method: 'GET' });

export const saveFlowEditor = (flow_id, body) =>
    request(`/automation/flows/${flow_id}/editor`, { method: 'PUT', body });

export const generateEmailContent = (payload) =>
    request('/ai/generate-email-content', { method: 'POST', body: payload });

export const enableFlow = (flow_id) =>
    request(`/automation/flows/${flow_id}/enable`, { method: 'POST' });

export const disableFlow = (flow_id) =>
    request(`/automation/flows/${flow_id}/disable`, { method: 'POST' });

export const activateFlow = (flow_id) =>
    request(`/automation/flows/${flow_id}/activate`, { method: 'POST' });

export const deactivateFlow = (flow_id) =>
    request(`/automation/flows/${flow_id}/deactivate`, { method: 'POST' });

export const publishFlow = (flow_id, body = {}) =>
    request(`/automation/flows/${flow_id}/publish`, { method: 'POST', body });