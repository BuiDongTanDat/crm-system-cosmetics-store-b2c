const express = require('express');
const router = express.Router();
const CustomerController = require('../Controller/CustomerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/import', upload.single('file'), CustomerController.importCustomers);

router.get('/', CustomerController.getAll);
router.get('/:id', CustomerController.getById);
router.post('/', CustomerController.create);
router.put('/:id', CustomerController.update);
router.delete('/:id', CustomerController.delete);

router.get('/:id/interactions', CustomerController.getInteractions);
router.get('/:id/orders', CustomerController.getOrders);
router.get('/:id/recommendations', CustomerController.getRecommendations);

// AI Analysis
router.get('/:id/analyze-clv', CustomerController.analyzeCLV);
router.get('/:id/analyze-churn', CustomerController.analyzeChurn);
router.get('/:id/analyze-behavior', CustomerController.analyzeBehavior);
router.post('/auto-segment', CustomerController.autoSegmentAll);


router.get('/stat/by-date-range', CustomerController.getCustomerByDateRange);
module.exports = router;
