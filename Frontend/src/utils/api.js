
const API_URL = import.meta.env.VITE_API_URL || ''; // dùng proxy thì để rỗng
const buildUrl = (path) => `${API_URL}${path}`;

export async function request(path, { method = 'GET', body, headers = {}, credentials = 'include' } = {}) {
  const res = await fetch(buildUrl(path), {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials,
  });
  if (!res.ok) throw new Error((await res.text().catch(() => res.statusText)) || `HTTP ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}