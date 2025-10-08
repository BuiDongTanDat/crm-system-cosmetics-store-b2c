const express = require('express');
const router = express.Router();
const UserController = require('../Controller/UserController');

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);
router.put('/:id/activate', UserController.activate);
router.put('/:id/deactivate', UserController.deactivate);

module.exports = router;
