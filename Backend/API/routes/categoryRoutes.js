const express = require('express');
const router = express.Router();
const CategoryController = require('../Controller/CategoryController');
const permissionRoute = require('../Middleware/permissionMiddleware');

router.get('/', permissionRoute('category', 'read'), CategoryController.getAll);
router.get('/:id', permissionRoute('category', 'read'), CategoryController.getById);
router.post('/', permissionRoute('category', 'create'), CategoryController.create);
router.put('/:id', permissionRoute('category', 'update'), CategoryController.update);
router.delete('/:id', permissionRoute('category', 'delete'), CategoryController.delete);

module.exports = router;