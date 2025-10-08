// src/application/services/AuthService.js
const bcrypt = require('bcryptjs');
const jwt = require('./../../shared/utils/jwt');
const EmailUtil = require('./../../shared/utils/email');
const UserRepository = require('../../Infrastructure/Repositories/UserRepository');
const IAuthService = require('../Interfaces/IAuthService');

const tokenBlacklist = new Set();

class AuthService extends IAuthService {
  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.generateToken({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async logout(token) {
    if (!token) throw new Error('Missing token');
    tokenBlacklist.add(token);
  }

  async forgotPassword(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('Email not registered');

    const resetToken = jwt.generateResetToken({ id: user.id }, '15m');
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await EmailUtil.sendEmail(email, 'Password Reset', `Click here to reset: ${resetLink}`);
  }

  async resetPassword(token, newPassword) {
    const decoded = jwt.verifyResetToken(token);
    const user = await UserRepository.findById(decoded.id);
    if (!user) throw new Error('Invalid or expired token');

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserRepository.updatePassword(user.id, hashed);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new Error('Old password incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserRepository.updatePassword(userId, hashed);
  }
}

module.exports = new AuthService();
