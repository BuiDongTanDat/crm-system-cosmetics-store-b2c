// Mock các hàm và module cần thiết
jest.mock('../../../Infrastructure/Repositories/CustomerRepository');
jest.mock('../../../Infrastructure/Repositories/OrderRepository');
jest.mock('../../../Infrastructure/Repositories/LeadRepository');

const CustomerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const OrderRepository = require('../../../Infrastructure/Repositories/OrderRepository');
const CustomerService = require('../../../Application/Services/CustomerService');

describe('CustomerService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tạo khách hàng', () => {
    it('tạo khách hàng thành công', async () => {
      const customerData = { email: 'test@gmail.com', name: 'Test User' };
      const createdCustomer = { id: 1, email: 'test@gmail.com', name: 'Test User' };
      CustomerRepository.create.mockResolvedValue(createdCustomer);
      
      const result = await CustomerService.createCustomer(customerData);
      
      expect(CustomerRepository.create).toHaveBeenCalledWith(customerData);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(createdCustomer);
    });
    it('báo lỗi khi tạo khách hàng thất bại', async () => {
      CustomerRepository.create.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.createCustomer({});
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
      expect(result.error.code).toBe('CREATE_CUSTOMER_FAILED');
    });
  });

  describe('Lấy khách hàng theo id', () => {
    it('trả về khách hàng khi tìm thấy', async () => {
      const customer = { id: 1, email: 'test@gmail.com' };
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
      expect(result.error.code).toBe('CUSTOMER_NOT_FOUND');
    });
  });

  describe('Lấy danh sách khách hàng', () => {
    it('trả về danh sách khách hàng', async () => {
      const customers = [{ id: 1 }, { id: 2 }];
      CustomerRepository.findAll.mockResolvedValue(customers);
      
      const result = await CustomerService.listCustomers();
      
      expect(CustomerRepository.findAll).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customers);
    });
    it('trả về danh sách khách hàng với params', async () => {
      const customers = [{ id: 1 }];
      const params = { page: 1, limit: 10 };
      CustomerRepository.findAll.mockResolvedValue(customers);
      
      const result = await CustomerService.listCustomers(params);
      
      expect(CustomerRepository.findAll).toHaveBeenCalledWith(params);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(customers);
    });
  });

  describe('Cập nhật khách hàng', () => {
    it('cập nhật khách hàng thành công', async () => {
      const updatedCustomer = { id: 1, email: 'new@gmail.com' };
      CustomerRepository.update.mockResolvedValue(updatedCustomer);
      
      const result = await CustomerService.updateCustomer(1, { email: 'new@gmail.com' });
      
      expect(CustomerRepository.update).toHaveBeenCalledWith(1, { email: 'new@gmail.com' });
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(updatedCustomer);
    });
    it('báo lỗi khi không tìm thấy khách hàng', async () => {
      CustomerRepository.update.mockResolvedValue(null);
      
      const result = await CustomerService.updateCustomer(99, { email: 'new@gmail.com' });
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Customer not found');
      expect(result.error.code).toBe('CUSTOMER_NOT_FOUND');
    });
    it('báo lỗi khi cập nhật thất bại', async () => {
      CustomerRepository.update.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.updateCustomer(1, {});
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
      expect(result.error.code).toBe('UPDATE_CUSTOMER_FAILED');
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
    it('báo lỗi khi không tìm thấy khách hàng', async () => {
      CustomerRepository.delete.mockResolvedValue(null);
      
      const result = await CustomerService.deleteCustomer(99);
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Customer not found');
      expect(result.error.code).toBe('CUSTOMER_NOT_FOUND');
    });
    it('báo lỗi khi xóa thất bại', async () => {
      CustomerRepository.delete.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.deleteCustomer(1);
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
      expect(result.error.code).toBe('DELETE_CUSTOMER_FAILED');
    });
  });

  describe('Xóa nhiều khách hàng', () => {
    it('xóa nhiều khách hàng thành công', async () => {
      const customerIds = [1, 2, 3];
      CustomerRepository.deleteMany.mockResolvedValue(3);
      
      const result = await CustomerService.deleteCustomers(customerIds);
      
      expect(CustomerRepository.deleteMany).toHaveBeenCalledWith(customerIds);
      expect(result.ok).toBe(true);
      expect(result.data.deleted_count).toBe(3);
      expect(result.data.deleted_ids).toEqual(customerIds);
    });
    it('báo lỗi khi customer_ids không phải mảng', async () => {
      const result = await CustomerService.deleteCustomers('not-array');
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('customer_ids must be a non-empty array');
      expect(result.error.code).toBe('INVALID_INPUT');
    });
    it('báo lỗi khi customer_ids là mảng rỗng', async () => {
      const result = await CustomerService.deleteCustomers([]);
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('customer_ids must be a non-empty array');
      expect(result.error.code).toBe('INVALID_INPUT');
    });
    it('báo lỗi khi không có khách hàng nào bị xóa', async () => {
      CustomerRepository.deleteMany.mockResolvedValue(0);
      
      const result = await CustomerService.deleteCustomers([99, 100]);
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('No customers were deleted');
      expect(result.error.code).toBe('CUSTOMERS_NOT_FOUND');
    });
  });

  describe('Lấy đơn hàng của khách hàng', () => {
    it('trả về danh sách đơn hàng', async () => {
      const customer = { id: 1 };
      const orders = [{ id: 1, total: 100 }, { id: 2, total: 200 }];
      CustomerRepository.findById.mockResolvedValue(customer);
      OrderRepository.listByCustomer.mockResolvedValue(orders);
      
      const result = await CustomerService.getOrders(1);
      
      expect(CustomerRepository.findById).toHaveBeenCalledWith(1);
      expect(OrderRepository.listByCustomer).toHaveBeenCalledWith(1, {});
      expect(result.ok).toBe(true);
      expect(result.data.orders).toEqual(orders);
    });
    it('trả về đơn hàng với options', async () => {
      const customer = { id: 1 };
      const orders = [{ id: 1 }];
      const opts = { page: 1, limit: 5 };
      CustomerRepository.findById.mockResolvedValue(customer);
      OrderRepository.listByCustomer.mockResolvedValue(orders);
      
      const result = await CustomerService.getOrders(1, opts);
      
      expect(OrderRepository.listByCustomer).toHaveBeenCalledWith(1, opts);
      expect(result.ok).toBe(true);
    });
    it('báo lỗi khi không tìm thấy khách hàng', async () => {
      CustomerRepository.findById.mockResolvedValue(null);
      
      const result = await CustomerService.getOrders(99);
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Customer not found');
    });
  });

  describe('Import khách hàng', () => {
    it('import khách hàng thành công', async () => {
      const importData = { imported: 10, failed: 0 };
      CustomerRepository.importFromFile = jest.fn().mockResolvedValue(importData);
      
      const result = await CustomerService.importCustomers('/path/to/file.csv');
      
      expect(CustomerRepository.importFromFile).toHaveBeenCalledWith('/path/to/file.csv');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(importData);
    });
    it('báo lỗi khi repository chưa implement importFromFile', async () => {
      delete CustomerRepository.importFromFile;
      
      const result = await CustomerService.importCustomers('/path/to/file.csv');
      
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('IMPORT_NOT_IMPLEMENTED');
    });
  });

  describe('Lấy khách hàng theo khoảng thời gian', () => {
    it('trả về thống kê khách hàng theo khoảng thời gian', async () => {
      const allCustomers = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const customersInRange = [{ id: 2 }, { id: 3 }];
      CustomerRepository.findAll.mockResolvedValue(allCustomers);
      CustomerRepository.getCustomersByDateRange.mockResolvedValue(customersInRange);
      
      const result = await CustomerService.getCustomersByDateRange('2024-01-01', '2024-12-31');
      
      expect(CustomerRepository.getCustomersByDateRange).toHaveBeenCalledWith('2024-01-01', '2024-12-31');
      expect(result.ok).toBe(true);
      expect(result.data.totalCustomers).toBe(3);
      expect(result.data.newCustomersCount).toBe(2);
      expect(result.data.customersInRange).toEqual(customersInRange);
    });
    it('báo lỗi khi lấy thống kê thất bại', async () => {
      CustomerRepository.findAll.mockRejectedValue(new Error('DB error'));
      
      const result = await CustomerService.getCustomersByDateRange('2024-01-01', '2024-12-31');
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('DB error');
      expect(result.error.code).toBe('GET_CUSTOMERS_BY_DATE_RANGE_FAILED');
    });
  });
});
