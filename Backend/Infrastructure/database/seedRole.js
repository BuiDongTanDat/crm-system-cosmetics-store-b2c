const RoleService = require('../../Application/Services/RoleService');
const UserService = require('../../Application/Services/UserService');
const userService = new UserService();


async function seedRole() {
    console.log('[Seed] Seeding Role qua service...');
    ROLE_LIST = [
        {
            role_name: "Admin",
            description: "Vai trò Quản trị viên, có tất cả quyền hạn truy cập hệ thống",
            permissions: [
                { name: "user", "create": true, "read": true, "update": true, "delete": true },
                { name: "customer", "create": true, "read": true, "update": true, "delete": true },
                { name: "role", "create": true, "read": true, "update": true, "delete": true },
                { name: "lead", "create": true, "read": true, "update": true, "delete": true },
                { name: "campaign", "create": true, "read": true, "update": true, "delete": true },
                { name: "automation", "create": true, "read": true, "update": true, "delete": true },
                { name: "order", "create": true, "read": true, "update": true, "delete": true },
                { name: "product", "create": true, "read": true, "update": true, "delete": true },
                { name: "category", "create": true, "read": true, "update": true, "delete": true },
                { name: "youtube", create: true }
            ]
        }, {

            role_name: "Marketing",
            description: "Vai trò Marketing, quản lý chiến dịch, automation, lead và khách hàng",
            permissions: [
                { name: "campaign", "create": true, "read": true, "update": true, "delete": false },
                { name: "automation", "create": true, "read": true, "update": true, "delete": false },
                { name: "lead", "create": true, "read": true, "update": true, "delete": false },
                { name: "customer", "create": true, "read": true, "update": true, "delete": false },
                { name: "product", "create": false, "read": true, "update": false, "delete": false },
                { name: "order", "create": false, "read": true, "update": false, "delete": false },
                { name: "role", "create": false, "read": true, "update": false, "delete": false },
                { name: "user", "create": false, "read": true, "update": false, "delete": false },
                { name: "category", "create": false, "read": true, "update": false, "delete": false },
                { name: "youtube", create: true }
            ]
        },
        {
            role_name: "Sale",
            description: "Vai trò Sale, quản lý khách hàng, lead, đơn hàng và sản phẩm",
            permissions: [
                { name: "lead", "create": true, "read": true, "update": true, "delete": false },
                { name: "customer", "create": true, "read": true, "update": true, "delete": false },
                { name: "order", "create": true, "read": true, "update": true, "delete": false },
                { name: "product", "create": true, "read": true, "update": true, "delete": false },
                { name: "campaign", "create": false, "read": true, "update": false, "delete": false },
                { name: "automation", "create": false, "read": true, "update": false, "delete": false },
                { name: "role", "create": false, "read": true, "update": false, "delete": false },
                { name: "user", "create": false, "read": true, "update": false, "delete": false },
                { name: "category", "create": false, "read": true, "update": false, "delete": false },
                { name: "youtube", create: true }
            ]
        }
    ]
    //Tạo role
    await Promise.all(ROLE_LIST.map(async (roleData) => {
        try {
            await RoleService.createRole(roleData);
            console.log(`[Seed] Role ${roleData.role_name} created`);
        } catch (error) {
            console.warn(`[Seed] Skip role ${roleData.role_name} seed:`, error.message);
        }
    }));
}

module.exports = {seedRole};