const AuthService = require('../../Application/Services/AuthService');

class AuthController {
  static async login(req, res) {
    try {
      //Lấy inputs
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
      }

      //Kiểm tra đăng nhập
      const result = await AuthService.login(email, password);

      //Lưu refresh token vào cookie
      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none", // nếu frontend và backend khác domain
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        token: result.token,
        // refreshToken: result.refreshToken, // Đã lưu trong cookie
        user: result.user
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async logout(req, res) {
    try {
      // Lấy refresh token từ cookie
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
        //Xóa cookie
        res.clearCookie("refresh_token");
      }

      return res.sendStatus(204); // Đăng xuất thành công
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);
      res.status(200).json({ message: 'Email đã được gửi' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      res.status(200).json({ message: 'Mật khẩu đã được reset' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async refreshToken(req, res) {
    try {
      // Lấy refresh token từ cookie
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Thiếu refresh token' });
      }

      // Gọi service để verify refresh token và cấp token mới
      const newAccessToken = await AuthService.refreshAccessToken(refreshToken);

      return res.status(200).json({ token: newAccessToken });
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
  }


}

module.exports = AuthController;

