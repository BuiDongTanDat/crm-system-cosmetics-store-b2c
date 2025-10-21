const { Op } = require('sequelize');
const Role = require('../../Domain/Entities/Role');

class RoleRepository {
    // Lấy tất cả vai trò
    async getAllRoles() {
        return await Role.findAll();
    }

    // Lấy ra 1 vai trò theo tên
    async getRoleByName(roleName) {
        return await Role.findOne({ where: { role_name: roleName } });
    }

    // Tạo vai trò mới
    async createRole(roleData) {
        return await Role.create(roleData);
    }

    // Cập nhật vai trò
    async updateRole(roleName, updates) {
        const role = await this.getRoleByName(roleName);
        if (!role) {
            throw new Error('Không tìm thấy vai trò');
        }
        return await role.update(updates);
    }

    // Xoá vai trò
    async deleteRole(roleName) {
        const role = await this.getRoleByName(roleName);
        if (!role) {
            throw new Error('Không tìm thấy vai trò');
        }
        return await role.destroy();
    }

    // Nếu cần dùng transaction, có thể truyền { transaction } vào các hàm trên
}

module.exports = new RoleRepository();