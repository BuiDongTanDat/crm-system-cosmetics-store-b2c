// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = "http://localhost:5000"; //Tạm để localhost
const buildUrl = (path) => `${API_URL}${path}`;

export const api = {
  get: (path, options) => fetch(buildUrl(path), { ...options }),
  post: (path, body, options = {}) =>
    fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(body),
    }),
  put: (path, body, options = {}) =>
    fetch(buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(body),
    }),
  delete: (path, options = {}) =>
    fetch(buildUrl(path), { method: "DELETE", ...options }),

  // convenience helpers returning parsed JSON (if any)
  getJson: async (path, options) => {
    const res = await fetch(buildUrl(path), { ...options });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data };
  },

  postJson: async (path, body, options = {}) => {
    const res = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data };
  },

  putJson: async (path, body, options = {}) => {
    const res = await fetch(buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data };
  },

  deleteJson: async (path, options = {}) => {
    const res = await fetch(buildUrl(path), { method: "DELETE", ...options });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data };
  },
};
