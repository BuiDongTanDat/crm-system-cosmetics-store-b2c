const youtubeService = require("../../Infrastructure/Stream/YoutubeService.js");
require('dotenv').config();

// local pinned message store
let pinnedMessage = null;

class YoutubeController {
  static async auth(req, res) {
    try {
      // Backend có thể check JWT trước nếu cần
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const returnTo = req.query.returnTo;
      const url = youtubeService.getLoginUrl(returnTo);

      // Trả JSON thay vì redirect trực tiếp
      res.json({ url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Auth failed" });
    }
  }


  static async callback(req, res) {
    try {
      const code = req.query.code;
      if (!code) return res.status(400).json({ error: "Missing code" });

      await youtubeService.getTokensWithCode(code);

      // Google sẽ gửi lại tham số state (nếu có) trong redirect
      const returnTo = req.query.state || req.query.returnTo || '/streams';

      // Redirect về FRONTEND với query param success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}${returnTo}?youtube_auth=success`;

      console.log(`[YouTube Callback] Redirecting to: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('[YouTube Callback] Error:', err);

      // Redirect về frontend với error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorUrl = `${frontendUrl}/streams?youtube_auth=error&message=${encodeURIComponent(err.message)}`;
      return res.redirect(errorUrl);
    }
  }

  static async checkStatus(req, res) {
    try {
      const creds = youtubeService?.auth?.credentials || {};
      console.log("YouTube credentials:", creds);
      const authenticated = ! !(creds.refresh_token || creds.access_token);

      res.json({ authenticated });
    } catch (err) {
      console.error(err);
      res.json({ authenticated: false });
    }
  }

  static async startChat(req, res) {
    try {
      await youtubeService.startChatPolling();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  static async stopChat(req, res) {
    try {
      youtubeService.stopChatPolling();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false });
    }
  }

  static async sendMessage(req, res) {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "text required" });

      await youtubeService.sendMessage(text);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // Local pin feature
  static async pinMessage(req, res) {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });

    pinnedMessage = text;
    res.json({ ok: true, pinned: pinnedMessage });
  }

  static async unpinMessage(req, res) {
    pinnedMessage = null;
    res.json({ ok: true });
  }

  static getPinned() {
    return pinnedMessage;
  }
}

module.exports = YoutubeController;