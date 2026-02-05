const jwt = require('../../shared/utils/jwt');
const UserRepository = require('../../Infrastructure/Repositories/UserRepository');

async function protectedRoute(req, res, next) {
    // Lấy access token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ error: 'Token không tồn tại hoặc không hợp lệ' });
    }
    let decodeUser;
    try {
        decodeUser = jwt.verifyAccessToken(token); // throws if expired/invalid
    } catch (err) {
        return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    let user;
    try {
        user = await UserRepository.findUserInSafeWay(decodeUser.id); // Trường trả về là "id"
        console.log('User found:', user);
    } catch (err) {
        console.error('Lỗi khi truy vấn user:', err);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }

    if (!user) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    req.user = user;
    next();
}

module.exports = protectedRoute;
