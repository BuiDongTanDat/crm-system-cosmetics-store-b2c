// Mock các repository và publisher
jest.mock('../../../Infrastructure/Repositories/CampaignRepository');
jest.mock('../../../Infrastructure/Repositories/ProductRepository');
jest.mock('../../../Infrastructure/Bus/RabbitMQPublisher');
jest.mock('../../../Infrastructure/Repositories/CampaignChannelRepository');

const CampaignRepository = require('../../../Infrastructure/Repositories/CampaignRepository');
const ProductRepository = require('../../../Infrastructure/Repositories/ProductRepository');
const RabbitMQPublisher = require('../../../Infrastructure/Bus/RabbitMQPublisher');
const CampaignService = require('../../../Application/Services/CampaignService');

describe('CampaignService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tạo chiến dịch', () => {
    it('tạo chiến dịch thành công', async () => {
      const campaign = { id: 1, name: 'Chiến dịch A' };
      CampaignRepository.create.mockResolvedValue(campaign);
      
      const res = await CampaignService.createCampaign({ name: 'Chiến dịch A' });
      
      expect(CampaignRepository.create).toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.data).toEqual(campaign);
    });
    it('báo lỗi khi thiếu tên chiến dịch', async () => {
      const res = await CampaignService.createCampaign({});
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('Campaign name is required');
    });
  });

  describe('Cập nhật trạng thái chiến dịch', () => {
    it('cập nhật trạng thái thành công và publish event nếu running', async () => {
      const campaign = { id: 1, status: 'draft' };
      CampaignRepository.findById.mockResolvedValue(campaign);
      CampaignRepository.updateStatus.mockResolvedValue();
      RabbitMQPublisher.publish.mockResolvedValue();
      
      const res = await CampaignService.updateStatus(1, 'running');
      
      expect(CampaignRepository.updateStatus).toHaveBeenCalledWith(1, 'running');
      expect(RabbitMQPublisher.publish).toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.data.campaign).toEqual(campaign);
    });
    it('báo lỗi khi trạng thái không hợp lệ', async () => {
      const res = await CampaignService.updateStatus(1, 'invalid');
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('Trạng thái không hợp lệ.');
    });
    it('báo lỗi khi không tìm thấy chiến dịch', async () => {
      CampaignRepository.findById.mockResolvedValue(null);
      
      const res = await CampaignService.updateStatus(99, 'running');
      
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('Không tìm thấy chiến dịch.');
    });
  });

  describe('Lấy tất cả chiến dịch', () => {
    it('trả về danh sách chiến dịch với phân trang', async () => {
      CampaignRepository.findAllWithCount.mockResolvedValue({ items: [{ id: 1 }], total: 1 });
      
      const res = await CampaignService.getAll({ page: 1, limit: 10 });
      
      expect(CampaignRepository.findAllWithCount).toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.data.items.length).toBe(1);
      expect(res.data.total).toBe(1);
    });
    it('báo lỗi khi lấy danh sách thất bại', async () => {
      CampaignRepository.findAllWithCount.mockRejectedValue(new Error('DB error'));
      
      const res = await CampaignService.getAll();
      
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('DB error');
    });
  });

  describe('Lấy các chiến dịch đang chạy kèm sản phẩm', () => {
    it('trả về danh sách chiến dịch đang chạy và sản phẩm', async () => {
      const campaigns = [
        { id: 1, products: [{ product_id: 10 }] },
        { id: 2, products: [{ product_id: 20 }] },
      ];
      const products = [
        { product_id: 10, name: 'Sản phẩm 1' },
        { product_id: 20, name: 'Sản phẩm 2' },
      ];
      CampaignRepository.findAllRunning.mockResolvedValue(campaigns);
      ProductRepository.findByIds.mockResolvedValue(products);
      
      const res = await CampaignService.getRunningWithProducts({});
      
      expect(CampaignRepository.findAllRunning).toHaveBeenCalled();
      expect(ProductRepository.findByIds).toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.data.items.length).toBe(2);
      expect(res.data.items[0].products[0].name).toBe('Sản phẩm 1');
    });
    it('báo lỗi khi lấy danh sách thất bại', async () => {
      CampaignRepository.findAllRunning.mockRejectedValue(new Error('DB error'));
      
      const res = await CampaignService.getRunningWithProducts({});
      
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('DB error');
    });
  });
});
