const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'supersecret';

module.exports = {
  generateToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: '1d' });
  },

  generateResetToken(payload, expiresIn = '15m') {
    return jwt.sign(payload, SECRET, { expiresIn });
  },

  verifyResetToken(token) {
    return jwt.verify(token, SECRET);
  },

  verifyToken(token) {
    return jwt.verify(token, SECRET);
  }
};
