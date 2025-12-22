import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

// Tạo axios instance
const API_URL = import.meta.env.VITE_API_URL || "";
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

//Gắn accessToken vào header Authorization nếu có
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Tự động refresh accessToken nếu hết hạn
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Không refresh cho các API auth đặc biệt
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh-token") ||
      originalRequest.url?.includes("/landing") ||
      originalRequest.url?.includes("/auth/forgot-password")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retryCount = originalRequest._retryCount || 0;
    if (error.response?.status === 401 && originalRequest._retryCount < 4) {
      originalRequest._retryCount += 1;
      try {
        // Gọi refresh token
        const res = await api.post("/auth/refresh-token", {}, { withCredentials: true });
        const newToken = res.data?.token;
        if (newToken) {
          useAuthStore.getState().setAccessToken(newToken);
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        useAuthStore.getState().logout?.();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Hàm request giữ nguyên logic cũ, chỉ thay axios bằng api instance
export async function request(
  path,
  { method = "GET", body, headers = {}, credentials = "include", isFormData = false, responseType, isPublicRoute = false } = {}
) {
  try {
    // Thêm header Authorization nếu không phải public route
    if (!isPublicRoute) {
      let token = useAuthStore?.getState()?.accessToken;
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await api({
      url: path,
      method,
      headers: isFormData ? headers : { "Content-Type": "application/json", ...headers },
      data: body,
      withCredentials: credentials === "include",
      validateStatus: () => true,
      responseType,
    });

    if (res.status === 204) return null;

    if (res.status < 200 || res.status >= 300) {
      const backendMsg =
        res.data?.error ||
        res.data?.message ||
        res.statusText ||
        `HTTP ${res.status}`;

      const error = new Error(backendMsg);
      error.status = res.status;
      error.data = res.data;
      throw error;
    }

    return res.data;
  } catch (err) {
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

export async function requestWithFormData(
  path,
  { method = "POST", body, headers = {}, credentials = "include" } = {}
) {
  return request(path, { method, body, headers, credentials, isFormData: true });
}
