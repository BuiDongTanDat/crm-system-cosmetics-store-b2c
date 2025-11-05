import { request } from "@/utils/api";

// Tạo streamId mới (title + optional description)
export async function createStream({ title, description } = {}) {
  return request('/stream', { method: 'POST', body: { title, description } });
}

// Chuẩn bị YouTube live cho streamId
export async function prepareYoutube(streamId, options = {}) {
  if (!streamId) throw new Error('streamId is required');
  return request(`/stream/${encodeURIComponent(streamId)}/youtube`, {
    method: 'POST',
    body: options
  });
}

// Upload video file
export async function uploadStreamFile(streamId, file, metadata = {}) {
  if (!streamId) throw new Error('streamId is required');
  if (!file) throw new Error('file is required');

  const fd = new FormData();
  fd.append('video', file);
  Object.entries(metadata).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });

  return request(`/stream/${encodeURIComponent(streamId)}/upload`, {
    method: 'POST',
    body: fd,
    isFormData: true // <- thêm flag để request biết đây là FormData
  });
}

// Start streaming file đã upload
export async function startStreamFile(streamId, options = {}) {
  if (!streamId) throw new Error('streamId is required');
  return request(`/stream/${encodeURIComponent(streamId)}/start-file`, {
    method: 'POST',
    body: options
  });
}

// Pause / Resume / Stop streaming
export async function pauseStreamFile(streamId) {
  if (!streamId) throw new Error('streamId is required');
  return request(`/stream/${encodeURIComponent(streamId)}/pause-file`, { method: 'POST' });
}

export async function resumeStreamFile(streamId) {
  if (!streamId) throw new Error('streamId is required');
  return request(`/stream/${encodeURIComponent(streamId)}/resume-file`, { method: 'POST' });
}

export async function stopStreamFile(streamId) {
  if (!streamId) throw new Error('streamId is required');
  return request(`/stream/${encodeURIComponent(streamId)}/stop-file`, { method: 'POST' });
}

// Send SDP offer and return SDP answer (WebRTC)
export async function postSdpOffer(url, sdp) {
  if (!url) throw new Error('url is required');
  if (!sdp) throw new Error('sdp is required');
  return request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: sdp,
    raw: true // <- trả về text chứ không parse JSON
  });
}
