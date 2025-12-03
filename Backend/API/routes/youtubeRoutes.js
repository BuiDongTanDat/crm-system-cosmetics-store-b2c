const express = require("express");
const YoutubeController = require("../Controller/YoutubeController.js");
const router = express.Router();

// OAuth login
router.get("/auth", YoutubeController.auth);
router.get("/callback", YoutubeController.callback);

// Auth check
router.get("/status", YoutubeController.checkStatus);

// Chat endpoints
router.post("/chat/start", YoutubeController.startChat);
router.post("/chat/stop", YoutubeController.stopChat);
router.post("/chat/send", YoutubeController.sendMessage);

// Pin a message (local state only)
router.post("/chat/pin", YoutubeController.pinMessage);
router.post("/chat/unpin", YoutubeController.unpinMessage);


module.exports = router;
