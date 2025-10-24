import { request } from '@/utils/api';
export const getPipelineSummary = () =>
    request(
        '/leads/pipeline/summary',
        { method: 'GET' },
    );


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
