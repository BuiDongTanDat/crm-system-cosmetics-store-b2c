
const UserRepository = require('../../../Infrastructure/Repositories/UserRepository');
const User = require('../../../Domain/Entities/User');

jest.mock('../../../Domain/Entities/User');

describe('UserRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Lấy người dùng theo ID', () => {
        it('trả về người dùng khi tìm thấy', async () => {
            const mockUser = { user_id: 1, full_name: 'Nguyen Van A' };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserRepository.findById(1);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUser);
        });

        it('trả về null khi không tìm thấy', async () => {
            User.findByPk.mockResolvedValue(null);

            const result = await UserRepository.findById(999);

            expect(User.findByPk).toHaveBeenCalledWith(999);
            expect(result).toBeNull();
        });
    });

    describe('Lấy tất cả người dùng', () => {
        it('trả về tất cả người dùng', async () => {
            const mockUsers = [{}, {}];
            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserRepository.findAll();

            expect(User.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });
    });

    describe('Tìm người dùng theo email', () => {
        it('trả về người dùng theo email', async () => {
            const mockUser = { email: 'a@email.com' };
            User.findOne.mockResolvedValue(mockUser);

            const result = await UserRepository.findByEmail('a@email.com');

            expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'a@email.com' } });
            expect(result).toEqual(mockUser);
        });
    });

    describe('Tạo người dùng', () => {
        it('tạo mới người dùng', async () => {
            const userData = { full_name: 'Nguyen Van B', email: 'b@email.com', password_hash: 'hash' };
            User.create.mockResolvedValue(userData);

            const result = await UserRepository.create(userData);

            expect(User.create).toHaveBeenCalledWith(userData);
            expect(result).toEqual(userData);
        });
    });

    describe('Cập nhật người dùng', () => {
        it('cập nhật người dùng khi tồn tại', async () => {
            const userId = 1;
            const updates = { full_name: 'Nguyen Van C' };
            const mockInstance = { update: jest.fn().mockResolvedValue({ user_id: 1, ...updates }) };
            User.findByPk.mockResolvedValue(mockInstance);

            const result = await UserRepository.update(userId, updates);

            expect(User.findByPk).toHaveBeenCalledWith(userId);
            expect(mockInstance.update).toHaveBeenCalledWith(updates);
            expect(result).toEqual({ user_id: 1, ...updates });
        });

        it('ném lỗi khi không tìm thấy người dùng', async () => {
            User.findByPk.mockResolvedValue(null);
            await expect(UserRepository.update(999, { full_name: 'X' })).rejects.toThrow('Người dùng không tồn tại');
        });
    });

    describe('Xoá người dùng', () => {
        it('xoá người dùng khi tồn tại', async () => {
            const mockInstance = { destroy: jest.fn().mockResolvedValue(1) };
            User.findByPk.mockResolvedValue(mockInstance);

            const result = await UserRepository.delete(1);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(mockInstance.destroy).toHaveBeenCalled();
            expect(result).toBe(1);
        });

        it('ném lỗi khi không tìm thấy người dùng', async () => {
            User.findByPk.mockResolvedValue(null);
            await expect(UserRepository.delete(999)).rejects.toThrow('Người dùng không tồn tại');
        });
    });

    describe('Cập nhật mật khẩu', () => {
        it('cập nhật mật khẩu khi tồn tại', async () => {
            const mockInstance = {
                password_hash: 'oldhash',
                save: jest.fn().mockResolvedValue({
                    user_id: 1,
                    password_hash: 'newhash'
                })
            };

            User.findByPk.mockResolvedValue(mockInstance);

            const result = await UserRepository.updatePassword(1, 'newhash');

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(mockInstance.password_hash).toBe('newhash');
            expect(mockInstance.save).toHaveBeenCalled();
            expect(result).toEqual({
                user_id:1,
                password_hash: 'newhash'
            })
        });

        it('ném lỗi khi không tìm thấy người dùng', async () => {
            User.findByPk.mockResolvedValue(null);
            await expect(UserRepository.updatePassword(999, 'newhash')).rejects.toThrow('Người dùng không tồn tại');
        });
    });
});