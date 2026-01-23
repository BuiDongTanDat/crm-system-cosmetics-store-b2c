const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');
const orderRepository = require('../../Infrastructure/Repositories/OrderRepository');
const leadRepository = require('../../Infrastructure/Repositories/LeadRepository'); // nếu bạn đang dùng cho import / mapping
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

class CustomerService {
  constructor() {
    this.repo = customerRepository;
    this.orderRepo = orderRepository;
    this.leadRepo = leadRepository;
  }

  async _getCustomerOr404(customerId) {
    const customer = await this.repo.findById(customerId);
    if (!customer) throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
    return customer;
  }

  // =========================
  // CRUD
  // =========================
  async createCustomer(customerData) {
    try {
      const customer = await this.repo.create(customerData);
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CREATE_CUSTOMER_FAILED' }));
    }
  }

  async getCustomerById(customerId) {
    try {
      const customer = await this.repo.findById(customerId);
      if (!customer) throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: err.status || 500, code: 'GET_CUSTOMER_FAILED' }));
    }
  }

  async listCustomers(params = {}) {
    try {
      const customers = await this.repo.findAll(params);
      return ok(customers);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_CUSTOMERS_FAILED' }));
    }
  }

  async updateCustomer(customerId, patch) {
    try {
      const customer = await this.repo.update(customerId, patch);
      if (!customer) throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_CUSTOMER_FAILED' }));
    }
  }

  async deleteCustomer(customerId) {
    try {
      const deletedCount = await this.repo.delete(customerId);

      if (deletedCount === 0) {
        throw new AppError('Customer not found', {
          status: 404,
          code: 'CUSTOMER_NOT_FOUND'
        });
      }

      return ok({ message: 'Customer deleted successfully' });

    } catch (err) {
      return fail(asAppError(err, {
        status: 500,
        code: 'DELETE_CUSTOMER_FAILED'
      }));
    }
  }

  async deleteCustomers(customerIds = []) {
    try {
      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        throw new AppError('customer_ids must be a non-empty array', {
          status: 400,
          code: 'INVALID_INPUT',
        });
      }

      const deletedCount = await this.repo.deleteMany(customerIds);

      if (deletedCount === 0) {
        throw new AppError('No customers were deleted', {
          status: 404,
          code: 'CUSTOMERS_NOT_FOUND',
        });
      }

      return ok({
        deleted_count: deletedCount,
        deleted_ids: customerIds,
      });
    } catch (err) {
      return fail(asAppError(err));
    }
  }
  // =========================
  // Orders
  // =========================
  async getOrders(customerId, opts = {}) {
    try {
      await this._getCustomerOr404(customerId);
      const orders = await this.orderRepo.listByCustomer(customerId, opts);
      console.log(orders);
      return ok({ orders });
    } catch (error) {
      return fail(asAppError(error, { status: 500, code: 'GET_ORDERS_FAILED' }));
    }
  }

  // =========================
  // Import (nếu bạn đã có thì giữ; nếu chưa có thì comment)
  // =========================
  async importCustomers(filePath) {
    try {
      if (!this.repo.importFromFile) {
        throw new AppError('CustomerRepository.importFromFile not implemented', {
          status: 501,
          code: 'IMPORT_NOT_IMPLEMENTED',
        });
      }
      const data = await this.repo.importFromFile(filePath);
      return ok(data);
    } catch (err) {
      return fail(asAppError(err, { status: err.status || 500, code: 'IMPORT_CUSTOMERS_FAILED' }));
    }
  }

  // =========================
  // Report
  // =========================
  async getCustomersByDateRange(from, to) {
    try {
      const totalCustomers = (await this.repo.findAll()).length;
      const customersInRange = await this.repo.getCustomersByDateRange(from, to);
      return ok({
        totalCustomers,
        newCustomersCount: customersInRange.length,
        customersInRange,
      });
    } catch (error) {
      return fail(asAppError(error, { status: 500, code: 'GET_CUSTOMERS_BY_DATE_RANGE_FAILED' }));
    }
  }
}

module.exports = new CustomerService();
