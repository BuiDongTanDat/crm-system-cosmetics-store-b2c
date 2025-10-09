
class IAuthService {
  async login(email, password) {
    throw new Error('Method not implemented.');
  }

  async logout(token) {
    throw new Error('Method not implemented.');
  }

  async forgotPassword(email) {
    throw new Error('Method not implemented.');
  }

  async resetPassword(token, newPassword) {
    throw new Error('Method not implemented.');
  }

  async changePassword(userId, oldPassword, newPassword) {
    throw new Error('Method not implemented.');
  }
}

module.exports = IAuthService;
