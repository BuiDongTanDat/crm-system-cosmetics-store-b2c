const UserRepository = require('../../Infrastructure/Repositories/UserRepository');
const UserDTO = require('../DTOs/UserDTO');
const { UniqueConstraintError, ValidationError } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const bcrypt = require('bcrypt');

class UserService {
    constructor(repo = UserRepository) {
        this.userRepository = repo;
    }

    async getAllUsers() {
        const users = await this.userRepository.findAll();
        return users.map(UserDTO.fromEntity);
    }

    async getUserById(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) return null;
        return UserDTO.fromEntity(user);
    }

    async createUser(userData) {
        try {
            const user = await this.userRepository.create(userData);
            return UserDTO.fromEntity(user);
        } catch (err) {
            //  Xử lý lỗi unique
            if (err instanceof UniqueConstraintError) {
                const field = err.errors?.[0]?.path;
                if (field === 'email') throw new Error('Email đã tồn tại');
                if (field === 'phone') throw new Error('Số điện thoại đã tồn tại');
                if (field === 'full_name') throw new Error('Tên đã tồn tại');
            }

            // Xử lý lỗi validation (email không hợp lệ, null, ...)
            if (err instanceof ValidationError) {
                const validatorKey = err.errors?.[0]?.validatorKey;
                const field = err.errors?.[0]?.path;

                if (validatorKey === 'isEmail') throw new Error('Email không hợp lệ');
                if (validatorKey === 'not_null' && field === 'email') throw new Error('Email là bắt buộc');
                if (validatorKey === 'not_null' && field === 'full_name') throw new Error('Tên là bắt buộc');
                if (validatorKey === 'not_null' && field === 'phone') throw new Error('Số điện thoại là bắt buộc');

                // fallback
                throw new Error('Dữ liệu không hợp lệ');
            }

            throw err;
        }
    }

    async updateUser(userId, updates) {
        try {
            const user = await this.userRepository.update(userId, updates);
            return UserDTO.fromEntity(user);
        } catch (err) {
            if (err instanceof UniqueConstraintError) {
                const field = err.errors && err.errors[0] && err.errors[0].path;
                if (field === 'email') throw new Error('Email đã tồn tại');
                if (field === 'phone') throw new Error('Số điện thoại đã tồn tại');
                if (field === 'full_name') throw new Error('Tên đã tồn tại');
            }

            // Xử lý lỗi validation (email không hợp lệ, null, ...)
            if (err instanceof ValidationError) {
                const validatorKey = err.errors?.[0]?.validatorKey;
                const field = err.errors?.[0]?.path;

                if (validatorKey === 'isEmail') throw new Error('Email không hợp lệ');
                if (validatorKey === 'not_null' && field === 'email') throw new Error('Email là bắt buộc');
                if (validatorKey === 'not_null' && field === 'full_name') throw new Error('Tên là bắt buộc');
                if (validatorKey === 'not_null' && field === 'phone') throw new Error('Số điện thoại là bắt buộc');

                // fallback
                throw new Error('Dữ liệu không hợp lệ');
            }

            // propagate not-found or other errors
            throw err;
        }
    }

    async deleteUser(userId) {
        try {
            return await this.userRepository.delete(userId);
        } catch (err) {
            // preserve repository 'User not found' message or rethrow others
            throw err;
        }
    }

    // Đổi mật khẩu
    async changePassword(userId, oldPassword, newPassword) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('Không tìm thấy người dùng');

        const valid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!valid) throw new Error('Mật khẩu cũ không chính xác');

        const hashed = await bcrypt.hash(newPassword, 10);
        await UserRepository.updatePassword(userId, hashed);
    }

    // Cập nhật avatar
    async updateAvatar(userId, file) {
        if (!file) throw new Error('Không có file được tải lên');
        // TÌm user
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error('Người dùng không tồn tại');

        //Xóa avatar cũ nếu có
        if (user.avatar_id) {
            try {
                await cloudinary.uploader.destroy(user.avatar_id);
            } catch (err) {
                console.warn('Xóa avatar cũ thất bại:', err.message);
            }
        }

        // Upload lên cloudinary
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: "crm_avatars"
        });

        // Xóa file tạm
        fs.unlinkSync(file.path);

        // Lưu DB
        const updates = {
            avatar_url: uploadResult.secure_url,
            avatar_id: uploadResult.public_id
        };

        const updatedUser = await this.userRepository.update(userId, updates);
        return updatedUser;

    }
}

module.exports = UserService;
