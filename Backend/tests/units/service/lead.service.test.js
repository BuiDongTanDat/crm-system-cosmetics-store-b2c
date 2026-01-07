// Mock các Entity chặn init
jest.mock('../../../Domain/Entities/Lead', () => ({}));
jest.mock('../../../Domain/Entities/LeadInteraction', () => ({}));
jest.mock('../../../Domain/Entities/LeadStatusHistory', () => ({}));
jest.mock('../../../Domain/Entities/Customer', () => ({}));
jest.mock('../../../Domain/Entities/Campaign', () => ({}));
jest.mock('../../../Domain/Entities/LeadInterest', () => ({}));

jest.mock('../../../Infrastructure/Repositories/LeadRepository');
jest.mock('../../../Infrastructure/Repositories/CustomerRepository');
jest.mock('../../../Infrastructure/Repositories/CampaignRepository');
jest.mock('../../../Infrastructure/Repositories/LeadInterestRepository');
jest.mock('../../../Infrastructure/Bus/RabbitMQPublisher');
jest.mock('../../../Infrastructure/external/AIClient');

const mockTransaction = { 
    commit: jest.fn(), 
    rollback: jest.fn() 
};

jest.mock('../../../Infrastructure/database/postgres', () => ({
    getSequelize: jest.fn(() => ({
        transaction: jest.fn(async (cb) => await cb(mockTransaction)),
    })),
}));

const LeadService = require('../../../Application/Services/LeadService');
const LeadRepository = require('../../../Infrastructure/Repositories/LeadRepository');
const CustomerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const CampaignRepository = require('../../../Infrastructure/Repositories/CampaignRepository');
const LeadInterestRepository = require('../../../Infrastructure/Repositories/LeadInterestRepository');
const Rabbit = require('../../../Infrastructure/Bus/RabbitMQPublisher');
const AIClient = require('../../../Infrastructure/external/AIClient');

describe('LeadService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo lead', () => {
        it('tạo lead thành công', async () => {
            const campaign = {
                campaign_id: 1,
                name: 'Test Campaign',
                channel: 'facebook',
            };
            
            CampaignRepository.findById.mockResolvedValue(campaign);
            CustomerRepository.findById.mockResolvedValue(null);
            AIClient.scoreLead.mockResolvedValue({
                score: 80,
                predicted_prob: 0.6,
                predicted_value: 1000000,
                predicted_value_currency: 'VND',
                reason: 'High engagement score',
            });
            
            const createdLead = {
                lead_id: 123,
                campaign_id: 1,
                source: 'inbound',
                tags: [],
                priority: 'medium',
                product_interest: null,
                lead_score: 80,
                conversion_prob: 0.6,
                predicted_prob: 0.6,
                predicted_value: 1000000,
                predicted_value_currency: 'VND',
            };
            
            LeadRepository.create.mockResolvedValue(createdLead);
            LeadRepository.addInteraction.mockResolvedValue(true);
            LeadInterestRepository.upsertInterest = jest.fn().mockResolvedValue(true);
            Rabbit.publish.mockResolvedValue(true);

            const res = await LeadService.createLead({
                name: 'John Doe',
                campaign_id: 1,
                email: 'john@test.com',
                product_id: 100,
            });

            expect(res.ok).toBe(true);
            expect(res.data.lead_id).toBe(123);
            expect(LeadRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@test.com',
                    campaign_id: 1,
                }),
                expect.objectContaining({ transaction: mockTransaction })
            );
            expect(LeadRepository.addInteraction).toHaveBeenCalled();
            expect(Rabbit.publish).toHaveBeenCalled();
        });
        
        it('báo lỗi khi thiếu dữ liệu', async () => {
            const res = await LeadService.createLead();
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead data is required');
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Lấy lead theo id', () => {
        it('trả về lead khi tìm thấy', async () => {
            LeadRepository.findById.mockResolvedValue({ 
                lead_id: 1, 
                name: 'Test Lead',
                email: 'test@example.com'
            });

            const res = await LeadService.getLeadById(1);

            expect(res.ok).toBe(true);
            expect(res.data.lead_id).toBe(1);
        });
        
        it('báo lỗi khi không tìm thấy', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.getLeadById(99);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
            expect(res.error.code).toBe('LEAD_NOT_FOUND');
        });
    });

    describe('Cập nhật lead', () => {
        it('cập nhật lead thành công', async () => {
            const existingLead = { 
                lead_id: 1, 
                email: 'leadA@gmail.com', 
                phone: '123456789' 
            };
            
            LeadRepository.findById.mockResolvedValue(existingLead);
            LeadRepository.findByEmail.mockResolvedValue(null);
            LeadRepository.findByPhone.mockResolvedValue(null);
            LeadRepository.update.mockResolvedValue({ 
                ...existingLead, 
                email: 'leadB@gmail.com' 
            });

            const res = await LeadService.updateLead(1, { email: 'leadB@gmail.com' });

            expect(res.ok).toBe(true);
            expect(LeadRepository.update).toHaveBeenCalledWith(1, { email: 'leadB@gmail.com' });
        });
        
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.updateLead(99, { email: 'leadB@gmail.com' });

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
            expect(res.error.code).toBe('LEAD_NOT_FOUND');
        });
        
        it('báo lỗi khi email đã tồn tại', async () => {
            LeadRepository.findById.mockResolvedValue({ 
                lead_id: 1, 
                email: 'leadA@gmail.com' 
            });
            LeadRepository.findByEmail.mockResolvedValue({ lead_id: 2 });

            const res = await LeadService.updateLead(1, { email: 'leadB@gmail.com' });

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Email already exists');
            expect(res.error.code).toBe('DUPLICATE_EMAIL');
        });
        
        it('báo lỗi khi phone đã tồn tại', async () => {
            LeadRepository.findById.mockResolvedValue({ 
                lead_id: 1, 
                email: 'test@example.com',
                phone: '123456789' 
            });
            LeadRepository.findByEmail.mockResolvedValue(null);
            LeadRepository.findByPhone.mockResolvedValue({ lead_id: 2 });

            const res = await LeadService.updateLead(1, { phone: '987654321' });

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Phone number already exists');
            expect(res.error.code).toBe('DUPLICATE_PHONE');
        });
    });

    describe('Xóa lead', () => {
        it('xóa lead thành công', async () => {
            LeadRepository.findById.mockResolvedValue({ lead_id: 1 });
            LeadRepository.delete.mockResolvedValue(true);
            
            const res = await LeadService.deleteLead(1);
            
            expect(res.ok).toBe(true);
            expect(res.data.deleted).toBe(true);
            expect(LeadRepository.delete).toHaveBeenCalledWith(1);
        });
        
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.deleteLead(99);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
            expect(res.error.code).toBe('LEAD_NOT_FOUND');
        });
    });

    describe('Thêm tag cho lead', () => {
        it('thêm tag thành công', async () => {
            const lead = { 
                lead_id: 1, 
                tags: ['A'], 
                update: jest.fn().mockResolvedValue(true) 
            };
            LeadRepository.findById.mockResolvedValue(lead);

            const res = await LeadService.addTag(1, 'VIP');

            expect(res.ok).toBe(true);
            expect(lead.update).toHaveBeenCalledWith({ tags: ['A', 'VIP'] });
        });
        
        it('báo lỗi khi thiếu tag', async () => {
            const res = await LeadService.addTag(1, null);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Tag is required');
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
        
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.addTag(99, 'VIP');

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
            expect(res.error.code).toBe('LEAD_NOT_FOUND');
        });
    });

    describe('Xóa tag khỏi lead', () => {
        it('xóa tag thành công', async () => {
            const lead = { 
                lead_id: 1, 
                tags: ['VIP', 'A'], 
                update: jest.fn().mockResolvedValue(true) 
            };
            LeadRepository.findById.mockResolvedValue(lead);

            const res = await LeadService.removeTag(1, 'VIP');

            expect(res.ok).toBe(true);
            expect(lead.update).toHaveBeenCalledWith({ tags: ['A'] });
        });
        
        it('báo lỗi khi thiếu tag', async () => {
            const res = await LeadService.removeTag(1, null);

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Tag is required');
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
        
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);

            const res = await LeadService.removeTag(99, 'VIP');

            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
            expect(res.error.code).toBe('LEAD_NOT_FOUND');
        });
    });

    describe('Chuyển lead thành khách hàng', () => {
        it('chuyển lead thành customer thành công', async () => {
            const lead = { 
                lead_id: 1, 
                customer_id: null,
                name: 'John Doe',
                email: 'john@example.com',
                phone: '123456789',
                source: 'inbound'
            };
            
            const customer = {
                customer_id: 2,
                full_name: 'John Doe',
                email: 'john@example.com'
            };
            
            LeadRepository.findById.mockResolvedValue(lead);
            CustomerRepository.findOrCreateSmart.mockResolvedValue(customer);
            LeadRepository.updateById.mockResolvedValue({ ...lead, customer_id: 2 });
            LeadRepository.logStatusChange.mockResolvedValue(true);
            LeadRepository.addInteraction.mockResolvedValue(true);

            const res = await LeadService.convertLeadToCustomer(1, {});

            expect(res.ok).toBe(true);
            expect(res.data.customer.customer_id).toBe(2);
            expect(res.data.already_converted).toBe(false);
            expect(LeadRepository.updateById).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ customer_id: 2 }),
                expect.objectContaining({ transaction: mockTransaction })
            );
        });
        
        it('trả về customer hiện tại nếu đã convert', async () => {
            const lead = { 
                lead_id: 1, 
                customer_id: 2 
            };
            const customer = { 
                customer_id: 2, 
                full_name: 'John Doe' 
            };
            
            LeadRepository.findById.mockResolvedValue(lead);
            CustomerRepository.findById.mockResolvedValue(customer);

            const res = await LeadService.convertLeadToCustomer(1, {});

            expect(res.ok).toBe(true);
            expect(res.data.already_converted).toBe(true);
            expect(res.data.customer.customer_id).toBe(2);
        });
        
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.findById.mockResolvedValue(null);
            
            const res = await LeadService.convertLeadToCustomer(99, {});
            
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
            expect(res.error.code).toBe('LEAD_NOT_FOUND');
        });
    });

    describe('Cập nhật trạng thái lead', () => {
        it('cập nhật trạng thái thành công', async () => {
            const updatedLead = { 
                lead_id: 1, 
                status: 'contacted' 
            };
            
            LeadRepository.logStatusChange.mockResolvedValue(updatedLead);
            
            const res = await LeadService.changeStatus(1, 'contacted');
            
            expect(res.ok).toBe(true);
            expect(res.data.status).toBe('contacted');
            expect(LeadRepository.logStatusChange).toHaveBeenCalledWith(
                1, 
                'contacted',
                expect.objectContaining({
                    reason: null,
                    changed_by: null
                })
            );
        });
        
        it('báo lỗi khi không tìm thấy lead', async () => {
            LeadRepository.logStatusChange.mockResolvedValue(null);
            
            const res = await LeadService.changeStatus(99, 'contacted');
            
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('Lead not found');
            expect(res.error.code).toBe('LEAD_NOT_FOUND');
        });
        
        it('báo lỗi khi thiếu toStatus', async () => {
            const res = await LeadService.changeStatus(1);
            
            expect(res.ok).toBe(false);
            expect(res.error.message).toBe('toStatus is required');
            expect(res.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Lấy tất cả lead', () => {
        it('trả về danh sách lead', async () => {
            LeadRepository.findAll.mockResolvedValue([
                { lead_id: 1, name: 'Lead 1' }, 
                { lead_id: 2, name: 'Lead 2' }
            ]);

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

