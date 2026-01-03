const AutomationTriggerService = require('../../../Application/Services/AutomationTriggerService');

describe('AutomationTriggerService', () => {
  let triggerRepo, flowRepo, logger, service;

  beforeEach(() => {
    triggerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setActive: jest.fn(),
    };
    flowRepo = {
      findById: jest.fn(),
    };
    logger = { log: jest.fn(), error: jest.fn() };
    service = new AutomationTriggerService({ triggerRepo, flowRepo, logger });
  });

  describe('Tạo trigger', () => {
    it('Tạo trigger nếu flow tồn tại', async () => {
      const dto = { flow_id: 'flow1', name: 'trigger1' };
      flowRepo.findById.mockResolvedValue({ id: 'flow1' });
      triggerRepo.create.mockResolvedValue({ id: 't1', ...dto });
      
      const result = await service.createTrigger(dto);
      expect(flowRepo.findById).toHaveBeenCalledWith('flow1');
      
      expect(triggerRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 't1', ...dto });
    });
    it('trả về lỗi nếu không có flow', async () => {
      flowRepo.findById.mockResolvedValue(null);
      await expect(service.createTrigger({ flow_id: 'flow2' })).rejects.toThrow('Flow not found');
    });
  });

  describe('Lấy trigger', () => {
    it('trả về thông tin trigger', async () => {
      triggerRepo.findById.mockResolvedValue({ id: 't1' });
      const result = await service.getTrigger('t1');
      expect(triggerRepo.findById).toHaveBeenCalledWith('t1');
      expect(result).toEqual({ id: 't1' });
    });
    it('trả lỗi khi không tìm thấy trigger', async () => {
      triggerRepo.findById.mockResolvedValue(null);
      await expect(service.getTrigger('t2')).rejects.toThrow('Trigger not found');
    });
  });

  describe('Danh sách triggers', () => {
    it('trả về danh sách trigger', async () => {
      const params = { active: true };
      triggerRepo.list.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
      
      const result = await service.listTriggers(params);
      
      expect(triggerRepo.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([{ id: 't1' }, { id: 't2' }]);
    });
  });

  describe('Cập nhật trigger', () => {
    it('cập nhật thành công trigger', async () => {
      triggerRepo.update.mockResolvedValue({ id: 't1', name: 'updated' });
      const result = await service.updateTrigger('t1', { name: 'updated' });
      expect(triggerRepo.update).toHaveBeenCalledWith('t1', { name: 'updated' });
      expect(result).toEqual({ id: 't1', name: 'updated' });
    });
    it('trả lỗi khi không tìm thấy trigger', async () => {
      triggerRepo.update.mockResolvedValue(null);
      await expect(service.updateTrigger('t2', {})).rejects.toThrow('Trigger not found');
    });
  });

  describe('Xóa trigger', () => {
    it('Xóa trigger thành công', async () => {
      triggerRepo.delete.mockResolvedValue();
      await service.deleteTrigger('t1');
      expect(triggerRepo.delete).toHaveBeenCalledWith('t1');
    });
  });

  describe('setActive cho trigger', () => {
    it('kích hoạt active thành công cho trigger', async () => {
      triggerRepo.setActive.mockResolvedValue({ id: 't1', is_active: true });
      
      const result = await service.setActive('t1', true);
      
      expect(triggerRepo.setActive).toHaveBeenCalledWith('t1', true);
      expect(result).toEqual({ id: 't1', is_active: true });
    });
    it('trả lỗi khi không tìm thấy trigger', async () => {
      triggerRepo.setActive.mockResolvedValue(null);
      await expect(service.setActive('t2', false)).rejects.toThrow('Trigger not found');
    });
  });
});
