const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const OrderController = require('../Controller/OrderController');
const protectedRoute = require('../Middleware/authMiddleware');
const permissionRoute = require('../Middleware/permissionMiddleware');
const router = express.Router();

// Public route for order checkout
router.get('/checkout/:id', OrderController.getOrderById);

router.use(protectedRoute);


router.post('createquick/', permissionRoute('order', 'create'), OrderController.createQuick);

router.post('/', permissionRoute('order', 'create'), OrderController.create);
// list or query all orders (supports ?customerId=... handled in controller)
router.get('/', permissionRoute('order', 'read'), OrderController.getAllOrders);

router.get('/:id', permissionRoute('order', 'read'), OrderController.getOrderById);

router.put('/:id', permissionRoute('order', 'update'), OrderController.update);

router.patch('/:id/status', permissionRoute('order', 'update'), OrderController.updateStatus);

router.delete('/:id', permissionRoute('order', 'delete'), OrderController.delete);
router.get('/by-customer', permissionRoute('order', 'read'), OrderController.listByCustomer);
router.get('/by-lead/:lead_id', permissionRoute('order', 'read'), OrderController.getByLeadId);
router.post('/:id/checkout-link', permissionRoute('order', 'create'), OrderController.sendCheckoutLink);
router.post('/:id/items', permissionRoute('order', 'create'), OrderController.addItem);

router.get('/stat/by-date-range', permissionRoute('order', 'read'), OrderController.getOrderByDateRange);
module.exports = router;
