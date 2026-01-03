const AutomationActionTypeService = require('../../../Application/Services/AutomationActionTypeService');

describe('AutomationActionTypeService', () => {
  const repo = {
    findById: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    delete: jest.fn(),
  };
  const logger = { log: jest.fn(), error: jest.fn() };
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AutomationActionTypeService.constructor({ repo, logger });
  });

  describe('Tạo loại action', () => {
    it('tạo thành công với đầy đủ trường', async () => {
      repo.findById.mockResolvedValue(null);
      repo.create.mockResolvedValue({ action_type: 'email', name: 'Action A' });
      const dto = {
        action_type: 'email',
        name: 'Action A',
        description: 'Gửi email',
        config_schema: { to: 'string' },
        supported_channels: ['email'],
        is_active: true,
        handler_kind: 'primitive',
      };
      const result = await service.create(dto);
      expect(result).toEqual({ action_type: 'email', name: 'Action A' });
    });
    it('tự động lấy tên từ action_type nếu thiếu name', async () => {
      repo.findById.mockResolvedValue(null);
      repo.create.mockResolvedValue({ action_type: 'sms', name: 'sms' });
      const dto = { action_type: 'sms' };
      
      const result = await service.create(dto);
      
      expect(result).toEqual({ action_type: 'sms', name: 'sms' });
    });
    it('Báo lỗi khi thiếu action_type', async () => {
      await expect(service.create({ name: 'Action B' })).rejects.toThrow('action_type is required');
    });
    it('Báo lỗi khi loại action đã tồn tại', async () => {
      repo.findById.mockResolvedValue({ action_type: 'email' });
      await expect(service.create({ action_type: 'email', name: 'Action A' })).rejects.toThrow('Action type already exists');
    });
  });

  describe('Upsert loại action', () => {
    it('Upsert thành công với đầy đủ trường', async () => {
      repo.upsert.mockResolvedValue({ action_type: 'webhook', name: 'Action B' });
      const dto = {
        action_type: 'webhook',
        name: 'Action B',
        description: 'Gửi webhook',
        config_schema: { url: 'string' },
        supported_channels: ['web'],
        is_active: false,
        handler_kind: 'custom',
      };
      const result = await service.upsert(dto);
      expect(result).toEqual({ action_type: 'webhook', name: 'Action B' });
    });
    it('Tự động lấy tên từ action_type nếu thiếu name', async () => {
      repo.upsert.mockResolvedValue({ action_type: 'push', name: 'push' });
      const dto = { action_type: 'push' };
      
      const result = await service.upsert(dto);
      
      expect(result).toEqual({ action_type: 'push', name: 'push' });
    });
    it('Báo lỗi khi thiếu action_type', async () => {
      await expect(service.upsert({ name: 'Action C' })).rejects.toThrow('action_type is required');
    });
  });

  describe('Lấy loại action', () => {
    it('Trả về loại action nếu tìm thấy', async () => {
      repo.findById.mockResolvedValue({ action_type: 'email', name: 'Action A' });
      
      const result = await service.get('email');
      
      expect(result).toEqual({ action_type: 'email', name: 'Action A' });
    });
    it('Báo lỗi khi không tìm thấy', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.get('notfound')).rejects.toThrow('Action type not found');
    });
  });

  describe('Liệt kê loại action', () => {
    it('trả về danh sách loại action', async () => {
      const params = { is_active: true };
      repo.list.mockResolvedValue([
        { action_type: 'email', name: 'Action A' },
        { action_type: 'webhook', name: 'Action B' },
      ]);
      
      const result = await service.list(params);
      
      expect(result).toEqual([
        { action_type: 'email', name: 'Action A' },
        { action_type: 'webhook', name: 'Action B' },
      ]);
    });
  });

  describe('Cập nhật loại action', () => {
    it('cập nhật thành công nếu tìm thấy', async () => {
      repo.update.mockResolvedValue({ action_type: 'email', name: 'Action A', description: 'Đã cập nhật' });
      const result = await service.update('email', { description: 'Đã cập nhật' });
      expect(result).toEqual({ action_type: 'email', name: 'Action A', description: 'Đã cập nhật' });
    });
    it('Báo lỗi khi không tìm thấy', async () => {
      repo.update.mockResolvedValue(null);
      await expect(service.update('notfound', {})).rejects.toThrow('Action type not found');
    });
  });

  describe('Bật/tắt loại action', () => {
    it('bật/tắt thành công nếu tìm thấy', async () => {
      repo.setActive.mockResolvedValue({ action_type: 'email', is_active: false });
      const result = await service.setActive('email', false);
      expect(result).toEqual({ action_type: 'email', is_active: false });
    });
    it('báo lỗi khi không tìm thấy', async () => {
      repo.setActive.mockResolvedValue(null);
      await expect(service.setActive('notfound', true)).rejects.toThrow('Action type not found');
    });
  });

  describe('Xóa loại action', () => {
    it('xóa thành công nếu tìm thấy', async () => {
      repo.delete.mockResolvedValue(true);
      const result = await service.remove('email');
      expect(result).toEqual({ ok: true });
    });
    it('báo lỗi khi không tìm thấy', async () => {
      repo.delete.mockResolvedValue(false);
      await expect(service.remove('notfound')).rejects.toThrow('Action type not found');
    });
  });
});
