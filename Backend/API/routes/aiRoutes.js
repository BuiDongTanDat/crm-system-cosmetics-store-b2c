// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const AIController = require('../Controller/AIController');

router.get('/health', AIController.healthCheck);

module.exports = router;
