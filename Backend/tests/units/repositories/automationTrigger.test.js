const { describe, it, expect, beforeEach } = require('@jest/globals');
const { Op } = require('sequelize');
const AutomationTriggerRepository = require('../../../Infrastructure/Repositories/AutomationTriggerRepository');
const AutomationTrigger = require('../../../Domain/Entities/AutomationTrigger');

jest.mock('../../../Domain/Entities/AutomationTrigger');

describe('AutomationTriggerRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo trigger', () => {
        it('tạo thành công trigger mới', async () => {
            const dto = { flow_id: 1, event_type: 'user.signup', is_active: true };
            const mock = { trigger_id: 10, ...dto };
            AutomationTrigger.create.mockResolvedValue(mock);

            const result = await AutomationTriggerRepository.create(dto);
            expect(AutomationTrigger.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mock);
        });
    });

    describe('Lấy trigger theo id', () => {
        it('trả về trigger theo id', async () => {
            const mock = { trigger_id: 1 };
            AutomationTrigger.findByPk.mockResolvedValue(mock);

            const result = await AutomationTriggerRepository.findById(1);

            expect(AutomationTrigger.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mock);
            expect(result.trigger_id).toBe(1);
        });
    });

    describe('Lấy trigger theo flow', () => {
        it('trả về danh sách trigger của flow', async () => {
            const mock = [{ trigger_id: 1, flow_id: 3 }];
            AutomationTrigger.findAll.mockResolvedValue(mock);

            const result = await AutomationTriggerRepository.findByFlow(3);

            expect(AutomationTrigger.findAll).toHaveBeenCalledWith({
                where: { flow_id: 3 },
                order: [['created_at', 'DESC']]
            });
            //console.log (result);
            expect(result).toEqual(mock);
            expect(result[0].flow_id).toBe(3);
        });

        it('lọc trigger active', async () => {
            AutomationTrigger.findAll.mockResolvedValue([]);

            await AutomationTriggerRepository.findByFlow(3, { activeOnly: true });

            const call = AutomationTrigger.findAll.mock.calls[0][0];
            expect(call.where.flow_id).toBe(3);
            expect(call.where.is_active).toBe(true);
        });
    });

    describe('Danh sách trigger', () => {
        it('trả về danh sách với phân trang', async () => {
            AutomationTrigger.findAll.mockResolvedValue([]);

            await AutomationTriggerRepository.list({ limit: 20, offset: 5 });

            const call = AutomationTrigger.findAll.mock.calls[0][0];
            expect(call.limit).toBe(20);
            expect(call.offset).toBe(5);
            expect(call.order).toEqual([['created_at', 'DESC']]);
        });

        it('lọc theo event_type', async () => {
            AutomationTrigger.findAll.mockResolvedValue([]);

            await AutomationTriggerRepository.list({ event_type: 'user.signup' });

            const call = AutomationTrigger.findAll.mock.calls[0][0];
            expect(call.where.event_type).toBe('user.signup');
        });

        it('lọc theo is_active', async () => {
            AutomationTrigger.findAll.mockResolvedValue([]);

            await AutomationTriggerRepository.list({ is_active: false });

            const call = AutomationTrigger.findAll.mock.calls[0][0];
            expect(call.where.is_active).toBe(false);
        });
    });

    describe('Cập nhật trigger', () => {
        it('cập nhật thành công trigger', async () => {
            const mock = { trigger_id: 1, update: jest.fn() };
            mock.update.mockResolvedValue(mock);
            AutomationTrigger.findByPk.mockResolvedValue(mock);

            const result = await AutomationTriggerRepository.update(1, { is_active: false });

            expect(AutomationTrigger.findByPk).toHaveBeenCalledWith(1);
            expect(mock.update).toHaveBeenCalledWith({ is_active: false });
            expect(result).toEqual(mock);
        });

        it('trả về null khi không tồn tại', async () => {
            AutomationTrigger.findByPk.mockResolvedValue(null);

            const result = await AutomationTriggerRepository.update(999, { is_active: false });

            expect(result).toBeNull();
        });
    });

    describe('Xóa trigger', () => {
        it('gọi destroy với trigger_id', async () => {
            AutomationTrigger.destroy.mockResolvedValue(1);

            await AutomationTriggerRepository.delete(7);

            expect(AutomationTrigger.destroy).toHaveBeenCalledWith({ where: { trigger_id: 7 } });
        });
    });

    describe('Kích hoạt/vô hiệu hóa trigger', () => {
        it('cập nhật is_active', async () => {
            const mock = { trigger_id: 1, update: jest.fn() };
            mock.update.mockResolvedValue(mock);
            AutomationTrigger.findByPk.mockResolvedValue(mock);

            const result = await AutomationTriggerRepository.setActive(1, true);

            expect(AutomationTrigger.findByPk).toHaveBeenCalledWith(1);
            expect(mock.update).toHaveBeenCalledWith({ is_active: true });
            expect(result).toEqual(mock);
        });

        it('trả về null khi không tồn tại', async () => {
            AutomationTrigger.findByPk.mockResolvedValue(null);

            const result = await AutomationTriggerRepository.setActive(999, true);

            expect(result).toBeNull();
        });
    });

    describe('Xóa nhiều trigger', () => {
        it('xóa theo danh sách id', async () => {
            AutomationTrigger.destroy.mockResolvedValue(3);
            AutomationTrigger.primaryKeyAttribute = 'trigger_id';

            const result = await AutomationTriggerRepository.bulkDeleteByIds([1, 2, 3]);

            expect(AutomationTrigger.destroy).toHaveBeenCalled();
            const call = AutomationTrigger.destroy.mock.calls[0][0];
            expect(call.where.trigger_id[Op.in]).toEqual([1, 2, 3]);
            expect(result).toBe(3);
        });

        it('trả về 0 khi danh sách rỗng', async () => {
            const result = await AutomationTriggerRepository.bulkDeleteByIds([]);

            expect(result).toBe(0);
        });
    });
});
