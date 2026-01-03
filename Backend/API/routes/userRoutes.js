const express = require('express');
const router = express.Router();
const UserController = require('../Controller/UserController');
const UploadCloud = require('../../Infrastructure/external/UploadCloud');
const permissionRoute = require('../Middleware/permissionMiddleware');

router.get('/', permissionRoute('user', 'read'), UserController.getAll);
router.get('/:id', permissionRoute('user', 'read'), UserController.getById);
router.post('/', permissionRoute('user', 'create'), UserController.create);
router.put('/:id', permissionRoute('user', 'update'), UserController.update);
router.delete('/:id', permissionRoute('user', 'delete'), UserController.delete);
router.put('/:id/activate', permissionRoute('user', 'update'), UserController.activate);
router.put('/:id/deactivate', permissionRoute('user', 'update'), UserController.deactivate);

router.get('/me/info', UserController.authMe);
router.post('/me/change-password', UserController.changePassword);
router.post(
  '/me/change-avatar',
  UploadCloud.single('avatar'),
  UserController.updateAvatar
);



module.exports = router;
