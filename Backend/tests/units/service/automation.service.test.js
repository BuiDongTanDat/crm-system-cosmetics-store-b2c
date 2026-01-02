// Mock các service/phụ thuộc
jest.mock('nunjucks', () => ({ render: jest.fn(() => 'rendered') }));
jest.mock('axios');
jest.mock('../../../Infrastructure/Repositories/LeadRepository');
jest.mock('../../../Infrastructure/Repositories/AutomationFlowRepository');
jest.mock('../../../Infrastructure/external/EmailService');
jest.mock('../../../Infrastructure/scheduler/automationCron');
jest.mock('../../../Infrastructure/Bus/RabbitMQPublisher');
jest.mock('../../../Infrastructure/Repositories/OrderRepository');
jest.mock('../../../Infrastructure/Repositories/CustomerRepository');
jest.mock('../../../Application/Services/LeadService');
jest.mock('../../../Application/Services/CampaignService');

const AutomationService = require('../../../Application/Services/AutomationService');
const LeadRepository = require('../../../Infrastructure/Repositories/LeadRepository');
const flowsRepo = require('../../../Infrastructure/Repositories/AutomationFlowRepository');
const OrderRepo = require('../../../Infrastructure/Repositories/OrderRepository');
const customerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const nunjucks = require('nunjucks');

describe('AutomationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('render', () => {
        it('render trả về chuỗi đã render (có ctx và env)', () => {
            nunjucks.renderString = jest
                .fn()
                .mockReturnValue('Hello Tan, env=test');

            const result = AutomationService.render(
                'Hello {{ name }}, env={{ env.NODE_ENV }}',
                { name: 'Tan' }
            );

            expect(nunjucks.renderString).toHaveBeenCalledWith(
                'Hello {{ name }}, env={{ env.NODE_ENV }}',
                expect.objectContaining({
                    name: 'Tan',
                    env: expect.any(Object),
                })
            );

            expect(result).toBe('Hello Tan, env=test');
        });


        it('trả về chuỗi gốc nếu lỗi render', () => {
            nunjucks.renderString = jest.fn(() => {
                throw new Error('err');
            });

            const result = AutomationService.render('abc {{a}}', { a: 1 });

            expect(result).toBe('abc {{a}}');
        });

    });

    describe('setByPath & getByPath', () => {
        it('setByPath gán giá trị đúng', () => {
            const obj = {};
            AutomationService.setByPath(obj, 'a.b.c', 5);
            expect(obj.a.b.c).toBe(5);
        });
        it('getByPath lấy đúng giá trị', () => {
            const obj = { a: { b: { c: 10 } } };
            expect(AutomationService.getByPath(obj, 'a.b.c')).toBe(10);
        });
    });

    describe('evalCondition', () => {
        it('trả về true khi biểu thức đúng', () => {
            const result = AutomationService.evalCondition('1+1===2', {});
            expect(result).toBe(true);
        });
        it('trả về false khi biểu thức sai', () => {
            const result = AutomationService.evalCondition('1+1===3', {});
            expect(result).toBe(false);
        });
        it('trả về defaultValue nếu lỗi', () => {
            const result = AutomationService.evalCondition('a.b.c', {}, true);
            expect(result).toBe(true);
        });
    });

    describe('runFlow', () => {
        it('chạy các action theo thứ tự index', async () => {
            const spy = jest.spyOn(AutomationService, 'execAction').mockResolvedValue();
            const flow = { actions: [{ index: 2, type: 'a' }, { index: 1, type: 'b' }] };
            await AutomationService.runFlow(flow, {});
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy.mock.calls[0][0].type).toBe('b');
            expect(spy.mock.calls[1][0].type).toBe('a');
            spy.mockRestore();
        });
    });

    describe('execAction', () => {
        it('bỏ qua action nếu không có type', async () => {
            const res = await AutomationService.execAction({}, {});
            expect(res).toBeUndefined();
        });
        it('bỏ qua nếu không có handler', async () => {
            const res = await AutomationService.execAction({ type: 'not_exist' }, {});
            expect(res).toBeUndefined();
        });
    });

    describe('trigger', () => {
        it('bỏ qua nếu event không có route', async () => {
            const res = await AutomationService.trigger('unknown.event', {});
            expect(res).toBeUndefined();
        });
    });

    describe('buildDefaultCtx', () => {
        it('trả về ctx với lead, customer, order', async () => {
            LeadRepository.findById.mockResolvedValue({ toJSON: () => ({ lead_id: 1 }) });
            OrderRepo.findById = jest.fn().mockResolvedValue({ toJSON: () => ({ order_id: 2 }) });
            customerRepository.findById = jest.fn().mockResolvedValue({ toJSON: () => ({ customer_id: 3 }) });
            const ctx = await AutomationService.buildDefaultCtx({ lead_id: 1, order_id: 2, customer_id: 3 });
            expect(ctx.lead.lead_id).toBe(1);
            expect(ctx.order.order_id).toBe(2);
            expect(ctx.customer.customer_id).toBe(3);
        });
    });

    describe('runEventFlows', () => {
        it('bỏ qua nếu không có flow', async () => {
            flowsRepo.findByEvent.mockResolvedValue([]);
            const res = await AutomationService.runEventFlows('event', {});
            expect(res).toBeUndefined();
        });
    });

    describe('handleTagEvent', () => {
        it('bỏ qua nếu thiếu target_type hoặc target_id', async () => {
            const res = await AutomationService.handleTagEvent('tag.added', {});
            expect(res).toBeUndefined();
        });
        it('bỏ qua nếu không tìm thấy entity', async () => {
            LeadRepository.findById.mockResolvedValue(null);
            const res = await AutomationService.handleTagEvent('tag.added', { target_type: 'lead', target_id: 1 });
            expect(res).toBeUndefined();
        });
        it('bỏ qua nếu không có flow', async () => {
            LeadRepository.findById.mockResolvedValue({ toJSON: () => ({ lead_id: 1 }) });
            flowsRepo.findByEvent.mockResolvedValue([]);
            const res = await AutomationService.handleTagEvent('tag.added', { target_type: 'lead', target_id: 1 });
            expect(res).toBeUndefined();
        });
    });

    describe('handleCampaignEvent', () => {
        it('bỏ qua nếu không có campaign_id', async () => {
            const res = await AutomationService.handleCampaignEvent('campaign.run', {});
            expect(res).toBeUndefined();
        });
    });

    describe('runDailyAutomation', () => {
        it('trả về ok khi chạy xong', async () => {
            flowsRepo.findAll = jest.fn().mockResolvedValue([]);
            
            const res = await AutomationService.runDailyAutomation();
            
            expect(res.ok).toBe(true);
        });
    });
});
