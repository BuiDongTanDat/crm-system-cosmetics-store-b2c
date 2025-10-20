class RoleDTO {
    constructor({ role_name, permissions, created_at, updated_at }) {
        this.role_name = role_name;
        this.permissions = permissions; // array of permission strings
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

module.exports = RoleDTO;