const { Op } = require('sequelize');
const Session = require('../../Domain/Entities/Session');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

class SessionRepository {
    // Tạo session mới
    async createSession(sessionData) {
        try {
            return await Session.create(sessionData);
        } catch (err) {
            throw err;
        }
    }

    // Tìm session dựa trên refresh token
    async findByRefreshToken(refreshToken) {
        try {
            return await Session.findOne({
                where: { refresh_token: refreshToken }
            });
        } catch (err) {
            throw err;
        }   
    }

    // Xóa session dựa trên refresh token
    async deleteByRefreshToken(refreshToken) {
        try {
            await Session.destroy({
                where: { refresh_token: refreshToken }
            });
        } catch (err) {
            throw err;
        }
    }

   
}

module.exports = new SessionRepository();