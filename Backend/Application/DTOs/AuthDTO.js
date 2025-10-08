// =================== REQUEST ===================
class LoginRequestDTO {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}

class RegisterRequestDTO {
  constructor({ fullName, email, password, phone, roleName }) {
    this.fullName = fullName;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.roleName = roleName;
  }
}

class ForgotPasswordRequestDTO {
  constructor({ email }) {
    this.email = email;
  }
}

class ResetPasswordRequestDTO {
  constructor({ token, newPassword }) {
    this.token = token;
    this.newPassword = newPassword;
  }
}

class ChangePasswordRequestDTO {
  constructor({ oldPassword, newPassword }) {
    this.oldPassword = oldPassword;
    this.newPassword = newPassword;
  }
}

// =================== RESPONSE ===================
class AuthResponseDTO {
  constructor({ token, user }) {
    this.token = token;
    this.user = {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role_name,
    };
  }
}

module.exports = {
  LoginRequestDTO,
  RegisterRequestDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  ChangePasswordRequestDTO,
  AuthResponseDTO,
};
