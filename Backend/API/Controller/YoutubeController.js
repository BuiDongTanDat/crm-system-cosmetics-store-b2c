const youtubeService = require("../../Infrastructure/Stream/YoutubeService.js");

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

      // Google will return state back to us if provided; prefer state, fallback to returnTo query
      const returnTo = req.query.state || req.query.returnTo;
      if (returnTo) {
        return res.redirect(returnTo);
      }

      res.send("Login YouTube thành công, quay lại app nha.");
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  }

  static async checkStatus(req, res) {
    try {
      const creds = youtubeService?.auth?.credentials || {};
      console.log("YouTube credentials:", creds);
      const authenticated = !!(creds.refresh_token || creds.access_token);

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
