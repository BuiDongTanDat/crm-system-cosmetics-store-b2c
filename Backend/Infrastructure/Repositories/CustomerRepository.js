const Customer = require('../../Domain/Entities/Customer');
const ICustomerRepository = require('../../Domain/Interfaces/ICustomerRepository');

class CustomerRepository extends ICustomerRepository {
  // ---------------- CRUD ----------------
  async create(customer) {
    return await Customer.create(customer.toJSON());
  }

  async update(customer) {
    const existing = await Customer.findByPk(customer.customer_id);
    if (!existing) throw new Error('Customer not found');
    await existing.update(customer.toJSON());
    return existing;
  }

  async findById(customerId) {
    return await Customer.findByPk(customerId) || null;
  }

  async findAll() {
    return await Customer.findAll();
  }

  async delete(customerId) {
    await Customer.destroy({ where: { customer_id: customerId } });
  }

  // ---------------- Tìm kiếm ----------------
  async findByEmail(email) {
    return await Customer.findOne({ where: { email } });
  }

  async findByPhone(phone) {
    return await Customer.findOne({ where: { phone } });
  }

  async findByTag(tag) {
    return await Customer.findAll({
      where: { tags: { [Customer.sequelize.Op.contains]: [tag] } }
    });
  }

  async findBySource(source) {
    return await Customer.findAll({ where: { source } });
  }

  // ---------------- Nghiệp vụ tiện ích ----------------
  async addTag(customerId, tag) {
    const customer = await this.findById(customerId);
    if (!customer) return null;
    customer.addTag(tag);
    await customer.save();
    return customer;
  }

  async removeTag(customerId, tag) {
    const customer = await this.findById(customerId);
    if (!customer) return null;
    customer.removeTag(tag);
    await customer.save();
    return customer;
  }

  async addSocialChannel(customerId, platform, account) {
    const customer = await this.findById(customerId);
    if (!customer) return null;
    customer.addSocialChannel(platform, account);
    await customer.save();
    return customer;
  }

  async removeSocialChannel(customerId, platform) {
    const customer = await this.findById(customerId);
    if (!customer) return null;
    customer.removeSocialChannel(platform);
    await customer.save();
    return customer;
  }
}

module.exports = CustomerRepository;
