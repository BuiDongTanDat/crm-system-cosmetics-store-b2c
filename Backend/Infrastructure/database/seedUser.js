const UserService = require('../../Application/Services/UserService');
const userService = new UserService();

async function seedUser() {
    console.log('[Seed] Seeding User qua service...');
    try {
        await Promise.all([
            userService.createUser({
                full_name: 'Admin User',
                email: 'admin@example.com',
                phone: '0901234567',
                password_hash: '12345678',
                role_name: 'Admin',
                status: 'active',
            }),
            userService.createUser({
                full_name: 'Tan San',
                email: 'bdtd1ad@gmail.com',
                phone: '0901234524',
                password_hash: '12345678',
                role_name: 'Admin',
                status: 'active',
            }),
            userService.createUser({
                full_name: 'Marketing User',
                email: 'marketing1@example.com',
                phone: '0901234566',
                password_hash: '123456',
                role_name: 'Marketing',
                status: 'active',
            }),
            userService.createUser({
                full_name: 'Sales User',
                email: 'sale1@example.com',
                phone: '0901234565',
                password_hash: '12345678',
                role_name: 'Sale',
                status: 'active',
            }),
            userService.createUser({
                full_name: 'Blocked user',
                email: 'sale2@example.com',
                phone: '0901234564',
                password_hash: '12345678',
                role_name: 'Sale',
                status: 'inactive',
            }),
        ]);
        console.log('[Seed] Admin user created');
    } catch (err) {
        console.warn('[Seed] Skip admin seed:', err.message);
    }
}

module.exports = {seedUser};