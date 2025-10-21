// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const AIController = require('../Controller/AIController');

router.get('/health', AIController.healthCheck);
router.post('/generate-email-content', AIController.generate_email_content);
router.post('/suggest-marketing-campaign', AIController.suggest_marketing_campaign);
module.exports = router;
