class UserDTO {
    constructor({ user_id, full_name, email, phone, role_name, status, created_at, updated_at }) {
        this.user_id = user_id;
        this.full_name = full_name;
        this.email = email;
        this.phone = phone;
        this.role_name = role_name;
        this.status = status;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    static fromEntity(entity) {
        return new UserDTO({
            user_id: entity.user_id,
            full_name: entity.full_name,
            email: entity.email,
            phone: entity.phone,
            role_name: entity.role_name,
            status: entity.status,
            created_at: entity.created_at,
            updated_at: entity.updated_at
        });
    }
}

module.exports = UserDTO;