const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const OrderController = require('../Controller/OrderController');
const router = express.Router();


router.post('createquick/', OrderController.createQuick);

router.post('/', OrderController.create);
// list or query all orders (supports ?customerId=... handled in controller)
router.get('/', OrderController.getAllOrders);

router.get('/:id', OrderController.getOrderById);

router.put('/:id', OrderController.update);

router.patch('/:id/status', OrderController.updateStatus);

router.delete('/:id', OrderController.delete);
router.get('/by-customer', OrderController.listByCustomer);
router.get('/by-lead/:lead_id', OrderController.getByLeadId);
router.post('/:id/checkout-link', OrderController.sendCheckoutLink);
router.post('/:id/items', OrderController.addItem);
module.exports = router;
