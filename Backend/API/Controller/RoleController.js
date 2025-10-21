const RoleService = require('../../Application/Services/RoleService');
const roleService = new RoleService();

class RoleController {
  // map lỗi từ service sang status code
  static _mapErrorStatus(message = '') {
    if (!message || typeof message !== 'string') return 400;
    const msg = message.toLowerCase();
    if (msg.includes('không tìm thấy') || msg.includes('not found')) return 404;
    if (msg.includes('dữ liệu') || msg.includes('role_name') || msg.includes('permissions') || msg.includes('tên vai trò') || msg.includes('roleName') || msg.includes('validation')) return 400;
    return 400;
  }

  static async getAll(req, res) {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json(roles);
    } catch (err) {
      const status = RoleController._mapErrorStatus(err.message);
      res.status(status).json({ error: err.message });
    }
  }

  static async getByName(req, res) {
    try {
      const role = await roleService.getRoleByName(req.params.name); //Param là name nên bên route phải là :name
      if (!role) return res.status(404).json({ error: 'Không tìm thấy vai trò' });
      res.status(200).json(role);
    } catch (err) {
      const status = RoleController._mapErrorStatus(err.message);
      res.status(status).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const newRole = await roleService.createRole(req.body);
      res.status(201).json(newRole);
    } catch (err) {
      const status = RoleController._mapErrorStatus(err.message);
      res.status(status).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const updated = await roleService.updateRole(req.params.name, req.body);
      res.status(200).json(updated);
    } catch (err) {
      const status = RoleController._mapErrorStatus(err.message);
      res.status(status).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await roleService.deleteRole(req.params.name);
      res.status(200).json({ message: 'Xóa vai trò thành công' });
    } catch (err) {
      const status = RoleController._mapErrorStatus(err.message);
      res.status(status).json({ error: err.message });
    }
  }
}

module.exports = RoleController;
