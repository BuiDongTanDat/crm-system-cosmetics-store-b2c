const { Op } = require('sequelize');
const User = require('../../Domain/Entities/User');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

class UserRepository {
    // Lấy người dùng theo ID
    async findById(userId) {
        return await User.findByPk(userId);
    }

    // Lấy tất cả người dùng
    async findAll() {
        return await User.findAll();
    }

    // Tạo người dùng
    async create(userData) {
        //ĐỂ TẠM
        if (!userData.password_hash) {
            userData.password_hash = bcrypt.hashSync('default123', 10); // password mặc định
        }
        try {
            return await User.create(userData);
        } catch (err) {
            if (err instanceof Sequelize.UniqueConstraintError) {
                const field = err.errors[0].path;
                if (field === 'email') {
                    throw new Error('Email đã tồn tại');
                }
                if (field === 'phone') {
                    throw new Error('Số điện thoại đã tồn tại');
                }
                if (field === 'full_name') {
                    throw new Error('Tên đã tồn tại');
                }
            }
            throw err;
        }
    }

    // Cập nhật người dùng
    async update(userId, updates) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        try {
            return await user.update(updates);
        } catch (err) {
            if (err instanceof Sequelize.UniqueConstraintError) {
                const field = err.errors[0].path;
                if (field === 'email') {
                    throw new Error('Email đã tồn tại');
                }
                if (field === 'phone') {
                    throw new Error('Số điện thoại đã tồn tại');
                }
                if (field === 'full_name') {
                    throw new Error('Tên đã tồn tại');
                }
            }
            throw err;
        }
    }

    // Xoá người dùng
    async delete(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return await user.destroy();
    }

    // Nếu cần dùng transaction, có thể truyền { transaction } vào các hàm trên
}

module.exports = new UserRepository();