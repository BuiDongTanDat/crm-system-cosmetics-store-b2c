require("dotenv").config();

const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";
const RESET_SECRET = process.env.JWT_RESET_SECRET || "reset-secret";

const ACCESS_TOKEN_EXPIRY = "30d"; //Tamj thời để dễ test
const REFRESH_TOKEN_EXPIRY = "7d";
const RESET_TOKEN_EXPIRY = "15m";

module.exports = {
  generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  },

  generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
      console.error('Lỗi xác minh access token:', err);
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }
  },


  verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
  },

  generateResetToken(payload) {
    return jwt.sign(payload, RESET_SECRET, { expiresIn: RESET_TOKEN_EXPIRY });
  },

  verifyResetToken(token) {
    return jwt.verify(token, RESET_SECRET);
  }
};
