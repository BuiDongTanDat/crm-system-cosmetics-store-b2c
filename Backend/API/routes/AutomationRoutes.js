const express = require('express');
const AutomationController = require('../controllers/AutomationController');

const router = express.Router();

// Flow Management
router.get('/flows', AutomationController.getFlows);
router.get('/flows/:id', AutomationController.getFlowById);
router.post('/flows', AutomationController.createFlow);
router.put('/flows/:id', AutomationController.updateFlow);
router.delete('/flows/:id', AutomationController.deleteFlow);
router.post('/flows/:id/run', AutomationController.runFlow);

// Trigger & Action Management
router.get('/triggers', AutomationController.listTriggers);
router.post('/triggers', AutomationController.createTrigger);
router.get('/actions', AutomationController.listActions);
router.post('/actions', AutomationController.createAction);

// AI Integration
router.post('/ai/analyze', AutomationController.aiAnalyze);
router.post('/ai/recommend', AutomationController.aiRecommend);

module.exports = router;
