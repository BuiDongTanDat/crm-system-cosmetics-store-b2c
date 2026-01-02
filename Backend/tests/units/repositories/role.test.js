
const RoleRepository = require('../../../Infrastructure/Repositories/RoleRepository');
const Role = require('../../../Domain/Entities/Role');

jest.mock('../../../Domain/Entities/Role');

// Ở role, thì khóa chính là role name nha
describe('RoleRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Lấy tất cả vai trò', () => {
        it('trả về danh sách các role', async () => {
            const mockRole = [{ role_id: 1, name: 'Admin' }, { role_id: 2, name: 'User' }];
            Role.findAll.mockResolvedValue(mockRole);

            const result = await RoleRepository.getAllRoles();

            expect(Role.findAll).toHaveBeenCalled();
            expect(result.length).toEqual(2);
        });

        it('trả về null khi không tìm thấy', async () => {
            Role.findAll.mockResolvedValue(null);

            const result = await RoleRepository.getAllRoles();

            expect(Role.findAll).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
    describe('Lấy role theo tên', () => {
        it('trả về role khi tìm thấy', async () => {
            const mockRole = { role_id: 1, name: 'Admin' };
            Role.findOne.mockResolvedValue(mockRole);

            const result = await RoleRepository.getRoleByName('Admin');

            expect(Role.findOne).toHaveBeenCalled();
            expect(result).toEqual(mockRole);
        });

        it('trả về null khi không tìm thấy', async () => {
            Role.findOne.mockResolvedValue(null);

            const result = await RoleRepository.getRoleByName('Admin');

            expect(Role.findOne).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });


    describe('Tạo role', () => {
        it('tạo mới role', async () => {
            const roleData = { name: 'User' };
            Role.create.mockResolvedValue(roleData);

            const result = await RoleRepository.createRole(roleData);

            expect(Role.create).toHaveBeenCalledWith(roleData);
            expect(result).toEqual(roleData);
        });
    });

    describe('Cập nhật role', () => {
        it('cập nhật role khi tồn tại', async () => {
            const roleName = 'Admin';
            const updates = { description: 'Update desc' };
            const mockInstance = { roleName: 'Admin', description: 'old desc', update: jest.fn().mockResolvedValue({ role_name: 'Admin', ...updates }) };
            Role.findOne.mockResolvedValue(mockInstance);

            const result = await RoleRepository.updateRole(roleName, updates);

            expect(Role.findOne).toHaveBeenCalledWith({ where: { role_name: 'Admin' } });
            expect(mockInstance.update).toHaveBeenCalledWith(updates);
            expect(result).toEqual({ role_name: 'Admin', ...updates });
        });

        it('ném lỗi khi không tìm thấy role', async () => {
            Role.findOne.mockResolvedValue(null);
            await expect(RoleRepository.updateRole('Admin', { description: 'desc' })).rejects.toThrow();
        });
    });

    describe('Xoá role', () => {
        it('xoá role khi tồn tại', async () => {
            const mockInstance = { destroy: jest.fn().mockResolvedValue('Admin') };
            Role.findOne.mockResolvedValue(mockInstance);

            const result = await RoleRepository.deleteRole('Admin');

            expect(Role.findOne).toHaveBeenCalledWith({"where": {"role_name": 'Admin'}});
            expect(mockInstance.destroy).toHaveBeenCalled();
            expect(result).toBe('Admin');
        });

        it('ném lỗi khi không tìm thấy role', async () => {
            Role.findOne.mockResolvedValue(null);
            await expect(RoleRepository.deleteRole('User')).rejects.toThrow();
        });
    });
});

