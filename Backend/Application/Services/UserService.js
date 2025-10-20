const UserRepository = require('../../Infrastructure/Repositories/UserRepository');
const UserDTO = require('../DTOs/UserDTO');

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
    }

    async updateUser(userId, updates) {
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
    }

    async deleteUser(userId) {
        return await this.userRepository.delete(userId);
    }
}

module.exports = UserService;
