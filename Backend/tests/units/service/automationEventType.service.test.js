const AutomationEventTypeService = require('../../../Application/Services/AutomationEventTypeService');

describe('Dịch vụ AutomationEventTypeService', () => {
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
    service = new AutomationEventTypeService.constructor({ repo, logger });
  });

  describe('Tạo loại sự kiện', () => {
    it('tạo thành công với đầy đủ trường', async () => {
      repo.findById.mockResolvedValue(null);
      repo.create.mockResolvedValue({ event_type: 'user_signup', name: 'Sự kiện đăng ký' });
      const dto = {
        event_type: 'user_signup',
        name: 'Sự kiện đăng ký',
        description: 'Khi người dùng đăng ký',
        payload_schema: { email: 'string' },
        is_active: true,
      };
      
      const result = await service.create(dto);
      
      expect(result).toEqual({ event_type: 'user_signup', name: 'Sự kiện đăng ký' });
    });
    it('tTự động lấy tên từ event_type nếu thiếu name', async () => {
      repo.findById.mockResolvedValue(null);
      repo.create.mockResolvedValue({ event_type: 'order_created', name: 'order_created' });
      const dto = { event_type: 'order_created' };
      
      const result = await service.create(dto);
      
      expect(result).toEqual({ event_type: 'order_created', name: 'order_created' });
    });
    it('Báo lỗi khi thiếu event_type', async () => {
      await expect(service.create({ name: 'Sự kiện test' })).rejects.toThrow('event_type is required');
    });
    it('Báo lỗi khi loại sự kiện đã tồn tại', async () => {
      repo.findById.mockResolvedValue({ event_type: 'user_signup' });
      await expect(service.create({ event_type: 'user_signup', name: 'Sự kiện đăng ký' })).rejects.toThrow('Event type already exists');
    });
  });

  describe('Upsert loại sự kiện', () => {
    it('Upsert thành công với đầy đủ trường', async () => {
      repo.upsert.mockResolvedValue({ event_type: 'order_paid', name: 'Sự kiện thanh toán' });
      const dto = {
        event_type: 'order_paid',
        name: 'Sự kiện thanh toán',
        description: 'Khi đơn hàng được thanh toán',
        payload_schema: { order_id: 'string' },
        is_active: false,
      };
      
      const result = await service.upsert(dto);
      
      expect(result).toEqual({ event_type: 'order_paid', name: 'Sự kiện thanh toán' });
    });
    it('Tự động lấy tên từ event_type nếu thiếu name', async () => {
      repo.upsert.mockResolvedValue({ event_type: 'user_login', name: 'user_login' });
      const dto = { event_type: 'user_login' };
      
      const result = await service.upsert(dto);
      
      expect(result).toEqual({ event_type: 'user_login', name: 'user_login' });
    });
    it('Báo lỗi khi thiếu event_type', async () => {
      await expect(service.upsert({ name: 'Sự kiện test' })).rejects.toThrow('event_type is required');
    });
  });

  describe('Lấy loại sự kiện', () => {
    it('Trả về loại sự kiện nếu tìm thấy', async () => {
      repo.findById.mockResolvedValue({ event_type: 'user_signup', name: 'Sự kiện đăng ký' });
      
      const result = await service.get('user_signup');
      
      expect(result).toEqual({ event_type: 'user_signup', name: 'Sự kiện đăng ký' });
    });
    it('Báo lỗi khi không tìm thấy', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.get('notfound')).rejects.toThrow('Event type not found');
    });
  });

  describe('Liệt kê loại sự kiện', () => {
    it('Trả về danh sách loại sự kiện', async () => {
      const params = { is_active: true };
      repo.list.mockResolvedValue([
        { event_type: 'user_signup', name: 'Sự kiện đăng ký' },
        { event_type: 'order_paid', name: 'Sự kiện thanh toán' },
      ]);
      
      const result = await service.list(params);
      
      expect(result).toEqual([
        { event_type: 'user_signup', name: 'Sự kiện đăng ký' },
        { event_type: 'order_paid', name: 'Sự kiện thanh toán' },
      ]);
    });
  });

  describe('Cập nhật loại sự kiện', () => {
    it('Cập nhật thành công nếu tìm thấy', async () => {
      repo.update.mockResolvedValue({ event_type: 'user_signup', name: 'Sự kiện đăng ký', description: 'Đã cập nhật' });
      
      const result = await service.update('user_signup', { description: 'Đã cập nhật' });
      
      expect(result).toEqual({ event_type: 'user_signup', name: 'Sự kiện đăng ký', description: 'Đã cập nhật' });
    });
    it('Báo lỗi khi không tìm thấy', async () => {
      repo.update.mockResolvedValue(null);
      await expect(service.update('notfound', {})).rejects.toThrow('Event type not found');
    });
  });

  describe('Bật/tắt loại sự kiện', () => {
    it('Bật/tắt thành công nếu tìm thấy', async () => {
      repo.setActive.mockResolvedValue({ event_type: 'user_signup', is_active: false });
      
      const result = await service.setActive('user_signup', false);
      
      expect(result).toEqual({ event_type: 'user_signup', is_active: false });
    });
    it('Báo lỗi khi không tìm thấy', async () => {
      repo.setActive.mockResolvedValue(null);
      await expect(service.setActive('notfound', true)).rejects.toThrow('Event type not found');
    });
  });

  describe('Xóa loại sự kiện', () => {
    it('Xóa thành công nếu tìm thấy', async () => {
      repo.delete.mockResolvedValue(true);
      
      const result = await service.remove('user_signup');
      
      expect(result).toEqual({ ok: true });
    });
    it('Báo lỗi khi không tìm thấy', async () => {
      repo.delete.mockResolvedValue(false);
      await expect(service.remove('notfound')).rejects.toThrow('Event type not found');
    });
  });
});
