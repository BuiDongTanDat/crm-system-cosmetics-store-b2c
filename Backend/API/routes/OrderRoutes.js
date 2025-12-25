const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const OrderController = require('../Controller/OrderController');
const protectedRoute = require('../Middleware/authMiddleware');
const router = express.Router();

// Public route for order checkout
router.get('/checkout/:id', OrderController.getOrderById);

router.use(protectedRoute);


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

router.get('/stat/by-date-range', OrderController.getOrderByDateRange);
module.exports = router;
