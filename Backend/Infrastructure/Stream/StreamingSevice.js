const fs = require('fs');
const { spawn } = require('child_process');
const youtubeService = require('./YoutubeService');


class StreamingService {
    constructor(ffmpegPath = 'ffmpeg') {
        this.ffmpegPath = ffmpegPath;
        this.uploadedFiles = new Map();
        this.pendingStreams = new Map();
        this.sessions = new Map();
    }


    uploadFile(streamId, filePath, meta = {}) {
        if (!streamId || !filePath) throw new Error('streamId and filePath required');
        if (!fs.existsSync(filePath)) throw new Error('File not found: ' + filePath);


        this.uploadedFiles.set(streamId, { filePath, meta, uploadedAt: Date.now() });
        console.log(`[StreamingService] uploaded file saved for ${streamId}: ${filePath}`);
        return { ok: true, filePath };
    }


    async prepareYoutube(streamId, { title, privacy = 'public', description = '' } = {}) {
        // forward description to YouTube when creating the broadcast
        const liveInfo = await youtubeService.createLive({ title, privacy, description });
        // Set thumbnail if available
        await youtubeService.setThumbnail(liveInfo.broadcastId);
        this.pendingStreams.set(streamId, liveInfo);
        console.log(`[StreamingService] prepared YouTube live for ${streamId}`);
        return { rtmpPublishUrl: liveInfo.fullRtmp, youtube: liveInfo };
    }


    async startFileStream(streamId, { title = '', description = '' } = {}) {
        const fileEntry = this.uploadedFiles.get(streamId);
        if (!fileEntry) throw new Error('No uploaded file for this streamId. Upload first.');


        // if no pending YouTube info exists, create one and forward description
        let ytInfo = this.pendingStreams.get(streamId) || await youtubeService.createLive({ title, description });
        this.pendingStreams.set(streamId, ytInfo);


        const ffArgs = [
            '-re', '-i', fileEntry.filePath,
            '-c:v', 'libx264', '-preset', 'veryfast', '-maxrate', '3000k', '-bufsize', '6000k', '-g', '50',
            '-c:a', 'aac', '-b:a', '128k',
            '-f', 'flv', ytInfo.fullRtmp
        ];


        const ff = spawn(this.ffmpegPath, ffArgs, { stdio: ['ignore', 'pipe', 'pipe'] });


        let goLiveTriggered = false;


        ff.stderr.on('data', async d => {
            const msg = d.toString();
            if (!goLiveTriggered && msg.includes('frame=')) {
                goLiveTriggered = true;
                console.log('[FFMPEG] First frame detected, waiting for YouTube ingest...');


                // Retry loop to handle transient "Stream is inactive" responses
                const maxAttempts = 3;
                let success = false;
                for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
                    try {
                        await youtubeService.waitForIngest(ytInfo.streamId);
                        await youtubeService.goLive(ytInfo.broadcastId);
                        console.log('[YouTube] Broadcast is LIVE');
                        success = true;
                    } catch (err) {
                        console.error(`[StreamingService] goLive attempt ${attempt} failed: ${err.message}`);
                        if (attempt < maxAttempts) {
                            await new Promise(r => setTimeout(r, 2000));
                            console.log('[StreamingService] retrying goLive...');
                        } else {
                            console.error(`[StreamingService] goLive failed after ${maxAttempts} attempts for broadcastId=${ytInfo.broadcastId}`);
                        }
                    }
                }
            }
        });


        ff.on('exit', (code, signal) => {
            console.log(`[ffmpeg ${streamId}] exited code=${code} signal=${signal}`);
            this.sessions.delete(streamId);
            if (ytInfo && ytInfo.broadcastId) youtubeService.completeLive(ytInfo.broadcastId).catch(console.warn);
            try { fs.unlinkSync(fileEntry.filePath); } catch { }
        });


        this.sessions.set(streamId, { ffProc: ff, filePath: fileEntry.filePath, broadcastId: ytInfo.broadcastId });
        this.uploadedFiles.delete(streamId);
        return { ok: true, watchUrl: ytInfo.watchUrl };
    }

    stopStream(streamId) {
        const sess = this.sessions.get(streamId);
        if (!sess) throw new Error("No active stream to stop");

        console.log(`[StreamingService] Stopping stream ${streamId}`);

        try {
            sess.ffProc.kill('SIGTERM');
        } catch (e) {
            console.warn("FFmpeg kill failed", e);
        }

        // attempt to remove the temporary uploaded file used for this session
        try {
            const fp = sess.filePath;
            if (fp && fs.existsSync(fp)) {
                try { fs.unlinkSync(fp); console.log(`[StreamingService] Deleted uploaded file for ${streamId}: ${fp}`); }
                catch (err) { console.warn(`[StreamingService] Failed to delete file ${fp}:`, err); }
            }
        } catch (err) {
            console.warn('[StreamingService] Error while attempting to delete uploaded file:', err);
        }

        // also remove any leftover uploadedFiles entry (defensive)
        try { if (this.uploadedFiles.has(streamId)) this.uploadedFiles.delete(streamId); } catch (e) { /* ignore */ }

        this.sessions.delete(streamId);
        return { ok: true };
    }

    pauseStream(streamId) {
        // FFmpeg file streaming can NOT be paused
        throw new Error("Pause not supported for file streams. Stop and restart instead.");
    }
}


module.exports = new StreamingService();