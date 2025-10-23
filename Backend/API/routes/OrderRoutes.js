const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const OrderController = require('../Controller/OrderController');

const router = express.Router();


router.post('/', OrderController.create);

// list or query all orders (supports ?customerId=... handled in controller)
router.get('/', OrderController.getAllOrders);

router.get('/:id', OrderController.get);

router.put('/:id', OrderController.update);

router.patch('/:id/status', OrderController.updateStatus);

// correct: DELETE /orders/:id when router is mounted at /orders
router.delete('/:id', OrderController.delete);

module.exports = router;
