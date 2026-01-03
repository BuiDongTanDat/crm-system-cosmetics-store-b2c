const { describe, it, expect, beforeEach } = require('@jest/globals');
const AutomationActionTypeRepository = require('../../../Infrastructure/Repositories/AutomationActionTypeRepository');
const AutomationActionType = require('../../../Domain/Entities/AutomationActionType');

jest.mock('../../../Domain/Entities/AutomationActionType');

describe('AutomationActionTypeRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Lấy action type theo id', () => {
        it('trả về action type theo id', async () => {
            const mockActionType = { action_type: 'send_email', name: 'Send Email', is_active: true };
            AutomationActionType.findByPk.mockResolvedValue(mockActionType);

            const result = await AutomationActionTypeRepository.findById('send_email');

            expect(AutomationActionType.findByPk).toHaveBeenCalledWith('send_email');
            expect(result).toEqual(mockActionType);
        });

        it('trả về null khi không tìm thấy action type', async () => {
            AutomationActionType.findByPk.mockResolvedValue(null);

            const result = await AutomationActionTypeRepository.findById('not_exist');

            expect(AutomationActionType.findByPk).toHaveBeenCalledWith('not_exist');
            expect(result).toBeNull();
        });
    });

    describe('Lấy danh sách action type', () => {
        it('trả về tất cả action type', async () => {
            const mockActionTypes = [
                { action_type: 'send_email', name: 'Send Email', is_active: true },
                { action_type: 'send_sms', name: 'Send SMS', is_active: true }
            ];
            AutomationActionType.findAll.mockResolvedValue(mockActionTypes);

            const result = await AutomationActionTypeRepository.list();

            expect(AutomationActionType.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockActionTypes);
        });

        it('lọc theo is_active', async () => {
            const mockActionTypes = [{ action_type: 'send_email', is_active: true }];
            AutomationActionType.findAll.mockResolvedValue(mockActionTypes);

            const result = await AutomationActionTypeRepository.list({ is_active: true });

            const callArgs = AutomationActionType.findAll.mock.calls[0][0];
            expect(callArgs.where.is_active).toBe(true);
            expect(result).toEqual(mockActionTypes);
        });

        it('hỗ trợ tìm kiếm theo từ khóa', async () => {
            AutomationActionType.findAll.mockResolvedValue([]);

            await AutomationActionTypeRepository.list({ q: 'email' });

            const callArgs = AutomationActionType.findAll.mock.calls[0][0];
            // $or là mảng điều kiện tìm kiếm
            expect(callArgs.where.$or).toBeDefined();
            expect(callArgs.where.$or).toHaveLength(2);
        });

        it('hỗ trợ phân trang', async () => {
            AutomationActionType.findAll.mockResolvedValue([]);

            await AutomationActionTypeRepository.list({ limit: 50, offset: 10 });

            const callArgs = AutomationActionType.findAll.mock.calls[0][0];
            expect(callArgs.limit).toBe(50);
            expect(callArgs.offset).toBe(10);
        });

        it('sắp xếp theo action_type ASC', async () => {
            AutomationActionType.findAll.mockResolvedValue([]);

            await AutomationActionTypeRepository.list();

            const callArgs = AutomationActionType.findAll.mock.calls[0][0];
            expect(callArgs.order).toEqual([['action_type', 'ASC']]);
        });
    });

    describe('Tạo hoặc cập nhật action type', () => {
        it('upsert thành công action type mới', async () => {
            const dto = { action_type: 'send_email', name: 'Send Email', is_active: true };
            const mockActionType = { action_type: 'send_email', ...dto };
            AutomationActionType.upsert.mockResolvedValue([mockActionType, true]);

            const result = await AutomationActionTypeRepository.upsert(dto);

            expect(AutomationActionType.upsert).toHaveBeenCalled();
            expect(result).toEqual(mockActionType);
        });

        it('cập nhật action type đã tồn tại', async () => {
            const dto = { action_type: 'send_email', name: 'Updated Name' };
            const mockActionType = { action_type: 'send_email', ...dto };
            AutomationActionType.upsert.mockResolvedValue([mockActionType, false]);

            const result = await AutomationActionTypeRepository.upsert(dto);

            expect(AutomationActionType.upsert).toHaveBeenCalled();
            expect(result).toEqual(mockActionType);
        });
    });

    describe('Tạo action type', () => {
        it('tạo thành công action type mới', async () => {
            const dto = { action_type: 'create_task', name: 'Create Task', is_active: true };
            const mockActionType = { ...dto };
            AutomationActionType.create.mockResolvedValue(mockActionType);

            const result = await AutomationActionTypeRepository.create(dto);

            expect(AutomationActionType.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockActionType);
        });
    });

    describe('Cập nhật action type', () => {
        it('cập nhật thành công action type', async () => {
            const mockActionType = { 
                action_type: 'send_email', 
                name: 'Send Email',
                is_active: true,
                save: jest.fn()
            };
            // Thiết lập hàm save để mô phỏng lưu vào DB
            mockActionType.save.mockResolvedValue(mockActionType);
            AutomationActionType.findByPk.mockResolvedValue(mockActionType);

            const patch = { name: 'Updated Email', is_active: false };
            const result = await AutomationActionTypeRepository.update('send_email', patch);

            expect(AutomationActionType.findByPk).toHaveBeenCalledWith('send_email');
            expect(mockActionType.name).toBe('Updated Email');
            expect(mockActionType.is_active).toBe(false);
            expect(mockActionType.updated_at).toBeDefined();
            expect(mockActionType.save).toHaveBeenCalled();
            expect(result).toEqual(mockActionType);
        });

        it('trả về null khi action type không tồn tại', async () => {
            AutomationActionType.findByPk.mockResolvedValue(null);

            const result = await AutomationActionTypeRepository.update('not_exist', { name: 'Test' });

            expect(AutomationActionType.findByPk).toHaveBeenCalledWith('not_exist');
            expect(result).toBeNull();
        });

        it('cập nhật updated_at tự động', async () => {
            const mockActionType = { 
                action_type: 'send_email',
                save: jest.fn()
            };
            AutomationActionType.findByPk.mockResolvedValue(mockActionType);

            await AutomationActionTypeRepository.update('send_email', { name: 'New Name' });

            expect(mockActionType.updated_at).toBeDefined();
            expect(mockActionType.updated_at).toBeInstanceOf(Date);
        });
    });

    describe('Xóa action type', () => {
        it('xóa thành công action type', async () => {
            const mockActionType = { 
                action_type: 'send_email',
                destroy: jest.fn()
            };
            mockActionType.destroy.mockResolvedValue();
            AutomationActionType.findByPk.mockResolvedValue(mockActionType);

            const result = await AutomationActionTypeRepository.delete('send_email');

            expect(AutomationActionType.findByPk).toHaveBeenCalledWith('send_email');
            expect(mockActionType.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('trả về false khi action type không tồn tại', async () => {
            AutomationActionType.findByPk.mockResolvedValue(null);

            const result = await AutomationActionTypeRepository.delete('not_exist');

            expect(AutomationActionType.findByPk).toHaveBeenCalledWith('not_exist');
            expect(result).toBe(false);
        });
    });

    describe('Kích hoạt/vô hiệu hóa action type', () => {
        it('kích hoạt action type thành công', async () => {
            const mockActionType = { 
                action_type: 'send_email',
                is_active: false,
                save: jest.fn()
            };

            mockActionType.save.mockResolvedValue(mockActionType);
            AutomationActionType.findByPk.mockResolvedValue(mockActionType);

            const result = await AutomationActionTypeRepository.setActive('send_email', true);

            expect(AutomationActionType.findByPk).toHaveBeenCalledWith('send_email');
            expect(mockActionType.is_active).toBe(true);
            expect(mockActionType.updated_at).toBeDefined();
            expect(mockActionType.save).toHaveBeenCalled();
        });

        it('vô hiệu hóa action type thành công', async () => {
            const mockActionType = { 
                action_type: 'send_email',
                is_active: true,
                save: jest.fn()
            };
            mockActionType.save.mockResolvedValue(mockActionType);
            AutomationActionType.findByPk.mockResolvedValue(mockActionType);

            await AutomationActionTypeRepository.setActive('send_email', false);

            expect(mockActionType.is_active).toBe(false);
        });

        it('trả về null khi action type không tồn tại', async () => {
            AutomationActionType.findByPk.mockResolvedValue(null);

            const result = await AutomationActionTypeRepository.setActive('not_exist', true);

            expect(result).toBeNull();
        });
    });
});
