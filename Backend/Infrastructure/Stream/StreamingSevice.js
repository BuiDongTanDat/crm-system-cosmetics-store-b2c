const fs = require('fs');
const { spawn } = require('child_process');
const youtubeService = require('./YoutubeService');

class StreamingService {
    constructor(ffmpegPath = 'ffmpeg') {
        this.ffmpegPath = ffmpegPath;
        this.uploadedFiles = new Map();
        this.pendingStreams = new Map();
        this.sessions = new Map();
        // track files that must be cleaned up even after sessions are removed
        this.cleanupFiles = new Map();
    }

    uploadFile(streamId, filePath, meta = {}) {
        console.log(`[StreamingService] uploadFile`, { streamId, filePath });
        if (!streamId || !filePath) throw new Error('streamId and filePath required');
        if (!fs.existsSync(filePath)) throw new Error('File not found: ' + filePath);

        this.uploadedFiles.set(streamId, { filePath, meta, uploadedAt: Date.now() });
        console.log(`[StreamingService] uploaded file saved for ${streamId}: ${filePath}`);
        return { ok: true, filePath };
    }

    // central cleanup helper — safe, idempotent
    _onStreamEnd(streamId, opts = {}) {
        try {
            const filePath = opts.filePath || this.cleanupFiles.get(streamId);
            const broadcastId = opts.broadcastId || (this.sessions.get(streamId) && this.sessions.get(streamId).broadcastId) || (this.pendingStreams.get(streamId) && this.pendingStreams.get(streamId).broadcastId);

            // remove session if exists
            if (this.sessions.has(streamId)) this.sessions.delete(streamId);
            if (this.pendingStreams.has(streamId)) this.pendingStreams.delete(streamId);
            if (this.uploadedFiles.has(streamId)) this.uploadedFiles.delete(streamId);

            // attempt delete file
            if (filePath) {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`[StreamingService] cleaned file for ${streamId}: ${filePath}`);
                    }
                } catch (err) {
                    console.warn(`[StreamingService] failed to delete file for ${streamId}`, err);
                }
            }
            // remove from cleanup tracker
            if (this.cleanupFiles.has(streamId)) this.cleanupFiles.delete(streamId);

            // finalize YouTube broadcast if available
            if (broadcastId) {
                youtubeService.completeLive(broadcastId).catch(err => {
                    console.warn(`[StreamingService] completeLive failed for ${broadcastId}`, err);
                });
            }
        } catch (err) {
            console.error('[StreamingService] _onStreamEnd error', err);
        }
    }

    async prepareYoutube(streamId, { title, privacy = 'public', description = '' } = {}) {
        console.log(`[StreamingService] prepareYoutube`, { streamId, title, privacy });
        const liveInfo = await youtubeService.createLive({ title, privacy, description });

        // Try to set thumbnail but don't fail prepareYoutube on rate-limit or transient errors.
        const maxAttempts = 3;
        let attempt = 0;
        let thumbOk = false;
        while (attempt < maxAttempts && !thumbOk) {
            attempt++;
            try {
                await youtubeService.setThumbnail(liveInfo.broadcastId);
                thumbOk = true;
            } catch (err) {
                const status = err?.response?.status || err?.status || err?.code;
                console.warn(`[StreamingService] setThumbnail attempt ${attempt} failed for ${liveInfo.broadcastId}`, status || err.message);
                // If rate-limited (429) don't hammer API — retry with backoff but ultimately continue
                if (attempt >= maxAttempts) {
                    console.warn(`[StreamingService] give up setting thumbnail for ${liveInfo.broadcastId} after ${attempt} attempts`);
                    break;
                }
                // exponential backoff before retry
                const delay = 1000 * Math.pow(2, attempt); // 2s, 4s, ...
                await new Promise(r => setTimeout(r, delay));
            }
        }

        this.pendingStreams.set(streamId, liveInfo);
        console.log(`[StreamingService] prepared YouTube live for ${streamId}`, { thumbnailSet: thumbOk });
        return {
            rtmpPublishUrl: liveInfo.fullRtmp,
            youtube: liveInfo
        };
    }

    async startFileStream(streamId, { title = '', description = '' } = {}) {
        console.log(`[StreamingService] start`, { streamId });
        const fileEntry = this.uploadedFiles.get(streamId);
        if (!fileEntry) throw new Error('No uploaded file for this streamId. Upload first.');

        let ytInfo = this.pendingStreams.get(streamId) || await youtubeService.createLive({ title, description });
        this.pendingStreams.set(streamId, ytInfo);

        console.log(`[StreamingService] FFmpeg streaming`, { file: fileEntry.filePath, rtmp: ytInfo.fullRtmp });

        const ff = spawn(this.ffmpegPath, [
            '-re', 
            '-stream_loop', '-1',
            '-i', fileEntry.filePath,
            '-c:v', 'libx264', '-preset', 'veryfast', '-maxrate', '3000k', '-bufsize', '6000k', '-g', '50',
            '-c:a', 'aac', '-b:a', '128k',
            '-f', 'flv', ytInfo.fullRtmp
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

        let goLiveTriggered = false;

        ff.stderr.on('data', async d => {
            const msg = d.toString();
            if (!goLiveTriggered && msg.includes('frame=')) {
                goLiveTriggered = true;
                console.log('[FFmpeg] First frame detected — wait YouTube ingest');

                await new Promise(r => setTimeout(r, 1500));

                try {
                    await youtubeService.waitForIngest(ytInfo.streamId);

                    await youtubeService.goLive(ytInfo.broadcastId); //Vì đã tắt auto start trên YouTube rồi
                    console.log('[YouTube] Broadcast is LIVE');
                } catch (err) {
                    console.error(`[StreamingService] goLive failed: ${err.message}`);
                }
            }
        });

        // handle process end robustly (exit/close/error) and ensure cleanup happens
        const onEnded = (evt, code, signal) => {
            console.log(`[ffmpeg ${streamId}] ${evt}`, { code, signal });
            // ensure we call centralized cleanup
            this._onStreamEnd(streamId, { filePath: fileEntry.filePath, broadcastId: ytInfo && ytInfo.broadcastId });
        };
        ff.on('exit', (code, signal) => onEnded('exit', code, signal));
        ff.on('close', (code, signal) => onEnded('close', code, signal));
        ff.on('error', (err) => {
            console.error(`[ffmpeg ${streamId}] error`, err);
            try { this._onStreamEnd(streamId, { filePath: fileEntry.filePath, broadcastId: ytInfo && ytInfo.broadcastId }); } catch (e) { console.error(e); }
        });

        // store session + mark file for cleanup in case the session is removed before stopStream is called
        this.sessions.set(streamId, { ffProc: ff, filePath: fileEntry.filePath, broadcastId: ytInfo.broadcastId });
        this.cleanupFiles.set(streamId, fileEntry.filePath);

        this.uploadedFiles.delete(streamId);
        return { ok: true, watchUrl: ytInfo.watchUrl };
    }

    stopStream(streamId) {
        console.log(`[StreamingService] stop`, { streamId });
        const sess = this.sessions.get(streamId);
        if (!sess) {
            // no active process — attempt to cleanup any leftover file and pending broadcast, but do not throw
            console.warn(`[StreamingService] stop called but no active session for ${streamId}. Attempting best-effort cleanup.`);
            try {
                const filePath = this.cleanupFiles.get(streamId) || (this.uploadedFiles.get(streamId) && this.uploadedFiles.get(streamId).filePath);
                const pending = this.pendingStreams.get(streamId);
                if (filePath && fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); console.log(`[StreamingService] removed leftover file for ${streamId}`); } catch (e) { console.warn(e); }
                }
                if (this.cleanupFiles.has(streamId)) this.cleanupFiles.delete(streamId);
                if (pending && pending.broadcastId) youtubeService.completeLive(pending.broadcastId).catch(console.warn);
            } catch (e) {
                console.warn('best-effort cleanup failed', e);
            }
            return { ok: true };
        }

        try { sess.ffProc.kill('SIGTERM'); } catch (e) { console.warn('failed to kill ffmpeg', e); }

        try {
            if (sess.filePath && fs.existsSync(sess.filePath)) fs.unlinkSync(sess.filePath);
        } catch (err) { console.warn('file cleanup failed', err); }

        this.sessions.delete(streamId);
        if (this.cleanupFiles.has(streamId)) this.cleanupFiles.delete(streamId);
        return { ok: true };
    }

}

module.exports = new StreamingService();
