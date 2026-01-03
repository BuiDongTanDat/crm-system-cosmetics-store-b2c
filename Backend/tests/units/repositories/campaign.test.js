const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const CampaignRepository = require('../../../Infrastructure/Repositories/CampaignRepository');
const Campaign = require('../../../Domain/Entities/Campaign');
const { Op } = require('sequelize');

jest.mock('../../../Domain/Entities/Campaign');

describe('CampaignRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo chiến dịch', () => {
        it('tạo thành công một chiến dịch mới', async () => {
            const campaignData = { name: 'Test Campaign', status: 'draft' };
            const mockCampaign = { id: 1, ...campaignData };
            Campaign.create.mockResolvedValue(mockCampaign);

            const result = await CampaignRepository.create(campaignData);

            expect(Campaign.create).toHaveBeenCalledWith(campaignData);
            expect(result).toEqual(mockCampaign);
        });
    });

    describe('Lấy chiến dịch theo id', () => {
        it('trả về chiến dịch theo id', async () => {
            const mockCampaign = { id: 1, name: 'Test Campaign' };
            Campaign.findByPk.mockResolvedValue(mockCampaign);

            const result = await CampaignRepository.findById(1);

            expect(Campaign.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCampaign);
        });

        it('trả về null khi không tìm thấy chiến dịch', async () => {
            Campaign.findByPk.mockResolvedValue(null);

            const result = await CampaignRepository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('Lấy tất cả chiến dịch', () => {
        it('nên trả về tất cả chiến dịch', async () => {
            const mockCampaigns = [
                { id: 1, name: 'Campaign 1' },
                { id: 2, name: 'Campaign 2' }
            ];
            Campaign.findAll.mockResolvedValue(mockCampaigns);

            const result = await CampaignRepository.findAll();

            expect(Campaign.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockCampaigns);
        });
    });

    describe('Cập nhật chiến dịch', () => {
        it('cập nhật thành công chiến dịch', async () => {
            const updateData = { name: 'Updated Campaign' };
            const mockCampaign = { id: 1, name: 'Old Name', update: jest.fn() };
            mockCampaign.update.mockResolvedValue({ ...mockCampaign, ...updateData });
            Campaign.findByPk.mockResolvedValue(mockCampaign);

            const result = await CampaignRepository.update(1, updateData);

            expect(Campaign.findByPk).toHaveBeenCalledWith(1);
            expect(mockCampaign.update).toHaveBeenCalledWith(updateData);
            expect(result).toEqual(mockCampaign);
        });

        it('trả về null khi chiến dịch không tồn tại', async () => {
            Campaign.findByPk.mockResolvedValue(null);

            const result = await CampaignRepository.update(999, { name: 'Test' });

            expect(result).toBeNull();
        });
    });

    describe('Xóa chiến dịch', () => {
        it('xóa thành công chiến dịch', async () => {
            const mockCampaign = { id: 1, destroy: jest.fn() };
            Campaign.findByPk.mockResolvedValue(mockCampaign);

            const result = await CampaignRepository.delete(1);

            expect(Campaign.findByPk).toHaveBeenCalledWith(1);
            expect(mockCampaign.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('trả về null khi chiến dịch không tồn tại', async () => {
            Campaign.findByPk.mockResolvedValue(null);

            const result = await CampaignRepository.delete(999);

            expect(result).toBeNull();
        });
    });

    describe('Cập nhật trạng thái chiến dịch', () => {
        it('cập nhật trạng thái chiến dịch thành công', async () => {
            const mockCampaign = { id: 1, status: 'draft', update: jest.fn() };
            mockCampaign.update.mockResolvedValue({ ...mockCampaign, status: 'running' });
            Campaign.findByPk.mockResolvedValue(mockCampaign);

            const result = await CampaignRepository.updateStatus(1, 'running');

            expect(Campaign.findByPk).toHaveBeenCalledWith(1);
            expect(mockCampaign.update).toHaveBeenCalledWith({ status: 'running' });
            expect(result).toEqual(mockCampaign);
        });

        it('trả về null khi chiến dịch không tồn tại', async () => {
            Campaign.findByPk.mockResolvedValue(null);

            const result = await CampaignRepository.updateStatus(999, 'running');

            expect(result).toBeNull();
        });
    });

    describe('Tìm chiến dịch theo tên', () => {
        it('trả về chiến dịch theo tên', async () => {
            const mockCampaigns = [{ id: 1, name: 'Test Campaign' }];
            Campaign.findAll.mockResolvedValue(mockCampaigns);

            const result = await CampaignRepository.findByName('Test Campaign');

            expect(Campaign.findAll).toHaveBeenCalledWith({
                where: { name: 'Test Campaign' }
            });
            expect(result).toEqual(mockCampaigns);
        });
    });

    describe('Lấy các chiến dịch đang chạy', () => {
        it('trả về tất cả chiến dịch đang chạy', async () => {
            const mockCampaigns = [{ id: 1, status: 'running' }];
            Campaign.findAll.mockResolvedValue(mockCampaigns);

            const result = await CampaignRepository.findAllRunning();

            expect(Campaign.findAll).toHaveBeenCalledWith({
                where: { status: 'running' },
                order: [['start_date', 'ASC']]
            });
            expect(result).toEqual(mockCampaigns);
        });

        it('lọc chiến dịch đang chạy theo khoảng ngày', async () => {
            const mockCampaigns = [];
            Campaign.findAll.mockResolvedValue(mockCampaigns);
            const from = '2025-01-01';
            const to = '2025-12-31';

            await CampaignRepository.findAllRunning({ from, to });

            expect(Campaign.findAll).toHaveBeenCalled();
            const callArgs = Campaign.findAll.mock.calls[0][0];
            expect(callArgs.where.start_date[Op.gte]).toEqual(new Date(from));
            expect(callArgs.where.start_date[Op.lte]).toEqual(new Date(to));
        });

        it('hỗ trợ sắp xếp tùy chỉnh', async () => {
            Campaign.findAll.mockResolvedValue([]);

            await CampaignRepository.findAllRunning({ sort: 'name', order: 'DESC' });

            expect(Campaign.findAll).toHaveBeenCalledWith({
                where: { status: 'running' },
                order: [['name', 'DESC']]
            });
        });
    });

    describe('Lấy chiến dịch với đếm tổng', () => {
        it('trả về chiến dịch với phân trang', async () => {
            const mockResult = { rows: [{ id: 1 }], count: 10 };
            Campaign.findAndCountAll.mockResolvedValue(mockResult);

            const result = await CampaignRepository.findAllWithCount({
                offset: 0,
                limit: 10
            });

            expect(result).toEqual({ items: mockResult.rows, total: mockResult.count });
        });

        it('lọc theo trạng thái (không phân biệt chữ hoa/thường)', async () => {
            Campaign.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await CampaignRepository.findAllWithCount({
                offset: 0,
                limit: 10,
                filters: { status: 'RUNNING' }
            });

            const callArgs = Campaign.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.status).toEqual({ [Op.iLike]: 'RUNNING' });
        });

        it('lọc theo từ khóa tìm kiếm', async () => {
            Campaign.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await CampaignRepository.findAllWithCount({
                offset: 0,
                limit: 10,
                filters: { search: 'Test' }
            });

            const callArgs = Campaign.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.name).toEqual({ [Op.iLike]: '%Test%' });
        });

        it('lọc theo kênh và chủ sở hữu', async () => {
            Campaign.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await CampaignRepository.findAllWithCount({
                offset: 0,
                limit: 10,
                filters: { channel: 'email', owner_employee_id: 5 }
            });

            const callArgs = Campaign.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.channel).toBe('email');
            expect(callArgs.where.owner_employee_id).toBe(5);
        });

        it('hỗ trợ lọc theo khoảng ngày', async () => {
            Campaign.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
            const from = '2025-01-01';
            const to = '2025-12-31';

            await CampaignRepository.findAllWithCount({
                offset: 0,
                limit: 10,
                filters: { from, to }
            });

            const callArgs = Campaign.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.start_date[Op.gte]).toEqual(new Date(from));
            expect(callArgs.where.start_date[Op.lte]).toEqual(new Date(to));
        });

        it('hỗ trợ lọc phức tạp với điều kiện AND', async () => {
            Campaign.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await CampaignRepository.findAllWithCount({
                offset: 0,
                limit: 10,
                filters: { start_lte: '2025-01-01', end_gte_or_null: '2025-12-01' }
            });

            const callArgs = Campaign.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where[Op.and]).toBeDefined();
            expect(callArgs.where[Op.and].length).toBe(2);
        });

        it('hỗ trợ sắp xếp tùy chỉnh', async () => {
            Campaign.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await CampaignRepository.findAllWithCount({
                offset: 0,
                limit: 10,
                sort: 'name',
                order: 'DESC'
            });

            const callArgs = Campaign.findAndCountAll.mock.calls[0][0];
            expect(callArgs.order).toEqual([['name', 'DESC']]);
        });
    });
});
