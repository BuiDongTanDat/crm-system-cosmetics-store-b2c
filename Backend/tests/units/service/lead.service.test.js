
// Mock các Entity chặn init
jest.mock('../../../Domain/Entities/Lead', () => ({}));
jest.mock('../../../Domain/Entities/LeadInteraction', () => ({}));
jest.mock('../../../Domain/Entities/LeadStatusHistory', () => ({}));
jest.mock('../../../Domain/Entities/Customer', () => ({}));
jest.mock('../../../Domain/Entities/Campaign', () => ({}));

jest.mock('../../../Infrastructure/Repositories/LeadRepository');
jest.mock('../../../Infrastructure/Repositories/CustomerRepository');
jest.mock('../../../Infrastructure/Repositories/CampaignRepository');
jest.mock('../../../Infrastructure/Bus/RabbitMQPublisher');
jest.mock('../../../Infrastructure/external/AIClient');
jest.mock('../../../Infrastructure/database/postgres');

jest.mock('../../../Infrastructure/database/postgres', () => ({
    getSequelize: jest.fn(() => ({
        transaction: jest.fn(async (cb) => cb(mockTransaction)),
    })),
}));

const LeadService = require('../../../Application/Services/LeadService');
const LeadRepository = require('../../../Infrastructure/Repositories/LeadRepository');
const CustomerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const CampaignRepository = require('../../../Infrastructure/Repositories/CampaignRepository');
const Rabbit = require('../../../Infrastructure/Bus/RabbitMQPublisher');
const AIClient = require('../../../Infrastructure/external/AIClient');
const DataManager = require('../../../Infrastructure/database/postgres');
const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

describe('LeadService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo lead', () => {
        it('tạo lead thành công', async () => {
            CampaignRepository.findById.mockResolvedValue({
                campaign_id: 1,
                name: 'Test Campaign',
                channel: 'facebook',
            });
            CustomerRepository.findById.mockResolvedValue(null);
            AIClient.scoreLead.mockResolvedValue({
                score: 80,
                predicted_prob: 0.6,
                predicted_value: 1000000,
                predicted_value_currency: 'VND',
            });
            LeadRepository.create.mockResolvedValue({
                lead_id: 123,
                campaign_id: 1,
                source: 'inbound',
                tags: [],
                priority: 'medium',
                product_interest: null,
            });
            LeadRepository.addInteraction.mockResolvedValue(true);
            Rabbit.publish.mockResolvedValue(true);

            const res = await LeadService.createLead({
                name: 'John Doe',
                campaign_id: 1,
                email: 'john@test.com',
            });

            expect(res.ok).toBe(true);
            expect(LeadRepository.create).toHaveBeenCalled();
            expect(LeadRepository.addInteraction).toHaveBeenCalled();
            expect(Rabbit.publish).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ lead_id: 123 })
            );
        });
        it('báo lỗi khi thiếu dữ liệu', async () => {
            const res = await LeadService.createLead();
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead data is required');
        });
    });

    describe('Lấy lead theo id', () => {
        it('trả về lead khi tìm thấy', async () => {
            LeadRepository.findById.mockResolvedValue({ lead_id: 1 });

            const res = await LeadService.getLeadById(1);

            expect(res.ok).toBe(true);
            expect(res.data.lead_id).toBe(1);
        });
        it('báo lỗi khi không tìm thấy', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.getLeadById(99);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
        });
    });

    describe('Cập nhật lead', () => {
        it('cập nhật lead thành công', async () => {
            LeadRepository.findById.mockResolvedValue({ lead_id: 1, email: 'leadA@gmail.com', phone: '123456789' });
            LeadRepository.findByEmail.mockResolvedValue(null);
            LeadRepository.findByPhone.mockResolvedValue(null);
            LeadRepository.update.mockResolvedValue();

            const res = await LeadService.updateLead(1, { email: 'leadB@gmail.com', phone: '987654321' });

            expect(res.ok).toBe(true);
        });
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.updateLead(99, { email: 'leadB@gmail.com' });

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
        });
        it('báo lỗi khi email đã tồn tại', async () => {
            LeadRepository.findById.mockResolvedValue({ lead_id: 1, email: 'leadA@gmail.com' });
            LeadRepository.findByEmail.mockResolvedValue({ lead_id: 2 });

            const res = await LeadService.updateLead(1, { email: 'leadB@gmail.com' });

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Email already exists');
        });
        it('báo lỗi khi phone đã tồn tại', async () => {
            LeadRepository.findById.mockResolvedValue({ lead_id: 1, phone: '123456789' });
            LeadRepository.findByPhone.mockResolvedValue({ lead_id: 2 });

            const res = await LeadService.updateLead(1, { phone: '987654321' });

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Phone number already exists');
        });
    });

    describe('Xóa lead', () => {
        it('xóa lead thành công', async () => {
            LeadRepository.findById.mockResolvedValue({ lead_id: 1 });
            LeadRepository.delete.mockResolvedValue();
            const res = await LeadService.deleteLead(1);
            expect(res.ok).toBe(true);
            expect(res.data.deleted).toBe(true);
        });
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.deleteLead(99);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
        });
    });

    describe('Thêm tag cho lead', () => {
        it('thêm tag thành công', async () => {
            const lead = { lead_id: 1, tags: ['A'], update: jest.fn() };
            LeadRepository.findById.mockResolvedValue(lead);

            const res = await LeadService.addTag(1, 'VIP');

            expect(res.ok).toBe(true);
        });
        it('báo lỗi khi thiếu tag', async () => {
            const res = await LeadService.addTag(1, null);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Tag is required');
        });
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.addTag(99, 'VIP');

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
        });
    });

    describe('Xóa tag khỏi lead', () => {
        it('xóa tag thành công', async () => {
            const lead = { lead_id: 1, tags: ['VIP', 'A'], update: jest.fn() };
            LeadRepository.findById.mockResolvedValue(lead);

            const res = await LeadService.removeTag(1, 'VIP');

            expect(res.ok).toBe(true);
        });
        it('báo lỗi khi thiếu tag', async () => {
            const res = await LeadService.removeTag(1, null);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Tag is required');
        });
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.removeTag(99, 'VIP');

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
        });
    });

    describe('Chuyển lead thành khách hàng', () => {
        it('chuyển lead thành customer thành công', async () => {
            // findById lần 1: lead chưa có customer
            LeadRepository.findById
                .mockResolvedValueOnce({ lead_id: 1, customer_id: null })
                // findById lần 2: lead đã convert
                .mockResolvedValueOnce({ lead_id: 1, customer_id: 2 });

            CustomerRepository.findById.mockResolvedValue(null);
            CustomerRepository.findOrCreateSmart.mockResolvedValue({
                customer_id: 2,
            });
            LeadRepository.updateById.mockResolvedValue();
            LeadRepository.addInteraction.mockResolvedValue();

            const res = await LeadService.convertLeadToCustomer(1, {});

            expect(res.ok).toBe(true);
            expect(res.data.customer.customer_id).toBe(2);
            expect(LeadRepository.updateById).toHaveBeenCalled();
            expect(LeadRepository.addInteraction).toHaveBeenCalled();
        });
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);
            const res = await LeadService.convertLeadToCustomer(99, {});
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
        });
    });

    describe('Cập nhật trạng thái lead', () => {
        it('cập nhật trạng thái thành công', async () => {
            LeadRepository.findById.mockResolvedValue({ lead_id: 1, status: 'new' });
            LeadRepository.logStatusChange.mockResolvedValue({ lead_id: 1, status: 'contacted' });
            const res = await LeadService.changeStatus(1, 'contacted');
            expect(res.ok).toBe(true);
            expect(res.data.status).toBe('contacted');
        });
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.logStatusChange.mockResolvedValue(null);
            const res = await LeadService.changeStatus(99, 'contacted');
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
        });
    });

    describe('Lấy tất cả lead', () => {
        it('trả về danh sách lead', async () => {
            LeadRepository.findAll.mockResolvedValue([{ lead_id: 1 }, { lead_id: 2 }]);

            const res = await LeadService.getAll();

            expect(Array.isArray(res)).toBe(true);
            expect(res.length).toBe(2);
        });
        it('báo lỗi khi không có lead', async () => {
            LeadRepository.findAll.mockResolvedValue([]);
            await expect(LeadService.getAll()).rejects.toThrow('No leads found');
        });
    });
});

