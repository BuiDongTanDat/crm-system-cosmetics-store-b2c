const RoleRepository = require('../../Infrastructure/Repositories/RoleRepository');
const RoleDTO = require('../DTOs/RoleDTO');

class RoleService {
    constructor(repo = RoleRepository) {
        this.roleRepository = repo;
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
        const role = await this.roleRepository.createRole(roleData);
        return new RoleDTO({
            role_name: role.role_name,
            permissions: role.permissions,
            created_at: role.created_at,
            updated_at: role.updated_at
        });
    }

    async updateRole(roleName, updates) {
        const role = await this.roleRepository.updateRole(roleName, updates);
        return new RoleDTO({
            role_name: role.role_name,
            permissions: role.permissions,
            created_at: role.created_at,
            updated_at: role.updated_at
        });
    }

    async deleteRole(roleName) {
        return await this.roleRepository.deleteRole(roleName);
    }
}

module.exports =  RoleService;
