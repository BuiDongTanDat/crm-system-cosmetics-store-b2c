// Mock các hàm và module cần thiết
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn()
    }
  }
}));
jest.mock('../../../Infrastructure/Repositories/UserRepository');
jest.mock('../../../Application/DTOs/UserDTO');

const bcrypt = require('bcrypt');
const UserRepository = require('../../../Infrastructure/Repositories/UserRepository');
const UserServiceClass = require('../../../Application/Services/UserService');
const UserDTO = require('../../../Application/DTOs/UserDTO');
const { UniqueConstraintError, ValidationError } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

jest.mock('../../../Infrastructure/Repositories/UserRepository');
jest.mock('../../../Application/DTOs/UserDTO');

jest.mock('fs');

const UserService = new UserServiceClass(UserRepository);

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Lấy tất cả user', () => {
    it('trả về danh sách người dùng', async () => {
      const users = [{ id: 1 }, { id: 2 }];
      UserRepository.findAll.mockResolvedValue(users);
      UserDTO.fromEntity.mockImplementation(u => u);

      const result = await UserService.getAllUsers();

      expect(UserRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('Lấy user theo id', () => {
    it('trả về user khi tìm thấy', async () => {
      const user = { id: 1 };
      UserRepository.findById.mockResolvedValue(user);
      UserDTO.fromEntity.mockImplementation(u => u);

      const result = await UserService.getUserById(1);

      expect(UserRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('trả về null nếu không tìm thấy', async () => {
      UserRepository.findById.mockResolvedValue();

      const result = await UserService.getUserById(99);

      expect(result).toBeNull();
    });
  });

  describe('Tạo user', () => {
    it('tạo user thành công', async () => {
      const user = { id: 1, email: 'user1@gmail.com' };
      UserRepository.create.mockResolvedValue(user);
      UserDTO.fromEntity.mockImplementation(u => u);

      const result = await UserService.createUser(user);

      expect(UserRepository.create).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });

    it('báo lỗi khi email đã tồn tại', async () => {
      const err = new UniqueConstraintError({ errors: [{ path: 'email' }] });
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({ email: 'user1@gmail.com' })).rejects.toThrow('Email đã tồn tại');
    });

    it('báo lỗi khi phone đã tồn tại', async () => {
      const err = new UniqueConstraintError({ errors: [{ path: 'phone' }] });
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({ phone: '123456789' })).rejects.toThrow('Số điện thoại đã tồn tại');
    });

    it('báo lỗi khi tên đã tồn tại', async () => {
      const err = new UniqueConstraintError({ errors: [{ path: 'full_name' }] });
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({ full_name: 'Nguyen Van A' })).rejects.toThrow('Tên đã tồn tại');
    });

    it('báo lỗi khi email không hợp lệ', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'isEmail', path: 'email' }]);
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({ email: 'badEmail@' })).rejects.toThrow('Email không hợp lệ');
    });

    it('báo lỗi khi thiếu email', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'not_null', path: 'email' }]);
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({})).rejects.toThrow('Email là bắt buộc');
    });

    it('báo lỗi khi thiếu tên', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'not_null', path: 'full_name' }]);
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({})).rejects.toThrow('Tên là bắt buộc');
    });

    it('báo lỗi khi thiếu phone', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'not_null', path: 'phone' }]);
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({})).rejects.toThrow('Số điện thoại là bắt buộc');
    });

    it('báo lỗi dữ liệu không hợp lệ', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'other', path: 'email' }]);
      UserRepository.create.mockRejectedValue(err);

      await expect(UserService.createUser({})).rejects.toThrow('Dữ liệu không hợp lệ');
    });

    it('báo lỗi khác', async () => {
      UserRepository.create.mockRejectedValue(new Error('DB error'));
      await expect(UserService.createUser({})).rejects.toThrow('DB error');
    });
  });

  describe('Cập nhật user', () => {
    it('cập nhật user thành công', async () => {
      const user = { id: 1, email: 'NVA@gmail.com' };
      UserRepository.update.mockResolvedValue(user);
      UserDTO.fromEntity.mockImplementation(u => u);

      const result = await UserService.updateUser(1, { email: 'NVB@gmail.com' });

      expect(UserRepository.update).toHaveBeenCalledWith(1, { email: 'NVB@gmail.com' });
      expect(result).toEqual(user);
    });

    it('báo lỗi khi email đã tồn tại', async () => {
      const err = new UniqueConstraintError({ errors: [{ path: 'email' }] });
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, { email: 'userA@gmail.com' })).rejects.toThrow('Email đã tồn tại');
    });

    it('báo lỗi khi phone đã tồn tại', async () => {
      const err = new UniqueConstraintError({ errors: [{ path: 'phone' }] });
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, { phone: '123456789' })).rejects.toThrow('Số điện thoại đã tồn tại');
    });

    it('báo lỗi khi tên đã tồn tại', async () => {
      const err = new UniqueConstraintError({ errors: [{ path: 'full_name' }] });
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, { full_name: 'NGuyen Van A' })).rejects.toThrow('Tên đã tồn tại');
    });

    it('báo lỗi khi email không hợp lệ', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'isEmail', path: 'email' }]);
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, { email: 'badEmail' })).rejects.toThrow('Email không hợp lệ');
    });

    it('báo lỗi khi thiếu email', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'not_null', path: 'email' }]);
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, {})).rejects.toThrow('Email là bắt buộc');
    });

    it('báo lỗi khi thiếu tên', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'not_null', path: 'full_name' }]);
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, {})).rejects.toThrow('Tên là bắt buộc');
    });

    it('báo lỗi khi thiếu phone', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'not_null', path: 'phone' }]);
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, {})).rejects.toThrow('Số điện thoại là bắt buộc');
    });

    it('báo lỗi dữ liệu không hợp lệ', async () => {
      const err = new ValidationError('msg', [{ validatorKey: 'other', path: 'email' }]);
      UserRepository.update.mockRejectedValue(err);

      await expect(UserService.updateUser(1, {})).rejects.toThrow('Dữ liệu không hợp lệ');
    });

    it('báo lỗi khác', async () => {
      UserRepository.update.mockRejectedValue(new Error('DB error'));
      await expect(UserService.updateUser(1, {})).rejects.toThrow('DB error');
    });
  });

  describe('Xóa user', () => {
    it('xóa user thành công', async () => {
      UserRepository.delete.mockResolvedValue(true);

      const result = await UserService.deleteUser(1);

      expect(UserRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('báo lỗi khi xóa thất bại', async () => {
      UserRepository.delete.mockRejectedValue(new Error('DB error'));
      await expect(UserService.deleteUser(1)).rejects.toThrow('DB error');
    });
  });

  describe('Đổi mật khẩu', () => {
    it('đổi mật khẩu thành công', async () => {
      const user = { id: 1, password_hash: 'oldhash' };
      UserRepository.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('newhash');
      UserRepository.updatePassword = jest.fn().mockResolvedValue();

      await UserService.changePassword(1, 'oldPass', 'newPass');

      expect(UserRepository.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPass', 'oldhash');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass', 10);
      expect(UserRepository.updatePassword).toHaveBeenCalledWith(1, 'newhash');
    });

    it('báo lỗi nếu không tìm thấy user', async () => {
      UserRepository.findById.mockResolvedValue(null);

      await expect(UserService.changePassword(1, 'oldPass', 'newPass')).rejects.toThrow('Không tìm thấy người dùng');
    });

    it('báo lỗi nếu mật khẩu cũ sai', async () => {
      UserRepository.findById.mockResolvedValue({ id: 1, password_hash: 'oldhash' });
      bcrypt.compare.mockResolvedValue(false);

      await expect(UserService.changePassword(1, 'oldPass', 'newPass')).rejects.toThrow('Mật khẩu cũ không chính xác');
    });
  });

  describe('updateAvatar', () => {
    it('cập nhật avatar thành công, xóa avatar cũ nếu có', async () => {
      const user = { id: 1, avatar_id: 'oldid' };
      const file = { path: '/tmp/file.png' };
      UserRepository.findById.mockResolvedValue(user);
      cloudinary.uploader.destroy.mockResolvedValue();
      cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'url', public_id: 'newid' });
      fs.unlinkSync.mockImplementation(() => {});
      UserRepository.update.mockResolvedValue({ ...user, avatar_url: 'url', avatar_id: 'newid' });

      const result = await UserService.updateAvatar(1, file);

      expect(UserRepository.findById).toHaveBeenCalledWith(1);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('oldid');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith('/tmp/file.png', { folder: "crm_avatars" });
      expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/file.png');
      expect(UserRepository.update).toHaveBeenCalled();
      expect(result.avatar_url).toBe('url');
    });

    it('cập nhật avatar thành công, không xóa avatar cũ nếu không có', async () => {
      const user = { id: 1 };
      const file = { path: '/tmp/file.png' };
      UserRepository.findById.mockResolvedValue(user);
      cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'url', public_id: 'newid' });
      fs.unlinkSync.mockImplementation(() => {});
      UserRepository.update.mockResolvedValue({ ...user, avatar_url: 'url', avatar_id: 'newid' });

      const result = await UserService.updateAvatar(1, file);

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(result.avatar_url).toBe('url');
    });

    it('báo lỗi nếu không có file', async () => {
      await expect(UserService.updateAvatar(1, null)).rejects.toThrow('Không có file được tải lên');
    });

    it('báo lỗi nếu user không tồn tại', async () => {
      UserRepository.findById.mockResolvedValue(null);

      await expect(UserService.updateAvatar(1, { path: '/tmp/file.png' })).rejects.toThrow('Người dùng không tồn tại');
    });

    it('báo lỗi khi xóa avatar cũ thất bại nhưng vẫn tiếp tục', async () => {
      const user = { id: 1, avatar_id: 'oldid' };
      const file = { path: '/tmp/file.png' };
      UserRepository.findById.mockResolvedValue(user);
      cloudinary.uploader.destroy.mockRejectedValue(new Error('fail'));
      cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'url', public_id: 'newid' });
      fs.unlinkSync.mockImplementation(() => {});
      UserRepository.update.mockResolvedValue({ ...user, avatar_url: 'url', avatar_id: 'newid' });

      const result = await UserService.updateAvatar(1, file);

      expect(result.avatar_url).toBe('url');
    });
  });
});
