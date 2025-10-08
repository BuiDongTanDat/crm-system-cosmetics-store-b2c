class User {
  constructor({ user_id, full_name, email, phone, role_name, password_hash, status, created_at }) {
    this.user_id = user_id;
    this.full_name = full_name;
    this.email = email;
    this.phone = phone;
    this.role_name = role_name;
    this.password_hash = password_hash;
    this.status = status || "active";
    this.created_at = created_at || new Date();
  }

  activate() {
    this.status = "active";
  }

  deactivate() {
    this.status = "inactive";
  }
}

module.exports = User;
