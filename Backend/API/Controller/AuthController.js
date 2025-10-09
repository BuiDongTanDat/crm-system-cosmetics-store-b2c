// POST /auth/login
// POST /auth/logout
// POST /auth/forgot-password
// POST /auth/reset-password
// POST /auth/change-password
// src/interfaces/controllers/AuthController.js
const IAuthService = require('../../Application/Interfaces/IAuthService.js');
const AuthService = require('../../Application/Services/AuthService');

/**
 * Ở đây bạn có thể dùng DI container hoặc simple binding:
 * const authService = container.resolve('IAuthService');
 * => nếu sau này bạn đổi sang AIAuthService thì không cần sửa controller
 */
const authService = IAuthService; // hiện tạm binding thẳng

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      await authService.logout(token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.status(200).json({ message: 'Password has been reset' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(userId, oldPassword, newPassword);
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = AuthController;

