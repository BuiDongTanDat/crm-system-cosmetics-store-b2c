jest.mock('../../../Infrastructure/database/postgres', () => ({
    getSequelize: () => ({
        transaction: jest.fn(async (cb) => cb({})),
    }),
}));

jest.mock('../../../Infrastructure/Repositories/AutomationFlowRepository');
jest.mock('../../../Infrastructure/Repositories/AutomationTriggerRepository');
jest.mock('../../../Infrastructure/Repositories/AutomationActionRepository');
jest.mock('p-limit', () => jest.fn(() => fn => fn()));

jest.mock('../../../Domain/Entities/AutomationFlow', () => ({}));
jest.mock('../../../Domain/Entities/AutomationTrigger', () => ({}));
jest.mock('../../../Domain/Entities/AutomationAction', () => ({}));

const AutomationFlowService = require('../../../Application/Services/AutomationFlowService');
const FlowRepo = require('../../../Infrastructure/Repositories/AutomationFlowRepository');
const TriggerRepo = require('../../../Infrastructure/Repositories/AutomationTriggerRepository');
const ActionRepo = require('../../../Infrastructure/Repositories/AutomationActionRepository');

describe('AutomationFlowService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo flow', () => {
        it('tạo flow chỉ với tên', async () => {
            FlowRepo.create.mockResolvedValue({ flow_id: 1, name: 'Flow A' });

            const res = await AutomationFlowService.createFlow({ name: 'Flow A' });

            expect(FlowRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Flow A' }),
                expect.any(Object)
            );
            expect(res.ok).toBe(true);
            expect(res.data.flow_id).toBe(1);
        });
        it('báo lỗi khi thiếu tên flow', async () => {
            const res = await AutomationFlowService.createFlow({});
            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
        it('tạo flow kèm trigger và action', async () => {
            FlowRepo.create.mockResolvedValue({ flow_id: 1 });
            TriggerRepo.create.mockResolvedValue({ trigger_id: 10 });
            ActionRepo.create.mockResolvedValue({ action_id: 20 });

            const res = await AutomationFlowService.createFlow({
                name: 'Flow A',
                trigger_type: 'cron',
                trigger_config: { expression: '* * * * *' },
                action_type: 'email',
                action_config: { to: 'action@test.com' },
            });

            expect(res.ok).toBe(true);
            expect(res.data.trigger_ids).toEqual([10]);
            expect(res.data.action_ids).toEqual([20]);
        });
    });

    describe('Lưu flow từ editor', () => {
        it('bỏ qua autosave nếu không phải bản ghi mới', async () => {
            const res = await AutomationFlowService.saveEditor(1, { isNewRecord: false });

            expect(res.ok).toBe(true);
            expect(res.data.updated).toBe(false);
        });
        it('báo lỗi khi không tìm thấy flow', async () => {
            FlowRepo.findById.mockResolvedValue(null);

            const res = await AutomationFlowService.saveEditor(99, { isNewRecord: true });

            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('FLOW_NOT_FOUND');
        });
        it('cập nhật meta flow thành công', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1 });
            FlowRepo.update.mockResolvedValue({ flow_id: 1, name: 'New' });

            const res = await AutomationFlowService.saveEditor(1, { isNewRecord: true, flow_meta: { name: 'New' } });

            expect(FlowRepo.update).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ name: 'New' }),
                expect.any(Object)
            );
            expect(res.ok).toBe(true);
        });
        it('upsert trigger và action thành công', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1 });
            TriggerRepo.create.mockResolvedValue({ trigger_id: 100 });
            ActionRepo.create.mockResolvedValue({ action_id: 200 });

            const res = await AutomationFlowService.saveEditor(1, {
                isNewRecord: true,
                upserts: {
                    triggers: [{ event_type: 'event' }],
                    actions: [{ action_type: 'email' }],
                },
            });

            expect(res.ok).toBe(true);
            expect(res.data.triggers.length).toBe(1);
            expect(res.data.actions.length).toBe(1);
        });
    });

    describe('Lấy chi tiết flow', () => {
        it('trả về flow, triggers, actions', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1 });
            TriggerRepo.findByFlow.mockResolvedValue([{ trigger_id: 1 }]);
            ActionRepo.findByFlow.mockResolvedValue([{ action_id: 1 }]);

            const res = await AutomationFlowService.getFlowDetail(1);

            expect(res.ok).toBe(true);
            expect(res.data.flow.flow_id).toBe(1);
            expect(res.data.triggers.length).toBe(1);
            expect(res.data.actions.length).toBe(1);
        });
        it('báo lỗi khi không tìm thấy flow', async () => {
            FlowRepo.findById.mockResolvedValue(null);

            const res = await AutomationFlowService.getFlowDetail(99);
            //console.log(res);
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Flow not found');
        });
    });

    describe('Publish flow', () => {
        it('báo lỗi nếu không có trigger', async () => {
            FlowRepo.findById.mockResolvedValue({ status: 'draft' });
            TriggerRepo.findByFlow.mockResolvedValue([]);
            ActionRepo.findByFlow.mockResolvedValue([{}]);

            const res = await AutomationFlowService.publishFlow(1);

            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
        it('báo lỗi nếu không có action', async () => {
            FlowRepo.findById.mockResolvedValue({ status: 'draft' });
            TriggerRepo.findByFlow.mockResolvedValue([{}]);
            ActionRepo.findByFlow.mockResolvedValue([]);

            const res = await AutomationFlowService.publishFlow(1);

            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
        it('báo lỗi khi không tìm thấy flow', async () => {
            FlowRepo.findById.mockResolvedValue(null);
            const res = await AutomationFlowService.publishFlow(999);
            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('FLOW_NOT_FOUND');
        });
        it('báo lỗi khi thiếu tên flow', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1, name: '', status: 'draft' });
            const res = await AutomationFlowService.publishFlow(1);
            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
        it('chỉ mô phỏng publish', async () => {
            FlowRepo.findById.mockResolvedValue({
                flow_id: 1,
                name: 'Test Flow',
                status: 'draft',
            });

            TriggerRepo.findByFlow.mockResolvedValue([{}]);
            ActionRepo.findByFlow.mockResolvedValue([{}]);

            const res = await AutomationFlowService.publishFlow(1, { simulate: true });
            expect(res.ok).toBe(true);
            expect(res.data.status).toBe('SIMULATED');
            expect(res.data.flow_id).toBe(1);
        });

        it('publish thành công', async () => {
            FlowRepo.findById.mockResolvedValue({
                flow_id: 1,
                name: 'Test Flow',
                status: 'draft',
            });

            TriggerRepo.findByFlow.mockResolvedValue([{}]);
            ActionRepo.findByFlow.mockResolvedValue([{}]);
            FlowRepo.update.mockResolvedValue({
                flow_id: 1,
                name: 'Test Flow',
                status: 'active',
            });

            const res = await AutomationFlowService.publishFlow(1);
            expect(res.ok).toBe(true);
            expect(res.data.flow.status).toBe('active');
            expect(res.data.flow.name).toBe('Test Flow');
        });
    });

    describe('Lất tất cả flow', () => {
        it('trả về danh sách flow rỗng', async () => {
            FlowRepo.findAll.mockResolvedValue([]);
            
            const res = await AutomationFlowService.getAllflow();
            
            expect(res.ok).toBe(true);
            expect(res.data.items).toEqual([]);
        });
        it('trả về danh sách flow có chi tiết', async () => {
            FlowRepo.findAll.mockResolvedValue([{ flow_id: 1, name: 'F1' }]);
            AutomationFlowService.getFlowDetail = jest.fn().mockResolvedValue({ ok: true, data: { flow: { flow_id: 1, name: 'F1', toJSON: () => ({ flow_id: 1, name: 'F1' }) }, triggers: [], actions: [] } });
            
            const res = await AutomationFlowService.getAllflow();
            
            expect(res.ok).toBe(true);
            expect(res.data.items.length).toBe(1);
            expect(res.data.items[0].name).toBe('F1');
        });
    });

    describe('Cập nhật flow', () => {
        it('cập nhật flow thành công', async () => {
            FlowRepo.update.mockResolvedValue({ flow_id: 1, name: 'Updated' });
            
            const res = await AutomationFlowService.updateFlow(1, { name: 'Updated' });
            
            expect(res.name).toBe('Updated');
        });
        it('báo lỗi khi không tìm thấy flow khi update', async () => {
            FlowRepo.update.mockResolvedValue(null);
            await expect(AutomationFlowService.updateFlow(99, { name: 'X' })).rejects.toThrow('Flow not found');
        });
    });

    describe('Xóa flow', () => {
        it('xóa flow thành công', async () => {
            FlowRepo.delete.mockResolvedValue(true);
            await expect(AutomationFlowService.deleteFlow(1)).resolves.toBeUndefined();
        });
    });

    describe('set Enabled cho flow', () => {
        it('bật/tắt flow thành công', async () => {
            FlowRepo.toggle.mockResolvedValue({ flow_id: 1, enabled: false });
            
            const res = await AutomationFlowService.setEnabled(1, false);
            
            expect(res.enabled).toBe(false);
        });
        it('báo lỗi khi không tìm thấy flow khi setEnabled', async () => {
            FlowRepo.toggle.mockResolvedValue(null);
            await expect(AutomationFlowService.setEnabled(99, true)).rejects.toThrow('Flow not found');
        });
    });

    describe('setStatusActive', () => {
        it('báo lỗi khi thiếu flow_id', async () => {
            const res = await AutomationFlowService.setStatusActive();
            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
        it('báo lỗi khi không tìm thấy flow', async () => {
            FlowRepo.findById.mockResolvedValue(null);
            const res = await AutomationFlowService.setStatusActive(999);
            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('FLOW_NOT_FOUND');
        });
        it('báo lỗi khi trạng thái không hợp lệ', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1, status: 'archived' });
            await expect(AutomationFlowService.setStatusActive(1)).resolves.toMatchObject({ ok: false, error: expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' }) });
        });
        it('báo lỗi khi thiếu trigger', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1, status: 'draft' });
            TriggerRepo.findByFlow.mockResolvedValue([]);
            ActionRepo.findByFlow.mockResolvedValue([{}]);
            const res = await AutomationFlowService.setStatusActive(1);
            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('NO_TRIGGER');
        });
        it('báo lỗi khi thiếu action', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1, status: 'draft' });
            TriggerRepo.findByFlow.mockResolvedValue([{}]);
            ActionRepo.findByFlow.mockResolvedValue([]);
            const res = await AutomationFlowService.setStatusActive(1);
            expect(res.ok).toBe(false);
            expect(res.error.code).toBe('NO_ACTION');
        });
        it('trả về flow đã active (idempotent)', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1, status: 'active' });
            const res = await AutomationFlowService.setStatusActive(1);
            expect(res.ok).toBe(true);
            expect(res.data.alreadyActive).toBe(true);
        });
        it('kích hoạt flow thành công', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1, status: 'draft' });
            TriggerRepo.findByFlow.mockResolvedValue([{}]);
            ActionRepo.findByFlow.mockResolvedValue([{}]);
            FlowRepo.update.mockResolvedValue({ flow_id: 1, status: 'active' });
            const res = await AutomationFlowService.setStatusActive(1);
            expect(res.ok).toBe(true);
            expect(res.data.flow.status).toBe('active');
        });
    });

    describe('Lấy danh sách flow', () => {
        it('trả về danh sách flow', async () => {
            FlowRepo.findAll.mockResolvedValue([{ flow_id: 1, name: 'Flow 1' }, { flow_id: 2, name: 'Flow 2' }]);
            
            const res = await AutomationFlowService.listFlows();
            
            expect(res[0].name).toBe('Flow 1');
            expect(res.length).toBe(2);
        });
    });

    describe('Lấy flow', () => {
        it('lấy flow thành công', async () => {
            FlowRepo.findById.mockResolvedValue({ flow_id: 1, name: 'F1' });
            
            const res = await AutomationFlowService.getFlow(1);
            
            expect(res.name).toBe('F1');
        });
        it('báo lỗi khi không tìm thấy flow', async () => {
            FlowRepo.findById.mockResolvedValue(null);
            await expect(AutomationFlowService.getFlow(99)).rejects.toThrow('Flow not found');
        });
    });

});
