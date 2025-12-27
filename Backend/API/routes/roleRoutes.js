const express = require('express');
const router = express.Router();
const permissionRoute = require('../Middleware/permissionMiddleware');
const RoleController = require('../Controller/RoleController');

router.get('/', permissionRoute('role', 'read'), RoleController.getAll);
router.get('/:name', permissionRoute('role', 'read'), RoleController.getByName);
router.post('/', permissionRoute('role', 'create'), RoleController.create);
router.put('/:name', permissionRoute('role', 'update'), RoleController.update);
router.delete('/:name', permissionRoute('role', 'delete'), RoleController.delete);


module.exports = router;