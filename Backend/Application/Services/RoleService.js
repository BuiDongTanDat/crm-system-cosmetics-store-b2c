const RoleRepository = require('../../Infrastructure/Repositories/RoleRepository');
const RoleDTO = require('../DTOs/RoleDTO');

class RoleService {
    constructor(repo = RoleRepository) {
        this.roleRepository = repo;
    }

    _validateRoleData(data = {}, isUpdate = false) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Dữ liệu phải là một đối tượng');
        }

        // role_name rules
        if (!isUpdate) {
            if (!data.role_name || typeof data.role_name !== 'string' || !data.role_name.trim()) {
                throw new Error('role_name là bắt buộc và phải là chuỗi không rỗng');
            }
            data.role_name = data.role_name.trim();
        } else {
            if (data.role_name !== undefined) {
                if (typeof data.role_name !== 'string' || !data.role_name.trim()) {
                    throw new Error('role_name phải là chuỗi không rỗng khi được cung cấp');
                }
                data.role_name = data.role_name.trim();
            }
        }

        // permissions rules (optional)
        if (data.permissions !== undefined) {
            if (!Array.isArray(data.permissions)) {
                throw new Error('permissions phải là mảng chuỗi');
            }
            // normalize to trimmed unique strings, drop falsy items
            const normalized = data.permissions
                .map(p => (p === null || p === undefined) ? '' : String(p).trim())
                .filter(p => p.length > 0);
            data.permissions = Array.from(new Set(normalized));
        }

        return data;
    }

    async getAllRoles() {
        const roles = await this.roleRepository.getAllRoles();
        return roles.map(role => new RoleDTO({
            role_name: role.role_name,
            permissions: role.permissions,
            created_at: role.created_at,
            updated_at: role.updated_at
        }));
    }

    async getRoleByName(roleName) {
        if (!roleName || typeof roleName !== 'string' || !roleName.trim()) {
            throw new Error('roleName phải là chuỗi không rỗng');
        }
        const role = await this.roleRepository.getRoleByName(roleName);
        if (!role) return null;
        return new RoleDTO({
            role_name: role.role_name,
            permissions: role.permissions,
            created_at: role.created_at,
            updated_at: role.updated_at
        });
    }

    async createRole(roleData) {
        const valid = this._validateRoleData(roleData, false);

        // check duplicate name (tiếng Việt)
        const exists = await this.roleRepository.getRoleByName(valid.role_name);
        if (exists) {
            throw new Error('Tên vai trò đã tồn tại');
        }

        const role = await this.roleRepository.createRole(valid);
        return new RoleDTO({
            role_name: role.role_name,
            permissions: role.permissions,
            created_at: role.created_at,
            updated_at: role.updated_at
        });
    }

    async updateRole(roleName, updates) {
        if (!roleName || typeof roleName !== 'string' || !roleName.trim()) {
            throw new Error('roleName phải là chuỗi không rỗng');
        }
        const valid = this._validateRoleData(updates, true);

        // nếu đổi tên, kiểm tra trùng (tiếng Việt)
        if (valid.role_name && valid.role_name !== roleName) {
            const existing = await this.roleRepository.getRoleByName(valid.role_name);
            if (existing) {
                throw new Error('Tên vai trò đã tồn tại');
            }
        }

        const role = await this.roleRepository.updateRole(roleName, valid);
        return new RoleDTO({
            role_name: role.role_name,
            permissions: role.permissions,
            created_at: role.created_at,
            updated_at: role.updated_at
        });
    }

    async deleteRole(roleName) {
        if (!roleName || typeof roleName !== 'string' || !roleName.trim()) {
            throw new Error('roleName phải là chuỗi không rỗng');
        }
        return await this.roleRepository.deleteRole(roleName);
    }
}

module.exports = RoleService;
