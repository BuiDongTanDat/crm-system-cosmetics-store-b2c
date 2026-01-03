const { describe, it, expect, beforeEach } = require('@jest/globals');
const { Op } = require('sequelize');
const AutomationFlowRepository = require('../../../Infrastructure/Repositories/AutomationFlowRepository');
const AutomationFlow = require('../../../Domain/Entities/AutomationFlow');
const AutomationTriggerRepository = require('../../../Infrastructure/Repositories/AutomationTriggerRepository');
const AutomationActionRepository = require('../../../Infrastructure/Repositories/AutomationActionRepository');

jest.mock('../../../Domain/Entities/AutomationFlow');
jest.mock('../../../Infrastructure/Repositories/AutomationTriggerRepository');
jest.mock('../../../Infrastructure/Repositories/AutomationActionRepository');

describe('AutomationFlowRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tạo flow', () => {
    it('tạo thành công flow mới', async () => {
      const data = { name: 'Welcome Flow', description: 'Auto welcome', enabled: true };
      const mock = { flow_id: 1, ...data };
      AutomationFlow.create.mockResolvedValue(mock);

      const result = await AutomationFlowRepository.create(data);

      expect(AutomationFlow.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mock);
    });
  });

  describe('Lấy flow theo id', () => {
    it('trả về flow theo id', async () => {
      const mock = { flow_id: 1, name: 'Flow 1' };
      AutomationFlow.findByPk.mockResolvedValue(mock);

      const result = await AutomationFlowRepository.findById(1);

      expect(AutomationFlow.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mock);
    });

    it('trả về null khi không tìm thấy', async () => {
      AutomationFlow.findByPk.mockResolvedValue(null);

      const result = await AutomationFlowRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('Lấy tất cả flow', () => {
    it('trả về danh sách flow', async () => {
      const mock = [{ flow_id: 1 }, { flow_id: 2 }];
      AutomationFlow.findAll.mockResolvedValue(mock);

      const result = await AutomationFlowRepository.findAll();

      expect(AutomationFlow.findAll).toHaveBeenCalled();
      expect(result).toEqual(mock);
    });

    it('lọc theo enabled', async () => {
      AutomationFlow.findAll.mockResolvedValue([]);

      await AutomationFlowRepository.findAll({ enabled: true });

      const call = AutomationFlow.findAll.mock.calls[0][0];
      expect(call.where.enabled).toBe(true);
    });

    it('tìm kiếm theo tên', async () => {
      AutomationFlow.findAll.mockResolvedValue([]);

      await AutomationFlowRepository.findAll({ q: 'Welcome' });

      const call = AutomationFlow.findAll.mock.calls[0][0];
      expect(call.where.name[Op.iLike]).toBe('%Welcome%');
    });

    it('hỗ trợ phân trang', async () => {
      AutomationFlow.findAll.mockResolvedValue([]);

      await AutomationFlowRepository.findAll({ limit: 50, offset: 10 });

      const call = AutomationFlow.findAll.mock.calls[0][0];
      expect(call.limit).toBe(50);
      expect(call.offset).toBe(10);
    });
  });

  describe('Cập nhật flow', () => {
    it('cập nhật thành công flow', async () => {
      const mock = { flow_id: 1, update: jest.fn() };
      AutomationFlow.findByPk.mockResolvedValue(mock);

      const result = await AutomationFlowRepository.update(1, { name: 'New Name' });

      expect(AutomationFlow.findByPk).toHaveBeenCalledWith(1);
      expect(mock.update).toHaveBeenCalled();
      const call = mock.update.mock.calls[0][0];
      expect(call.updated_at).toBeDefined();
      expect(result).toEqual(mock);
    });

    it('trả về null khi flow không tồn tại', async () => {
      AutomationFlow.findByPk.mockResolvedValue(null);

      const result = await AutomationFlowRepository.update(999, { name: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('Xóa flow', () => {
    it('xóa flow thành công', async () => {
      AutomationFlow.destroy.mockResolvedValue(1);

      await AutomationFlowRepository.delete(1);

      expect(AutomationFlow.destroy).toHaveBeenCalledWith({ where: { flow_id: 1 } });
    });
  });

  describe('Bật/tắt flow', () => {
    it('bật flow thành công', async () => {
      const mock = { flow_id: 1, update: jest.fn() };
      AutomationFlow.findByPk.mockResolvedValue(mock);

      await AutomationFlowRepository.toggle(1, true);

      expect(mock.update).toHaveBeenCalled();
      const call = mock.update.mock.calls[0][0];
      expect(call.enabled).toBe(true);
      expect(call.updated_at).toBeDefined();
    });

    it('trả về null khi flow không tồn tại', async () => {
      AutomationFlow.findByPk.mockResolvedValue(null);

      const result = await AutomationFlowRepository.toggle(999, true);

      expect(result).toBeNull();
    });
  });

  describe('Lấy flow theo event', () => {
    it('trả về danh sách flow với trigger và action', async () => {
      const mockTriggers = [
        { trigger_id: 1, flow_id: 10, event_type: 'user.signup', is_active: true }
      ];
      const mockFlows = [
        { flow_id: 10, name: 'Welcome Flow', enabled: true }
      ];
      const mockActions = [
        { action_id: 1, flow_id: 10, trigger_id: 1, action_type: 'send_email', order_index: 1 }
      ];

      AutomationTriggerRepository.list.mockResolvedValue(mockTriggers);
      AutomationFlow.findAll.mockResolvedValue(mockFlows);
      AutomationActionRepository.findByFlow.mockResolvedValue(mockActions);

      const result = await AutomationFlowRepository.findByEvent('user.signup');

      expect(AutomationTriggerRepository.list).toHaveBeenCalledWith({
        event_type: 'user.signup',
        is_active: true,
        limit: 1000,
        offset: 0
      });
      expect(result).toHaveLength(1);
      expect(result[0].flow_id).toBe(10);
      expect(result[0].trigger.trigger_id).toBe(1);
      expect(result[0].actions).toHaveLength(1);
    });

    it('trả về mảng rỗng khi không có trigger', async () => {
      AutomationTriggerRepository.list.mockResolvedValue([]);

      const result = await AutomationFlowRepository.findByEvent('user.login');

      expect(result).toEqual([]);
    });

    it('lọc action theo trigger_id và null', async () => {
      const mockTriggers = [
        { trigger_id: 1, flow_id: 10, event_type: 'order.created', is_active: true }
      ];
      const mockFlows = [{ flow_id: 10, name: 'Order Flow' }];
      const mockActions = [
        { action_id: 1, flow_id: 10, trigger_id: 1, action_type: 'send_email', order_index: 1 },
        { action_id: 2, flow_id: 10, trigger_id: null, action_type: 'log', order_index: 2 },
        { action_id: 3, flow_id: 10, trigger_id: 2, action_type: 'other', order_index: 3 }
      ];

      AutomationTriggerRepository.list.mockResolvedValue(mockTriggers);
      AutomationFlow.findAll.mockResolvedValue(mockFlows);
      AutomationActionRepository.findByFlow.mockResolvedValue(mockActions);

      const result = await AutomationFlowRepository.findByEvent('order.created');

      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions.map(a => a.action_id)).toEqual([1, 2]);
    });

    it('sắp xếp action theo order_index', async () => {
      const mockTriggers = [{ trigger_id: 1, flow_id: 10, event_type: 'test', is_active: true }];
      const mockFlows = [{ flow_id: 10, name: 'Test' }];
      const mockActions = [
        { action_id: 3, flow_id: 10, trigger_id: 1, order_index: 3, updated_at: '2025-01-01' },
        { action_id: 1, flow_id: 10, trigger_id: 1, order_index: 1, updated_at: '2025-01-02' },
        { action_id: 2, flow_id: 10, trigger_id: 1, order_index: 2, updated_at: '2025-01-03' }
      ];

      AutomationTriggerRepository.list.mockResolvedValue(mockTriggers);
      AutomationFlow.findAll.mockResolvedValue(mockFlows);
      AutomationActionRepository.findByFlow.mockResolvedValue(mockActions);

      const result = await AutomationFlowRepository.findByEvent('test');

      expect(result[0].actions.map(a => a.action_id)).toEqual([1, 2, 3]);
    });

    it('lọc action không active nếu có is_active field', async () => {
      const mockTriggers = [{ trigger_id: 1, flow_id: 10, event_type: 'test', is_active: true }];
      const mockFlows = [{ flow_id: 10 }];
      const mockActions = [
        { action_id: 1, flow_id: 10, trigger_id: 1, is_active: true, order_index: 1 },
        { action_id: 2, flow_id: 10, trigger_id: 1, is_active: false, order_index: 2 }
      ];

      AutomationTriggerRepository.list.mockResolvedValue(mockTriggers);
      AutomationFlow.findAll.mockResolvedValue(mockFlows);
      AutomationActionRepository.findByFlow.mockResolvedValue(mockActions);

      const result = await AutomationFlowRepository.findByEvent('test');
      expect(result[0].actions).toHaveLength(1);
      expect(result[0].actions[0].action_id).toBe(1);
      expect(result[0].actions[0].is_active).toBe(true);
    });
  });
});
