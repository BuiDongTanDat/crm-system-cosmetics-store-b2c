//RoleDTO
// Req với res giống nhau, vì có 2 mục role_name với permission nên làm 1 cái 
// DTO dùng chung
class RoleDTO {
    constructor({ role_name, permissions, created_at, updated_at }) {
        this.role_name = role_name;
        this.permissions = permissions; // array of permission strings
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    static fromEntity(entity) {
        return new RoleDTO({
            role_name: entity.role_name,
            permissions: entity.permissions,
            created_at: entity.created_at,
            updated_at: entity.updated_at
        });
    }
}

module.exports = RoleDTO;