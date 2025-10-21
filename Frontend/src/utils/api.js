import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || ""; // nếu dùng proxy thì để rỗng
const buildUrl = (path) => `${API_URL}${path}`;

export async function request(
  path,
  { method = "GET", body, headers = {}, credentials = "include" } = {}
) {
  try {
    const res = await axios({
      url: buildUrl(path),
      method,
      headers: { "Content-Type": "application/json", ...headers },
      data: body,
      withCredentials: credentials === "include",
      validateStatus: () => true, // tự handle status
    });

    if (res.status === 204) return null;

    if (res.status < 200 || res.status >= 300) {
      // Gộp message từ backend nếu có
      const backendMsg =
        res.data?.error ||
        res.data?.message ||
        res.statusText ||
        `HTTP ${res.status}`;

      // Tạo error object có thêm data & status
      const error = new Error(backendMsg);
      error.status = res.status;
      error.data = res.data;
      throw error;
    }

    return res.data;
  } catch (err) {
    // Giữ nguyên response gốc nếu có
    if (err.response) {
      err.message =
        err.response.data?.error ||
        err.response.data?.message ||
        err.message;
      err.status = err.response.status;
      err.data = err.response.data;
    }

    throw err;
  }
}
