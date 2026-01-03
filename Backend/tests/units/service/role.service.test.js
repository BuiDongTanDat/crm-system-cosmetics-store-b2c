const RoleRepository = require('../../../Infrastructure/Repositories/RoleRepository');
const RoleDTO = require('../../../Application/DTOs/RoleDTO');
const RoleService = require('../../../Application/Services/RoleService');
jest.mock('../../../Infrastructure/Repositories/RoleRepository');


describe('RoleService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Lấy tất cả vai trò', () => {
    it('trả về danh sách vai trò', async () => {
      const mockRoles = [
        { role_name: 'Admin', permissions: [] },
        { role_name: 'User', permissions: [] }
      ];
      RoleRepository.getAllRoles.mockResolvedValue(mockRoles);
      jest.spyOn(RoleDTO, 'fromEntity').mockImplementation(r => r);

      const result = await RoleService.getAllRoles();

      expect(RoleRepository.getAllRoles).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].role_name).toBe('Admin');
    });

    it('trả về mảng rỗng nếu không có vai trò', async () => {
      RoleRepository.getAllRoles.mockResolvedValue([]);
      jest.spyOn(RoleDTO, 'fromEntity').mockImplementation(r => r);

      const result = await RoleService.getAllRoles();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('xử lý lỗi khi lấy tất cả vai trò', async () => {
      RoleRepository.getAllRoles.mockRejectedValue(new Error('DB error'));
      await expect(RoleService.getAllRoles()).rejects.toThrow('DB error');
    });
  });

  describe('Lấy vai trò theo tên', () => {
    it('trả về vai trò theo tên', async () => {
      const mockRole = { role_name: 'Admin', permissions: [] };
      RoleRepository.getRoleByName.mockResolvedValue(mockRole);
      jest.spyOn(RoleDTO, 'fromEntity').mockImplementation(r => r);

      const result = await RoleService.getRoleByName('Admin');

      expect(RoleRepository.getRoleByName).toHaveBeenCalledWith('Admin');
      expect(result.role_name).toBe('Admin');
    });

    it('trả về null nếu không tìm thấy vai trò', async () => {
      RoleRepository.getRoleByName.mockResolvedValue(null);

      const result = await RoleService.getRoleByName('Unknown');

      expect(result).toBeNull();
    });

    it('xử lý lỗi khi lấy vai trò theo tên', async () => {
      RoleRepository.getRoleByName.mockRejectedValue(new Error('DB error'));
      await expect(RoleService.getRoleByName('Admin')).rejects.toThrow('DB error');
    });

    it('throw lỗi nếu tên vai trò không hợp lệ', async () => {
      await expect(RoleService.getRoleByName('')).rejects.toThrow('roleName phải là chuỗi không rỗng');
      await expect(RoleService.getRoleByName()).rejects.toThrow('roleName phải là chuỗi không rỗng');
    });
  });

  describe('Lấy permissions theo tên vai trò', () => {
    it('trả về permissions nếu có', async () => {
      RoleRepository.getRoleByName.mockResolvedValue({ role_name: 'Admin', permissions: [{ name: 'user', read: true }] });

      const result = await RoleService.getPermissionsByRoleName('Admin');

      expect(RoleRepository.getRoleByName).toHaveBeenCalledWith('Admin');
      expect(result).toEqual([{ name: 'user', read: true }]);
    });

    it('throw lỗi nếu không tìm thấy vai trò', async () => {
      RoleRepository.getRoleByName.mockResolvedValue(null);

      await expect(RoleService.getPermissionsByRoleName('Unknown')).rejects.toThrow('Vai trò không tồn tại');
    });

    it('throw lỗi nếu tên vai trò không hợp lệ', async () => {
      await expect(RoleService.getPermissionsByRoleName('')).rejects.toThrow('roleName phải là chuỗi không rỗng');
    });

    it('xử lý lỗi khi lấy permissions', async () => {
      RoleRepository.getRoleByName.mockRejectedValue(new Error('DB error'));
      await expect(RoleService.getPermissionsByRoleName('Admin')).rejects.toThrow('DB error');
    });
  });

  describe('Tạo mới vai trò', () => {
    it('tạo mới vai trò thành công', async () => {
      const data = { role_name: 'Editor', permissions: [{ name: 'user', create: true }] };
      RoleRepository.getRoleByName.mockResolvedValue(null);
      RoleRepository.createRole.mockResolvedValue(data);
      jest.spyOn(RoleDTO, 'fromEntity').mockImplementation(r => r);

      const result = await RoleService.createRole(data);

      expect(RoleRepository.getRoleByName).toHaveBeenCalledWith('Editor');
      expect(RoleRepository.createRole).toHaveBeenCalledWith(data);
      expect(result.role_name).toBe('Editor');
    });

    it('throw lỗi nếu tên vai trò đã tồn tại', async () => {
      RoleRepository.getRoleByName.mockResolvedValue({ role_name: 'Editor' });

      await expect(RoleService.createRole({ role_name: 'Editor', permissions: [] }))
        .rejects.toThrow('Tên vai trò đã tồn tại');
    });

    it('throw lỗi nếu dữ liệu không hợp lệ', async () => {
      await expect(RoleService.createRole({})).rejects.toThrow('role_name là bắt buộc');
      await expect(RoleService.createRole({ role_name: '' })).rejects.toThrow('role_name là bắt buộc');
    });

    it('xử lý lỗi khi tạo vai trò', async () => {
      RoleRepository.getRoleByName.mockRejectedValue(new Error('DB error'));
      await expect(RoleService.createRole({ role_name: 'Editor', permissions: [] })).rejects.toThrow('DB error');
    });
  });

  describe('Cập nhật vai trò', () => {
    it('cập nhật vai trò thành công', async () => {
      const updates = { permissions: [{ name: 'user', read: true }] };
      RoleRepository.updateRole.mockResolvedValue({ role_name: 'Editor', ...updates });
      jest.spyOn(RoleDTO, 'fromEntity').mockImplementation(r => r);

      const result = await RoleService.updateRole('Editor', updates);

      expect(RoleRepository.updateRole).toHaveBeenCalledWith('Editor', updates);
      expect(result.role_name).toBe('Editor');
    });

    it('throw lỗi nếu tên vai trò không hợp lệ', async () => {
      await expect(RoleService.updateRole('', {})).rejects.toThrow('roleName phải là chuỗi không rỗng');
    });

    it('throw lỗi nếu đổi tên trùng với vai trò khác', async () => {
      RoleRepository.getRoleByName.mockResolvedValue({ role_name: 'Admin' });
      const updates = { role_name: 'Admin' };

      await expect(RoleService.updateRole('Editor', updates)).rejects.toThrow('Tên vai trò đã tồn tại');
    });

    it('xử lý lỗi khi cập nhật vai trò', async () => {
      RoleRepository.updateRole.mockRejectedValue(new Error('DB error'));
      await expect(RoleService.updateRole('Editor', { permissions: [] })).rejects.toThrow('DB error');
    });
  });

  describe('Xóa vai trò', () => {
    it('xóa vai trò thành công', async () => {
      RoleRepository.deleteRole.mockResolvedValue(true);

      const result = await RoleService.deleteRole('Editor');

      expect(RoleRepository.deleteRole).toHaveBeenCalledWith('Editor');
      expect(result).toBe(true);
    });

    it('throw lỗi nếu tên vai trò không hợp lệ', async () => {
      await expect(RoleService.deleteRole('')).rejects.toThrow('roleName phải là chuỗi không rỗng');
    });

    it('xử lý lỗi khi xóa vai trò', async () => {
      RoleRepository.deleteRole.mockRejectedValue(new Error('DB error'));
      await expect(RoleService.deleteRole('Editor')).rejects.toThrow('DB error');
    });
  });
});
