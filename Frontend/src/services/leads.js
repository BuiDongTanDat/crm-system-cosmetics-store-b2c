import { request } from '@/utils/api';

export const createLead = (payload) =>
    request("/leads", {
        method: "POST",
        body: payload,        // request() sẽ tự stringify + set header JSON
    });
export const getPipelineSummary = () =>
    request(
        '/leads/pipeline/summary', {
        method: 'GET'
    });
export const getPipelineColumns = () =>
    request(
        '/leads/pipeline/columns', {
        method: 'GET',
    });
export const updateLeadStatus = (Id, status) =>
    request(
        `/leads/pipeline/${Id}/status`, {
        method: 'PATCH',
        body: { status },
    });
export const getPipelineMetrics = () =>
    request(
        `/leads/pipeline/metrics`, {
        method: 'GET',
    });
export const getAllleads = () =>
    request(
        `/leads`, {
        method: 'GET',
    });
export const getQualifiedLeads = () =>
    request(`/leads/qualified`, {
        method: 'GET',
    });