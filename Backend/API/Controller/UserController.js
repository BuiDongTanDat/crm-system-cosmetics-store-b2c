const UserService = require('../../Application/Services/UserService');
const userService = new UserService();

class UserController {
  static async getAll(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {

      const newUser = await userService.createUser(req.body);
      res.status(201).json(newUser);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const updated = await userService.updateUser(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await userService.deleteUser(req.params.id);
      res.status(200).json({ message: 'User deleted' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Cái này kiểu call riêng api cho việc Kích hoạt/Hủy kích hoạt người dùng nhưng mà 
  //call update cũng được
  static async activate(req, res) {
    try {
      const updated = await userService.updateUser(req.params.id, { status: 'active' });
      res.status(200).json({ message: "Đã kích hoạt user", user: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deactivate(req, res) {
    try {
      const updated = await userService.updateUser(req.params.id, { status: 'inactive' });
      res.status(200).json({ message: "Đã hủy kích hoạt user", user: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }


  // Authenticated user info
  static async authMe(req, res) {
    try {
      const user = req.user; // Đã được gán trong middleware
      res.status(200).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }

  }

  // Đổi mật khẩu
  static async changePassword(req, res) {
    try {
      const userId = req.user.user_id //Database;
      console.log('Changing password for userId:', userId);
      const { oldPassword, newPassword } = req.body;
      await userService.changePassword(userId, oldPassword, newPassword);
      res.status(200).json({ message: 'Thay đổi mật khẩu thành công' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  //Cập nhật avatar cho user đã xác thực
  static async updateAvatar(req, res) {
    try {
      const userId = req.user.user_id; // chú ý: dùng user_id từ DB
      const file = req.file;

      const updatedUser = await userService.updateAvatar(userId, file);

      res.status(200).json({
        message: 'Cập nhật avatar thành công',
        avatar_url: updatedUser.avatar_url,
        avatar_id: updatedUser.avatar_id
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  }


}

module.exports = UserController;
