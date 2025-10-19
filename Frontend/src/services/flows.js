// src/services/flows.js
// const BASE_URL = import.meta.env.VITE_API_URL || ''; // dùng proxy thì để rỗng

// async function request(path, { method='GET', body, headers={} } = {}) {
//   const res = await fetch(`${BASE_URL}${path}`, {
//     method,
//     headers: { 'Content-Type': 'application/json', ...headers },
//     body: body ? JSON.stringify(body) : undefined,
//     credentials: 'include',
//   });
//   if (!res.ok) throw new Error((await res.text().catch(() => res.statusText)) || `HTTP ${res.status}`);
//   if (res.status === 204) return null;
//   return res.json();
// }

// export const createFlow  = (payload) => request('/automation/flows', { method: 'POST', body: payload });
// export const getFlow     = (id)      => request(`/automation/flows/${id}`, { method: 'GET' });
// export const updateFlow  = (id,p)    => request(`/automation/flows/${id}`, { method: 'PUT', body: p });
// export const publishFlow = (id)      => request(`/automation/flows/${id}/publish`, { method: 'POST' });
