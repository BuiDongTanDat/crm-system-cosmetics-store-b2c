const streamingService = require('../../Infrastructure/Stream/StreamingSevice.js');
const { randomUUID } = require('crypto');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Thư mục upload tạm
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'tmp_uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
  }),
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
});

class StreamingController {

  // Tạo streamId mới
  static async createStream(req, res) {
    try {
      const streamId = randomUUID();
      const host = process.env.PUBLIC_RTMP_HOST || req.hostname || req.get('host') || '127.0.0.1';
      const port = process.env.RTMP_PORT || 1935;
      const rtmpPublishUrl = `rtmp://${host}:${port}/live/${streamId}`;
      return res.status(200).json({ ok: true, streamId, rtmpPublishUrl });
    } catch (err) {
      console.error('createStream error', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // Prepare YouTube target
  static async prepareYoutube(req, res) {
    try {
      const streamId = req.params.streamId;
      if (!streamId) return res.status(400).json({ ok: false, error: 'streamId is required' });

      const { title = `Live - ${streamId}`, privacy = process.env.YOUTUBE_DEFAULT_PRIVACY || 'public', description = '' } = req.body || {};

      const ytInfo = await streamingService.prepareYoutube(streamId, { title, privacy, description });

      return res.status(200).json({ ok: true, youtube: ytInfo.youtube, rtmpPublishUrl: ytInfo.rtmpPublishUrl });
    } catch (err) {
      console.error('prepareYoutube error', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // Upload video file
  static async uploadVideo(req, res) {
    try {
      const streamId = req.params.streamId;
      if (!streamId) return res.status(400).json({ ok: false, error: 'streamId is required' });

      const file = req.file;
      if (!file) return res.status(400).json({ ok: false, error: 'video file is required (field "video")' });

      const meta = { originalname: file.originalname, size: file.size, mimetype: file.mimetype, uploader: req.user?.id };
      // Await uploadFile (now async) and accept path from multer
      const saved = await streamingService.uploadFile(streamId, file.path, meta);

      return res.status(200).json({ ok: true, message: 'File uploaded', filePath: saved.filePath });
    } catch (err) {
      console.error('uploadVideo error', err);
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  }

  // Start streaming file
  static async startStreamFile(req, res) {
    try {
      const streamId = req.params.streamId;
      if (!streamId) return res.status(400).json({ ok: false, error: 'streamId is required' });

      const title = req.body?.title || `Live - ${streamId}`;
      const result = await streamingService.startFileStream(streamId, title);

      return res.status(200).json({ ok: true, message: 'Streaming started', watchUrl: result.watchUrl || null });
    } catch (err) {
      console.error('startStreamFile error', err);
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  }

  // Pause / Resume / Stop
  static async pauseStreamFile(req, res) {
    const streamId = req.params.streamId;
    const result = streamingService.pauseStream(streamId);
    return result.ok
      ? res.status(200).json({ ok: true, message: 'Paused' })
      : res.status(400).json({ ok: false, error: result.error || 'pause failed' });
  }

  static async resumeStreamFile(req, res) {
    const streamId = req.params.streamId;
    const result = streamingService.resumeStream(streamId);
    return result.ok
      ? res.status(200).json({ ok: true, message: 'Resumed' })
      : res.status(400).json({ ok: false, error: result.error || 'resume failed' });
  }

  static async stopStreamFile(req, res) {
    const streamId = req.params.streamId;
    if (!streamId) return res.status(400).json({ ok: false, error: 'streamId is required' });

    try {
      const stopped = streamingService.stopStream(streamId);
      return res.status(200).json({ ok: true, message: 'Stopped', result: stopped });
    } catch (err) {
      console.error('stopStreamFile error', err);
      return res.status(404).json({ ok: false, error: err.message || String(err) });
    }
  }
}

// Multer middleware
StreamingController.upload = upload.single('video');

module.exports = StreamingController;
