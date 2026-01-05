const RoleRepository = require('../../Infrastructure/Repositories/RoleRepository');

function permissionRoute(module, action) {
    return async (req, res, next) => {
        try {
            // // Lấy thông tin role user từ authMiddlewarte trước đó
            // const roleName = req.user?.role_name;
            // if (!roleName) {
            //     return res.status(403).json({ error: 'Vai trò người dùng không xác định' });
            // }
            // // Lấy quyền của user theo role name
            // const roleInfo = await RoleRepository.getRoleByName(roleName);
            // if (!roleInfo) {
            //     return res.status(403).json({ error: 'Không tìm thấy vai trò người dùng' });
            // }
            // const permissions = roleInfo.permissions;

            // const moduleName = permissions.find(p => p.name === module);
            // if (!moduleName || moduleName[action] !== true) {
            //     console.log(`User với vai trò ${roleName} KHÔNG có quyền ${action} trên module ${module}`);
            //     return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
            // }
            // console.log(`User với vai trò ${roleName} có quyền ${action} trên module ${module}`);
            // // Nếu có quyền, next()
            next();
        } catch (error) {
            console.error('Lỗi trong middleware kiểm tra quyền:', error);
            res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra quyền' });
        }
    }
}

module.exports = permissionRoute;