const express = require('express');
const AuthController = require('../Controller/AuthController');
const router = express.Router();

// Các hàm này ko cần xác thực nên bên server.js, protectedRoute đặt dưới route /auth này
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;
