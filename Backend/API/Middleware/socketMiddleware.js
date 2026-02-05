const jwt = require('../../shared/utils/jwt');
const UserRepository = require('../../Infrastructure/Repositories/UserRepository');

async function socketAuthMiddleware(socket, next) {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Token không tồn tại'));
        }

        const decoded = await jwt.verifyAccessToken(token);
        const user = await UserRepository.findUserInSafeWay(decoded.id);
        if (!user) {
            return next(new Error('Người dùng không tồn tại'));
        }
        socket.user = user; // Gán user vào socket để sử dụng sau này
        next();
    } catch (error) {
        console.error('Lỗi xác thực socket:', error);
        next(new Error('Xác thực thất bại'));
    }
}

module.exports = socketAuthMiddleware;