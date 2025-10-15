// Endpoint	Method	Description	Controller
// /users	GET	Danh sách người dùng	UserController.getAll()
// /users/:id	GET	Lấy thông tin chi tiết	UserController.getById()
// /users	POST	Thêm nhân viên mới	UserController.create()
// /users/:id	PUT	Cập nhật thông tin	UserController.update()
// /users/:id	DELETE	Xoá user	UserController.delete()
// PUT /users/:id/activate → kích hoạt user
// PUT /users/:id/deactivate → vô hiệu hóa user
// const IUserService = require('../../Application/Interfaces/IUserService');
const UserService = require('../../Application/Services/UserService');
class UserController {
  static async getAll(req, res) {
    try {
      const users = await UserService.getAll();
      res.status(200).json(users);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const user = await UserService.getById(req.params.id);
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const newUser = await UserService.create(req.body);
      res.status(201).json(newUser);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const updated = await UserService.update(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await IUserService.delete(req.params.id);
      res.status(200).json({ message: 'User deleted' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async activate(req, res) {
    try {
      const result = await IUserService.activateUser(req.params.id);
      return res.status(200).json({ message: "User activated", user: result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async deactivate(req, res) {
    try {
      const result = await IUserService.deactivateUser(req.params.id);
      return res.status(200).json({ message: "User deactivated", user: result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

module.exports = UserController;
