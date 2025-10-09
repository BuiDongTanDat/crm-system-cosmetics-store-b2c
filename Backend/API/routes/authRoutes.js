const express = require('express');
const AuthController = require('../Controller/AuthController');
const router = express.Router();

router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/change-password', AuthController.changePassword);

module.exports = router;
