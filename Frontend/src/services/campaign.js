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
        body: JSON.stringify({ payload }),
    });
    const c = res?.data?.campaign || {};
    return c;
}   
