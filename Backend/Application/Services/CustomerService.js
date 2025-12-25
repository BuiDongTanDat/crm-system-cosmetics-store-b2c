// backend/src/Domain/Services/CustomerService.js
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

class CustomerService {
  constructor() {
    this.repo = customerRepository;
  }

  async createCustomer(customerData) {
    try {
      const customer = await this.repo.create(customerData);
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err));
    }
  }

  async getCustomerById(customerId) {
    try {
      const customer = await this.repo.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_CUSTOMER_FAILED' }));
    }
  }

  async listCustomers(params) {
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
      if (!customer) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_CUSTOMER_FAILED' }));
    }
  }

  async deleteCustomer(customerId) {
    try {
      const deleted = await this.repo.delete(customerId); // có thể trả count hoặc boolean tùy repo
      if (!deleted) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok({ deleted: true });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'DELETE_CUSTOMER_FAILED' }));
    }
  }

  // --------- tiện ích tags ----------
  async addTagToCustomer(customerId, tag) {
    try {
      if (!tag) {
        throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });
      }
      const customer = await this.repo.addTag(customerId, tag);
      if (!customer) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ADD_TAG_FAILED' }));
    }
  }

  async removeTagFromCustomer(customerId, tag) {
    try {
      if (!tag) {
        throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });
      }
      const customer = await this.repo.removeTag(customerId, tag);
      if (!customer) {
        throw new AppError('Customer not found', { status: 404, code: 'CUSTOMER_NOT_FOUND' });
      }
      return ok(customer);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'REMOVE_TAG_FAILED' }));
    }
  }

  // --------- tìm kiếm ----------
  async findCustomersByTag(tag) {
    try {
      const customers = await this.repo.findByTag(tag);
      return ok(customers);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'FIND_BY_TAG_FAILED' }));
    }
  }

  async findCustomersBySource(source) {
    try {
      const customers = await this.repo.findBySource(source);
      return ok(customers);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'FIND_BY_SOURCE_FAILED' }));
    }
  }


  //Trả về tổng số khách hàng được thêm mới
  async getCustomersByDateRange(from, to){
    try {
      const totalCustomers = (await customerRepository.findAll()).length;
      const customersInRange = await customerRepository.getCustomersByDateRange(from, to);
      const newCustomersCount = customersInRange.length;

      return ok({
        totalCustomers,
        newCustomersCount,
        customersInRange
      });
    } catch (error) {
      return fail(asAppError(error, { status: 500, code: 'GET_CUSTOMERS_BY_DATE_RANGE_FAILED' }));
    }
  }
}

module.exports = new CustomerService();
