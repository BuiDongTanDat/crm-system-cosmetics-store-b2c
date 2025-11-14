const { Op } = require('sequelize');
const User = require('../../Domain/Entities/User');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

class UserRepository {
    // Lấy người dùng theo ID
    async findById(userId) {
        return await User.findByPk(userId);
    }

    async findUserInSafeWay(userId) {
        return await User.findByPk(userId, {
            attributes: ['user_id', 'full_name', 'email','phone', 'role_name', 'status', 'avatar_url', 'bio']
        });
    }

    async findByEmail(email) {
        return await User.findOne({
            where: { email }
        });
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
            throw err;
        }
    }

    // Cập nhật người dùng
    async update(userId, updates) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('Người dùng không tồn tại');
        }
        try {
            return await user.update(updates);
        } catch (err) {
            throw err;
        }
    }

    // Xoá người dùng
    async delete(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('Người dùng không tồn tại');
        }
        return await user.destroy();
    }

    // Cập nhật mật khẩu
    async updatePassword(userId, newHashedPassword) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('Người dùng không tồn tại');
        }   
        user.password_hash = newHashedPassword;
        return await user.save();
    }

}

module.exports = new UserRepository();