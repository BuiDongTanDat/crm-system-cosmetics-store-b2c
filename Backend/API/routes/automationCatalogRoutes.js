
const express = require('express');
const ctrl = require('../Controller/AutomationCatalogController');
const router = express.Router();
// Event types
router.get('/event-types', (req, res) => ctrl.listEventTypes(req, res));
router.get('/event-types/:event_type', (req, res) => ctrl.getEventType(req, res));
router.post('/event-types', (req, res) => ctrl.createEventType(req, res));
router.patch('/event-types/:event_type', (req, res) => ctrl.updateEventType(req, res));
router.patch('/event-types/:event_type/active', (req, res) => ctrl.setEventTypeActive(req, res));
router.delete('/event-types/:event_type', (req, res) => ctrl.deleteEventType(req, res));

// Action types
router.get('/action-types', (req, res) => ctrl.listActionTypes(req, res));
router.get('/action-types/:action_type', (req, res) => ctrl.getActionType(req, res));
router.post('/action-types', (req, res) => ctrl.createActionType(req, res));
router.patch('/action-types/:action_type', (req, res) => ctrl.updateActionType(req, res));
router.patch('/action-types/:action_type/active', (req, res) => ctrl.setActionTypeActive(req, res));
router.delete('/action-types/:action_type', (req, res) => ctrl.deleteActionType(req, res));

module.exports = router;
