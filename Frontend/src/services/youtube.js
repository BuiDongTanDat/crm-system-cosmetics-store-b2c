import { request } from "@/utils/api";

const FRONTEND_URL = import.meta.env.FRONTEND_URL || "http://localhost:5173";

export async function getYoutubeAuthUrl(returnTo = FRONTEND_URL + "/streams") {
  try {
    const data = await request(`/youtube/auth?returnTo=${encodeURIComponent(returnTo)}`);
    if (data.url) {
      window.location.href = data.url; // redirect trình duyệt đến Google
    } else {
      console.error("Không nhận được URL auth từ server");
    }
  } catch (err) {
    console.error("Lỗi khi lấy URL YouTube auth:", err);
  }
}

// Helper:  Redirect trực tiếp với loginUrl từ error
export function redirectToYoutubeAuth(loginUrl, returnTo = FRONTEND_URL + "/streams") {
  if (loginUrl) {
    // Nếu backend đã trả về loginUrl, dùng luôn
    window.location. href = loginUrl;
  } else {
    // Fallback: gọi API để lấy loginUrl
    getYoutubeAuthUrl(returnTo);
  }
}


// Check login state
export async function isAuthenticated() {
	return request("/youtube/status", { method: "GET" });
}

// Chat APIs
export function startChat() {
	return request("/youtube/chat/start", { method: "POST" });
}

export function stopChat() {
	return request("/youtube/chat/stop", { method: "POST" });
}

export function sendMessage(text) {
	return request("/youtube/chat/send", {
		method: "POST",
		body: { text },
	});
}
