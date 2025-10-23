const express = require('express');
const router = express.Router();
const OrderDetailController = require('../Controller/OrderDetailController');


router.post('/', OrderDetailController.create);

router.post('/bulk', OrderDetailController.createMany);

router.get('/:orderId', OrderDetailController.getByOrderId);


router.delete('/:orderId', OrderDetailController.deleteByOrderId);

router.get('/:id', OrderDetailController.getById);

module.exports = router;
