const RoleService = require('../../Application/Services/RoleService');
const roleService = new RoleService();

class RoleController {
  static async getAll(req, res) {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json(roles);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getByName(req, res) {
    try {
      const role = await roleService.getRoleByName(req.params.name); //Param là name nên bên route phải là :name
      if (!role) return res.status(404).json({ error: 'Không tìm thấy vai trò' });
      res.status(200).json(role);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const newRole = await roleService.createRole(req.body);
      res.status(201).json(newRole);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const updated = await roleService.updateRole(req.params.name, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await roleService.deleteRole(req.params.name);
      res.status(200).json({ message: 'Xóa vai trò thành công' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = RoleController;
