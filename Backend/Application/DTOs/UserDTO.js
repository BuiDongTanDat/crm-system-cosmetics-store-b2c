class CreateUserRequestDTO {
  constructor({ fullName, email, phone, roleName, password }) {
    this.fullName = fullName;
    this.email = email;
    this.phone = phone;
    this.roleName = roleName;
    this.password = password;
  }
}

class UpdateUserRequestDTO {
  constructor({ fullName, phone, roleName, status }) {
    this.fullName = fullName;
    this.phone = phone;
    this.roleName = roleName;
    this.status = status;
  }
}

class UserResponseDTO {
  constructor(user) {
    this.id = user.user_id;
    this.fullName = user.full_name;
    this.email = user.email;
    this.phone = user.phone;
    this.role = user.role_name;
    this.status = user.status;
    this.createdAt = user.created_at;
  }
}

module.exports = { CreateUserRequestDTO, UpdateUserRequestDTO, UserResponseDTO };
