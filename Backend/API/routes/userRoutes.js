const express = require('express');
const router = express.Router();
const UserController = require('../Controller/UserController');
const UploadCloud = require('../../Infrastructure/external/UploadCloud');

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);
router.put('/:id/activate', UserController.activate);
router.put('/:id/deactivate', UserController.deactivate);

router.get('/me/info', UserController.authMe);
router.post('/me/change-password', UserController.changePassword);
router.post(
  '/me/change-avatar',
  UploadCloud.single('avatar'),
  UserController.updateAvatar
);



module.exports = router;
