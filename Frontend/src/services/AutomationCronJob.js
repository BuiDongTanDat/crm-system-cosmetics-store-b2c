import { request } from '@/utils/api';

export const getCronJobs = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();

  const res = await request(
    `/cron/automation/cron-jobs${qs ? `?${qs}` : ""}`,
    { method: "GET" }
  );

  if (!res?.ok) {
    throw new Error(res?.error?.message || "Get cron jobs failed");
  }

  return Array.isArray(res.data) ? res.data : [];
};
export const getCronJob = (job_key) =>
  request(`/cron/automation/cron-jobs/${encodeURIComponent(job_key)}`, { method: 'GET' });
export const upsertCronJob = (body) =>
  request(`/cron/automation/cron-jobs`, { method: 'PUT', body });
export const patchCronJob = (job_key, body) =>
  request(`/cron/automation/cron-jobs/${encodeURIComponent(job_key)}`, { method: 'PATCH', body });
export const updateCronJob = patchCronJob;
export const deleteCronJob = (job_key) =>
  request(`/cron/automation/cron-jobs/${encodeURIComponent(job_key)}`, { method: 'DELETE' });
export const createCronJob = upsertCronJob;
export const putCronJob = patchCronJob;
