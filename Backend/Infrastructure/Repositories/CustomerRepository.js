
const Customer = require('../../Domain/Entities/Customer');
// const ICustomerRepository = require('../../Domain/Interfaces/ICustomerRepository');
const { Op } = require('sequelize');
class CustomerRepository {
  // ---------------- CRUD ----------------
  async create(customer) {
    return await Customer.create(customer);
  }

  async update(customerId, patch) {
    const existing = await Customer.findByPk(customerId);
    if (!existing) throw new Error('Customer not found');
    await existing.update(patch);
    return existing;
  }

  async findById(customerId, options = {}) {
    const { transaction } = options;
    return await Customer.findByPk(customerId, { transaction }) || null;
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

  async getCustomersByDateRange(from, to) {
    return await Customer.findAll({
      where: {
        created_at: {
          [Op.between]: [from, to]
        }
      }
    });
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
  async findOrCreateSmart(payload, { transaction } = {}) {
    let exist = null;
    if (payload.email) exist = await Customer.findOne({ where: { email: payload.email }, transaction });
    if (!exist && payload.phone) exist = await Customer.findOne({ where: { phone: payload.phone }, transaction });
    if (exist) return exist;
    return await Customer.create(payload, { transaction }); // trả instance, không phải [inst, created]
  }
  async listEmails({ limit = 5000 } = {}) {
    const rows = await Customer.findAll({
      attributes: ['email'],
      where: { email: { [Op.ne]: null } },
      limit,
    });
    return rows.map(r => r.email).filter(Boolean);
  }
  async findEmailsByIds(ids = []) {
    const rows = await Customer.findAll({
      attributes: ['email'],
      where: { customer_id: ids },
    });
    return rows.map(r => r.email).filter(Boolean);
  }
  async findEmailsByConditions(cond = {}, { limit = 5000 } = {}) {
    const where = {};
    if (cond.is_active != null) where.is_active = !!cond.is_active;
    const rows = await Customer.findAll({
      attributes: ['email'],
      where,
      limit,
    });
    return rows.map(r => r.email).filter(Boolean);
  }
}

module.exports = new CustomerRepository();
