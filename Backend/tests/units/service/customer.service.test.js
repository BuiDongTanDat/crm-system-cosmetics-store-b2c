// Mock các hàm và module cần thiết
jest.mock('../../../Infrastructure/Repositories/CustomerRepository');
jest.mock('../../../Infrastructure/Repositories/CustomerAnalyticsSnapshotRepository');
jest.mock('../../../Infrastructure/external/AIClient');

const CustomerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const CustomerService = require('../../../Application/Services/CustomerService');

describe('CustomerService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tạo khách hàng', () => {
    it('tạo khách hàng thành công', async () => {
      const customer = { id: 1, email: 'test@gmail.com' };
      CustomerRepository.create.mockResolvedValue(customer);
      
      const result = await CustomerService.createCustomer(customer);
      
      expect(CustomerRepository.create).toHaveBeenCalledWith(customer);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customer);
    });
    it('báo lỗi khi tạo khách hàng thất bại', async () => {
      CustomerRepository.create.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.createCustomer({});
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
    });
  });

  describe('Lấy khách hàng theo id', () => {
    it('trả về khách hàng khi tìm thấy', async () => {
      const customer = { id: 1 };
      CustomerRepository.findById.mockResolvedValue(customer);
      
      const result = await CustomerService.getCustomerById(1);
      
      expect(CustomerRepository.findById).toHaveBeenCalledWith(1);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customer);
    });
    it('báo lỗi khi không tìm thấy khách hàng', async () => {
      CustomerRepository.findById.mockResolvedValue(null);
      const result = await CustomerService.getCustomerById(99);
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Customer not found');
    });
  });

  describe('Cập nhật khách hàng', () => {
    it('cập nhật khách hàng thành công', async () => {
      const customer = { id: 1 };
      CustomerRepository.update.mockResolvedValue(customer);
      
      const result = await CustomerService.updateCustomer(1, { email: 'new@gmail.com' });
      
      expect(CustomerRepository.update).toHaveBeenCalledWith(1, { email: 'new@gmail.com' });
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customer);
    });
    it('báo lỗi khi cập nhật thất bại', async () => {
      CustomerRepository.update.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.updateCustomer(1, {});
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
    });
  });

  describe('Xóa khách hàng', () => {
    it('xóa khách hàng thành công', async () => {
      CustomerRepository.delete.mockResolvedValue(true);
      
      const result = await CustomerService.deleteCustomer(1);
      
      expect(CustomerRepository.delete).toHaveBeenCalledWith(1);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ deleted: true });
    });
    it('báo lỗi khi xóa thất bại', async () => {
      CustomerRepository.delete.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.deleteCustomer(1);
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
    });
  });

  describe('Thêm tag cho khách hàng', () => {
    it('thêm tag thành công', async () => {
      const customer = { id: 1 };
      CustomerRepository.addTag.mockResolvedValue(customer);
      
      const result = await CustomerService.addTagToCustomer(1, 'VIP');
      
      expect(CustomerRepository.addTag).toHaveBeenCalledWith(1, 'VIP');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customer);
    });
    it('báo lỗi khi thiếu tag', async () => {
      const result = await CustomerService.addTagToCustomer(1, null);
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Tag is required');
    });
    it('báo lỗi khi không tìm thấy khách hàng', async () => {
      CustomerRepository.addTag.mockResolvedValue(null);
      
      const result = await CustomerService.addTagToCustomer(1, 'VIP');
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Customer not found');
    });
  });

  describe('Xóa tag khỏi khách hàng', () => {
    it('xóa tag thành công', async () => {
      const customer = { id: 1 };
      CustomerRepository.removeTag.mockResolvedValue(customer);
      
      const result = await CustomerService.removeTagFromCustomer(1, 'VIP');
      
      expect(CustomerRepository.removeTag).toHaveBeenCalledWith(1, 'VIP');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customer);
    });
    it('báo lỗi khi thiếu tag', async () => {
      const result = await CustomerService.removeTagFromCustomer(1, null);
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Tag is required');
    });
    it('báo lỗi khi không tìm thấy khách hàng', async () => {
      CustomerRepository.removeTag.mockResolvedValue(null);
      
      const result = await CustomerService.removeTagFromCustomer(1, 'VIP');
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Customer not found');
    });
  });

  describe('Tìm khách hàng theo tag', () => {
    it('trả về danh sách khách hàng', async () => {
      const customers = [{ id: 1 }, { id: 2 }];
      CustomerRepository.findByTag.mockResolvedValue(customers);
      
      const result = await CustomerService.findCustomersByTag('VIP');
      
      expect(CustomerRepository.findByTag).toHaveBeenCalledWith('VIP');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customers);
    });
    it('báo lỗi khi tìm thất bại', async () => {
      CustomerRepository.findByTag.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.findCustomersByTag('VIP');
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
    });
  });

  describe('Tìm khách hàng theo nguồn', () => {
    it('trả về danh sách khách hàng', async () => {
      const customers = [{ id: 1, name: 'Customer1'}, { id: 2 , name: 'Customer2'}];
      CustomerRepository.findBySource.mockResolvedValue(customers);
      
      const result = await CustomerService.findCustomersBySource('Facebook');
      
      expect(CustomerRepository.findBySource).toHaveBeenCalledWith('Facebook');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customers);
    });
    it('báo lỗi khi tìm thất bại', async () => {
      CustomerRepository.findBySource.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.findCustomersBySource('Facebook');
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
    });
  });
});
