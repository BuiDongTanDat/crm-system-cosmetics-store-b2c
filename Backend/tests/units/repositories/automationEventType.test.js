const { describe, it, expect, beforeEach } = require('@jest/globals');
const AutomationEventTypeRepository = require('../../../Infrastructure/Repositories/AutomationEventTypeRepository');
const AutomationEventType = require('../../../Domain/Entities/AutomationEventType');

jest.mock('../../../Domain/Entities/AutomationEventType');

describe('AutomationEventTypeRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lấy event type theo id', () => {
    it('trả về event type theo id', async () => {
      const mock = { event_type: 'user.signup', name: 'User Signup' };
      AutomationEventType.findByPk.mockResolvedValue(mock);

      const result = await AutomationEventTypeRepository.findById('user.signup');

      expect(AutomationEventType.findByPk).toHaveBeenCalledWith('user.signup');
      expect(result).toEqual(mock);
    });

    it('trả về null khi không tìm thấy', async () => {
      AutomationEventType.findByPk.mockResolvedValue(null);

      const result = await AutomationEventTypeRepository.findById('notfound');

      expect(result).toBeNull();
    });
  });

  describe('Danh sách event type', () => {
    it('trả về tất cả event type', async () => {
      const mock = [{ event_type: 'user.signup' }, { event_type: 'user.login' }];
      AutomationEventType.findAll.mockResolvedValue(mock);

      const result = await AutomationEventTypeRepository.list();

      expect(AutomationEventType.findAll).toHaveBeenCalled();
      expect(result).toEqual(mock);
    });

    it('lọc theo is_active', async () => {
      AutomationEventType.findAll.mockResolvedValue([]);

      await AutomationEventTypeRepository.list({ is_active: true });

      const call = AutomationEventType.findAll.mock.calls[0][0];
      expect(call.where.is_active).toBe(true);
    });

    it('tìm kiếm theo từ khóa', async () => {
      AutomationEventType.findAll.mockResolvedValue([]);

      await AutomationEventTypeRepository.list({ q: 'signup' });

      const call = AutomationEventType.findAll.mock.calls[0][0];
      expect(call.where.$or).toHaveLength(2);
    });

    it('hỗ trợ phân trang', async () => {
      AutomationEventType.findAll.mockResolvedValue([]);

      await AutomationEventTypeRepository.list({ limit: 50, offset: 10 });

      const call = AutomationEventType.findAll.mock.calls[0][0];
      expect(call.limit).toBe(50);
      expect(call.offset).toBe(10);
    });
  });

  describe('Tạo hoặc cập nhật event type', () => {
    it('upsert thành công event type', async () => {
      const dto = { event_type: 'order.created', name: 'Order Created' };
      const mock = { ...dto };
      AutomationEventType.upsert.mockResolvedValue([mock]);

      const result = await AutomationEventTypeRepository.upsert(dto);

      expect(AutomationEventType.upsert).toHaveBeenCalled();
      expect(result).toEqual(mock);
    });
  });

  describe('Tạo event type', () => {
    it('tạo thành công event type mới', async () => {
      const dto = { event_type: 'email.sent', name: 'Email Sent' };
      AutomationEventType.create.mockResolvedValue(dto);

      const result = await AutomationEventTypeRepository.create(dto);

      expect(AutomationEventType.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('Cập nhật event type', () => {
    it('cập nhật thành công event type', async () => {
      const mock = { event_type: 'user.signup', save: jest.fn() };
      AutomationEventType.findByPk.mockResolvedValue(mock);

      const result = await AutomationEventTypeRepository.update('user.signup', { name: 'New Name' });

      expect(AutomationEventType.findByPk).toHaveBeenCalledWith('user.signup');
      expect(mock.save).toHaveBeenCalled();
      expect(mock.updated_at).toBeDefined();
      expect(result).toEqual(mock);
    });

    it('trả về null khi không tìm thấy', async () => {
      AutomationEventType.findByPk.mockResolvedValue(null);

      const result = await AutomationEventTypeRepository.update('notfound', { name: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('Xóa event type', () => {
    it('xóa thành công event type', async () => {
      const mock = { destroy: jest.fn() };
      AutomationEventType.findByPk.mockResolvedValue(mock);

      const result = await AutomationEventTypeRepository.delete('user.login');

      expect(AutomationEventType.findByPk).toHaveBeenCalledWith('user.login');
      expect(mock.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('trả về false khi không tìm thấy', async () => {
      AutomationEventType.findByPk.mockResolvedValue(null);

      const result = await AutomationEventTypeRepository.delete('notfound');

      expect(result).toBe(false);
    });
  });

  describe('Kích hoạt/vô hiệu hóa event type', () => {
    it('kích hoạt event type', async () => {
      const mock = { event_type: 'user.signup', save: jest.fn() };
      AutomationEventType.findByPk.mockResolvedValue(mock);

      await AutomationEventTypeRepository.setActive('user.signup', true);

      expect(mock.save).toHaveBeenCalled();
    });

    it('vô hiệu hóa event type', async () => {
      const mock = { event_type: 'user.signup', save: jest.fn() };
      AutomationEventType.findByPk.mockResolvedValue(mock);

      await AutomationEventTypeRepository.setActive('user.signup', false);

      expect(mock.save).toHaveBeenCalled();
    });
  });
});
