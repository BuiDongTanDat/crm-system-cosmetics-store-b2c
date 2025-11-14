import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL || ""; // nếu dùng proxy thì để rỗng
const buildUrl = (path) => `${API_URL}${path}`;

// Hàm tạo mới access token
async function refreshAccessToken() {
  try {
    const res = await axios.post(buildUrl("/auth/refresh-token"), {}, { withCredentials: true });
    const newToken = res.data?.token; // api trả về token
    if (newToken) {
      useAuthStore.getState().setAccessToken(newToken); // cập nhật store
      return newToken;
    }
  } catch (err) {
    // Nếu lỗi là 401 do thiếu token (trường hợp chưa đăng nhập)
    if (err.response?.status === 401) {
      // KHÔNG IN RA LOG LỖI NÀY. Chỉ cần gọi logout để xóa sạch trạng thái cũ nếu có
      useAuthStore.getState().logout?.();
      // Vẫn throw để hàm gọi (refreshSession/request) biết là thất bại
      throw err;
    }

    // In ra các lỗi nghiêm trọng khác
    console.error("Refresh token failed unexpectedly:", err);
    useAuthStore.getState().logout?.();
    throw err;
  }
}



export async function request(
  path,
  { method = "GET", body, headers = {}, credentials = "include", isFormData = false, responseType, isPublicRoute = false } = {}
) {
  try {

    // Thêm header Authorization nếu không phải public route
    if (!isPublicRoute) {
      // Lấy token từ store nếu có
      let token = useAuthStore?.getState()?.accessToken;
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await axios({
      url: buildUrl(path),
      method,
      headers: isFormData ? headers : { "Content-Type": "application/json", ...headers },
      data: body,
      withCredentials: credentials === "include",
      validateStatus: () => true,
      responseType,
    });

    //  Nếu token hết hạn → thử refresh
    if (res.status === 401 && !path.includes("/auth/refresh-token")) {
      console.warn("Access token expired, attempting refresh...");
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          res = await axios({
            url: buildUrl(path),
            method,
            headers: isFormData ? headers : { "Content-Type": "application/json", ...headers },
            data: body,
            withCredentials: credentials === "include",
            validateStatus: () => true,
            responseType,
          });
        }
      } catch {
        // nếu refresh fail thì logout
        throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      }
    }

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
