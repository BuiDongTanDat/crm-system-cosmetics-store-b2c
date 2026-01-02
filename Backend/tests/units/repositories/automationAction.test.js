const { describe, it, expect, beforeEach } = require('@jest/globals');
const { Op } = require('sequelize');
const AutomationActionRepository = require('../../../Infrastructure/Repositories/AutomationActionRepository');
const AutomationAction = require('../../../Domain/Entities/AutomationAction');

jest.mock('../../../Domain/Entities/AutomationAction');

describe('AutomationActionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tạo action', () => {
    it('tạo thành công action mới', async () => {
      const dto = { flow_id: 1, trigger_id: 2, action_type: 'send_email' };
      const mockAction = { action_id: 10, ...dto };
      // Mock hàm create để trả về mockAction
      AutomationAction.create.mockResolvedValue(mockAction);

      const result = await AutomationActionRepository.create(dto);

      expect(AutomationAction.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAction);
    });
  });

  describe('Lấy action theo id', () => {
    it('trả về action theo id', async () => {
      const mockAction = { action_id: 1 };
      AutomationAction.findByPk.mockResolvedValue(mockAction);

      const result = await AutomationActionRepository.findById(1);

      expect(AutomationAction.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAction);
    });
  });

  describe('Lấy action theo trigger', () => {
    it('trả về danh sách action của trigger', async () => {
      const mockActions = [{ action_id: 1, trigger_id: 5 }];
      AutomationAction.findAll.mockResolvedValue(mockActions);

      const result = await AutomationActionRepository.findByTrigger(5);

      expect(AutomationAction.findAll).toHaveBeenCalledWith({
        where: { trigger_id: 5 },
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockActions);
    });
  });

  describe('Lấy action theo flow', () => {
    it('trả về danh sách action của flow', async () => {
      const mockActions = [{ action_id: 1, flow_id: 3 }];
      AutomationAction.findAll.mockResolvedValue(mockActions);

      const result = await AutomationActionRepository.findByFlow(3);

      expect(AutomationAction.findAll).toHaveBeenCalledWith({
        where: { flow_id: 3 },
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockActions);
    });
  });

  describe('Danh sách action', () => {
    it('trả về danh sách với phân trang', async () => {
      AutomationAction.findAll.mockResolvedValue([]);

      await AutomationActionRepository.list({ limit: 50, offset: 5 });

      const call = AutomationAction.findAll.mock.calls[0][0];
      expect(call.limit).toBe(50);
      expect(call.offset).toBe(5);
      expect(call.order).toEqual([['created_at', 'DESC']]);
    });

    it('lọc theo status', async () => {
      AutomationAction.findAll.mockResolvedValue([]);

      await AutomationActionRepository.list({ status: 'pending' });

      const call = AutomationAction.findAll.mock.calls[0][0];
      expect(call.where.status).toBe('pending');
    });
  });

  describe('Cập nhật action', () => {
    it('cập nhật thành công action', async () => {
      const mockAction = { action_id: 1, update: jest.fn() };
      mockAction.update.mockResolvedValue({ ...mockAction, status: 'sent' });
      AutomationAction.findByPk.mockResolvedValue(mockAction);

      const result = await AutomationActionRepository.update(1, { status: 'sent' });

      expect(AutomationAction.findByPk).toHaveBeenCalledWith(1);
      expect(mockAction.update).toHaveBeenCalledWith({ status: 'sent' });
      expect(result).toEqual(mockAction);
    });

    it('trả về null khi action không tồn tại', async () => {
      AutomationAction.findByPk.mockResolvedValue(null);

      const result = await AutomationActionRepository.update(999, { status: 'sent' });

      expect(result).toBeNull();
    });
  });

  describe('Xóa action', () => {
    it('gọi destroy với action_id', async () => {
      AutomationAction.destroy.mockResolvedValue(1);

      await AutomationActionRepository.delete(7);

      expect(AutomationAction.destroy).toHaveBeenCalledWith({ where: { action_id: 7 } });
    });
  });

  describe('Lấy action đến hạn', () => {
    it('lọc status pending và executed_at <= now', async () => {
      AutomationAction.findAll.mockResolvedValue([]);
      const now = new Date('2025-01-01');

      await AutomationActionRepository.findDue(now);

      const call = AutomationAction.findAll.mock.calls[0][0];
      expect(call.where.status).toBe('pending');
      expect(call.where.executed_at[Op.lte]).toEqual(now);
      expect(call.order).toEqual([['executed_at', 'ASC']]);
    });
  });

  describe('Đánh dấu đã gửi', () => {
    it('cập nhật status sent và executed_at', async () => {
      const mockAction = { action_id: 1, update: jest.fn() };
      mockAction.update.mockResolvedValue(mockAction);
      AutomationAction.findByPk.mockResolvedValue(mockAction);
      const ts = new Date('2025-02-02');

      const result = await AutomationActionRepository.markSent(1, ts);

      expect(AutomationAction.findByPk).toHaveBeenCalledWith(1);
      expect(mockAction.update).toHaveBeenCalledWith({ status: 'sent', executed_at: ts });
      expect(result).toEqual(mockAction);
    });

    it('trả về null khi không tìm thấy action', async () => {
      AutomationAction.findByPk.mockResolvedValue(null);

      const result = await AutomationActionRepository.markSent(999);

      expect(result).toBeNull();
    });
  });

  describe('Đánh dấu thất bại', () => {
    it('cập nhật status failed và lưu lỗi', async () => {
      const mockAction = { action_id: 1, content: {}, update: jest.fn() };
      mockAction.update.mockResolvedValue(mockAction);
      AutomationAction.findByPk.mockResolvedValue(mockAction);

      const result = await AutomationActionRepository.markFailed(1, 'Email rejected');

      expect(AutomationAction.findByPk).toHaveBeenCalledWith(1);
      const call = mockAction.update.mock.calls[0][0];
      expect(call.status).toBe('failed');
      expect(call.content._last_error).toBe('Email rejected');
      expect(result).toEqual(mockAction);
    });

    it('trả về null khi action không tồn tại', async () => {
      AutomationAction.findByPk.mockResolvedValue(null);

      const result = await AutomationActionRepository.markFailed(999, 'err');

      expect(result).toBeNull();
    });
  });

  describe('Xóa nhiều action', () => {
    it('xóa theo danh sách id', async () => {
      AutomationAction.destroy.mockResolvedValue(2);
      const result = await AutomationActionRepository.bulkDeleteByIds([1, 2, 3]);

      expect(AutomationAction.destroy).toHaveBeenCalled();
      const call = AutomationAction.destroy.mock.calls[0][0];
      expect(call.where.action_id[Op.in]).toEqual([1, 2,3]);
      expect(result).toBe(2);
    });

    it('trả về 0 khi danh sách rỗng', async () => {
      const result = await AutomationActionRepository.bulkDeleteByIds([]);

      expect(result).toBe(0);
    });
  });
});
