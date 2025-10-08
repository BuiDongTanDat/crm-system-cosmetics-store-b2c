class Role {
  constructor({ role_name, permissions }) {
    this.role_name = role_name;
    this.permissions = permissions || [];
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }
}

module.exports = Role;
