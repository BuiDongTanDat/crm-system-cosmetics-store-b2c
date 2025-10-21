const UserRepository = require('../../Infrastructure/Repositories/UserRepository');
const UserDTO = require('../DTOs/UserDTO');
const { UniqueConstraintError, ValidationError  } = require('sequelize');

class UserService {
    constructor(repo = UserRepository) {
        this.userRepository = repo;
    }

    async getAllUsers() {
        const users = await this.userRepository.findAll();
        return users.map(user => new UserDTO({
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role_name: user.role_name,
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at
        }));
    }

    async getUserById(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) return null;
        return new UserDTO({
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role_name: user.role_name,
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at
        });
    }

    async createUser(userData) {
        try {
            const user = await this.userRepository.create(userData);
            return new UserDTO({
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role_name: user.role_name,
                status: user.status,
                created_at: user.created_at,
                updated_at: user.updated_at
            });
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
            return new UserDTO({
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role_name: user.role_name,
                status: user.status,
                created_at: user.created_at,
                updated_at: user.updated_at
            });
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
}

module.exports = UserService;
