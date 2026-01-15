// backend/src/Interface/Routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const CustomerController = require('../Controller/CustomerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const permissionRoute = require('../Middleware/permissionMiddleware');


router.post('/import', upload.single('file'), CustomerController.importCustomers);

router.get('/stat/by-date-range', permissionRoute('customer', 'read'), CustomerController.getCustomerByDateRange);
router.get('/', permissionRoute('customer', 'read'), CustomerController.getAll);
router.get('/:id', permissionRoute('customer', 'read'), CustomerController.getById);
router.post('/', permissionRoute('customer', 'create'), CustomerController.create);
router.put('/:id', permissionRoute('customer', 'update'), CustomerController.update);
router.delete('/:id', permissionRoute('customer', 'delete'), CustomerController.delete);

router.get('/:id/interactions', permissionRoute('customer', 'read'), CustomerController.getInteractions);
router.get('/:id/orders', permissionRoute('customer', 'read'), CustomerController.getOrders);
// router.get('/:id/recommendations', permissionRoute('customer', 'read'), CustomerController.getRecommendations);

// // AI Analysis
// router.get('/:id/analyze-clv', permissionRoute('customer', 'read'), CustomerController.analyzeCLV);
// router.get('/:id/analyze-churn', permissionRoute('customer', 'read'), CustomerController.analyzeChurn);
// router.get('/:id/analyze-behavior', permissionRoute('customer', 'read'), CustomerController.analyzeBehavior);
// router.post('/auto-segment', permissionRoute('customer', 'create'), CustomerController.autoSegmentAll);


router.post('/import', upload.single('file'), CustomerController.importCustomers);
router.get('/analytics/cfm/summary', CustomerController.getCFMSummary);
router.get('/analytics/cfm/list', CustomerController.getCFMList);
router.get('/analytics/churn/summary', CustomerController.getChurnSummary);
router.get('/analytics/churn/list', CustomerController.getChurnList);
router.get('/analytics/clv/summary', CustomerController.getCLVSummary);
router.get('/analytics/clv/list', CustomerController.getCLVList);
router.get('/stat/by-date-range', CustomerController.getCustomerByDateRange);
router.get('/', CustomerController.getAll);
router.post('/', CustomerController.create);
// router.get('/orders/:id', CustomerController.getOrders);
router.get('/:id', CustomerController.getById);
router.put('/:id', CustomerController.update);
router.delete('/', CustomerController.deleteMany);
// router.post('/:id/interactions', CustomerController.addInteraction);
router.get('/:id/interactions', CustomerController.getInteractions);
router.get('/:id/snapshot/latest', CustomerController.getSnapshot);
router.post('/:id/snapshot/rebuild', CustomerController.rebuildSnapshot);

module.exports = router;
