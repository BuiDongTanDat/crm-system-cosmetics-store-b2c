import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || ''; // dùng proxy thì để rỗng
const buildUrl = (path) => `${API_URL}${path}`;

export async function request(path, { method = 'GET', body, headers = {}, credentials = 'include' } = {}) {
  try {
    const res = await axios({
      url: buildUrl(path),
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      data: body,
      withCredentials: credentials === 'include',
      validateStatus: () => true, // handle status manually
    });
    if (res.status === 204) return null;
    if (res.status < 200 || res.status >= 300) {
      throw new Error(res.data?.message || res.statusText || `HTTP ${res.status}`);
    }
    return res.data;
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Network error');
  }
}