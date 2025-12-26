const express = require('express');
const router = express.Router();
const AutomationFlowController = require('../Controller/AutomationFlowController');
const AutomationTriggerController = require('../Controller/AutomationTriggerController');
const AutomationActionController = require('../Controller/AutomationActionController');
const AutomationController = require('../Controller/AutomationController');
// FLOW
router.post('/flows', AutomationFlowController.create);
router.get('/flows', AutomationFlowController.getAllflow);
router.patch('/flows/:flow_id', AutomationFlowController.update);
router.delete('/flows/:flow_id', AutomationFlowController.remove);
router.post('/flows/:flow_id/enable', AutomationFlowController.enable);
router.post('/flows/:flow_id/disable', AutomationFlowController.disable);
router.get('/flows/:flow_id', AutomationFlowController.getFlow);
router.post('/trigger', AutomationController.trigger);
router.get('/run-daily', AutomationController.runDaily);
router.get('/trigger-now', AutomationController.triggerNow);
// Validate & chuyển trạng thái
router.post('/flows/:flow_id/validate', AutomationFlowController.validate);
// router.post('/flows/:flow_id/activate', AutomationFlowController.activate);
// router.post('/flows/:flow_id/deactivate', AutomationFlowController.deactivate);
router.get('/flows/:flow_id/editor', AutomationFlowController.getEditor);
router.put('/flows/:flow_id/editor', AutomationFlowController.saveEditor);
router.patch('/flows/:flow_id/active', AutomationFlowController.active);
router.post('/flows/:flow_id/publish', AutomationFlowController.publish);

// // TRIGGER
// router.post('/flows/:flow_id/triggers', AutomationTriggerController.createForFlow);
// router.get('/flows/:flow_id/triggers', AutomationTriggerController.listByFlow);
// router.get('/triggers', AutomationTriggerController.list);
// router.get('/triggers/:trigger_id', AutomationTriggerController.get);
// router.patch('/triggers/:trigger_id', AutomationTriggerController.update);
// router.delete('/triggers/:trigger_id', AutomationTriggerController.remove);
// router.post('/triggers/:trigger_id/activate', AutomationTriggerController.activate);
// router.post('/triggers/:trigger_id/deactivate', AutomationTriggerController.deactivate);

// // ACTION
// router.post('/triggers/:trigger_id/actions', AutomationActionController.createForTrigger);
// router.get('/flows/:flow_id/actions', AutomationActionController.listByFlow);
// router.get('/triggers/:trigger_id/actions', AutomationActionController.listByTrigger);
// router.get('/actions', AutomationActionController.list);
// router.get('/actions/:action_id', AutomationActionController.get);
// router.patch('/actions/:action_id', AutomationActionController.update);
// router.delete('/actions/:action_id', AutomationActionController.remove);
// router.get('/actions/due', AutomationActionController.pickDue);
// router.post('/actions/:action_id/sent', AutomationActionController.markSent);
// router.post('/actions/:action_id/failed', AutomationActionController.markFailed);

module.exports = router;
