const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const OrderController = require('../controllers/OrderController');

const router = express.Router();

router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.post('/import', upload.single('file'), OrderController.importOrders);
router.post('/sync', OrderController.syncFromAPI);
router.get('/search', OrderController.search);
router.get('/:id/status', OrderController.getStatus);
router.get('/analyze/trends', OrderController.analyzeTrends);

module.exports = router;
