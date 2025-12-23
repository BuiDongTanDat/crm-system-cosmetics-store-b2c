// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const AIController = require('../Controller/AIController');

router.get('/health', AIController.healthCheck);
router.post('/generate-email-content', AIController.generate_email_content);
router.post('/suggest-marketing-campaign', AIController.suggest_marketing_campaign);
router.post('/churn/predict', AIController.predict_churn);
router.post('/churn/batch', AIController.batch_predict_churn);
router.post('/churn/predict-by-id', AIController.predict_churn_by_customer_id);

router.post('/customers/segment', AIController.segment_customers);
router.post('/products/recommend', AIController.recommend_products);
module.exports = router;
