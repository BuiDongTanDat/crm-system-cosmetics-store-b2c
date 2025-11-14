// src/application/services/AuthService.js
const bcrypt = require('bcrypt');
const jwt = require('./../../shared/utils/jwt');
const EmailService = require('../../Infrastructure/external/EmailService');
const UserRepository = require('../../Infrastructure/Repositories/UserRepository');
const SessionRepository = require('../../Infrastructure/Repositories/SessionRepositoy');
const { max } = require('../../Domain/Entities/Role');
const tokenBlacklist = new Set();

class AuthService {
  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('Không tìm thấy user');

    //Kiểm tra trạng thái
    if (user.status === 'inactive') {
      throw new Error('Tài khoản đã bị khóa');
    }

    // Kiểm tra mật khẩu
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Email hoặc mật khẩu không chính xác');

    // Nếu khớp, tạo access token
    const token = jwt.generateAccessToken({ id: user.user_id, email: user.email });

    //Tạo refresh token 
    const refreshToken = jwt.generateRefreshToken({ id: user.user_id });

    // Tạo session mới để lưu refresh token
    await SessionRepository.createSession({
      user_id: user.user_id,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
    });
    return {
      token,
      refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.full_name,
        role: user.role_name,
        avatar: user.avatar_url,
        bio: user.bio,
      }
    };
  }

  async logout(refreshToken) {
    // Xóa refresh token khỏi session
    await SessionRepository.deleteByRefreshToken(refreshToken);
  }


  async forgotPassword(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('Email chưa đăng ký tài khoản');

    // Tạo token reset mật khẩu, hết hạn sau 15 phút
    const resetToken = jwt.generateResetToken({ id: user.user_id }, '15m');

    // Tạo link reset gửi về frontend
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    // Tạo nội dung email
    const subject = 'Đặt lại mật khẩu của bạn';
    const body = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Xin chào ${user.full_name || user.email},</h2>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <b>MyShop</b>.</p>
      <p>Nhấn vào nút bên dưới để tạo mật khẩu mới. Liên kết này chỉ có hiệu lực trong 15 phút.</p>
      <p style="margin-top: 20px;">
        <a href="${resetLink}" style="background: #4CAF50; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
          Đặt lại mật khẩu
        </a>
      </p>
      <p>Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.</p>
      <hr/>
      <small>© ${new Date().getFullYear()} MyShop. Tất cả các quyền được bảo lưu.</small>
    </div>
  `;

    // Gửi email
    const sendResult = await EmailService.send({
      to: user.email,
      subject,
      body,
    });

    if (!sendResult.ok) throw new Error(sendResult.error || 'Không thể gửi email');

    return { message: 'Đã gửi email đặt lại mật khẩu' };
  }

  async resetPassword(token, newPassword) {
    // Kiểm tra reset token
    const decoded = jwt.verifyResetToken(token);
    const user = await UserRepository.findById(decoded.id);
    if (!user) throw new Error('Token không hợp lệ hoặc đã hết hạn');

    // Hash mật khẩu mới
    const hashed = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu trong database
    await UserRepository.updatePassword(user.user_id, hashed);
  }


  async refreshAccessToken(refreshToken) {
    // Kiểm tra refreshToken có trong database không
    const session = await SessionRepository.findByRefreshToken(refreshToken);
    if (!session) throw new Error('Không tìm thấy refresh token');

    // Kiểm tra token có hết hạn chưa
    if (new Date(session.expires_at) < new Date()) {
      await SessionRepository.deleteByRefreshToken(refreshToken);
      throw new Error('Refresh token đã hết hạn');
    }

    // Giải mã refresh token
    const decoded = jwt.verifyRefreshToken(refreshToken);
    if (!decoded) throw new Error('Refresh token không hợp lệ');

    // Tạo access token mới
    const user = await UserRepository.findById(decoded.id);
    if (!user) throw new Error('Không tìm thấy user');

    const newAccessToken = jwt.generateAccessToken({ id: user.user_id, email: user.email });

    return newAccessToken;
  }


}

module.exports = new AuthService();
