import { request } from "@/utils/api";

export function getYoutubeAuthUrl(returnTo = window.location.href) {
	const encoded = encodeURIComponent(returnTo);
	return `${import.meta.env.VITE_API_URL}/youtube/auth?returnTo=${encoded}`;
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
