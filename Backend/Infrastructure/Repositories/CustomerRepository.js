
const Customer = require('../../Domain/Entities/Customer');
const { Op } = require('sequelize');
class CustomerRepository {
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
  async findAll(params = {}) {
    const limit = params.limit != null ? Number(params.limit) : undefined;
    const offset = params.offset != null ? Number(params.offset) : undefined;
    return await Customer.findAll({
      order: [['created_at', 'DESC']],
      ...(Number.isFinite(limit) ? { limit } : {}),
      ...(Number.isFinite(offset) ? { offset } : {}),
    });
  }
  async delete(customerId) {
    return await Customer.destroy({ where: { customer_id: customerId } });
  }
  async findByEmail(email) {
    return await Customer.findOne({ where: { email } });
  }
  async findByPhone(phone) {
    return await Customer.findOne({ where: { phone } });
  }
  async findByTag(tag) {
    return await Customer.findAll({ where: { tags: { [Op.contains]: [tag], }, }, });
  }
  async findBySource(source) {
    return await Customer.findAll({ where: { source } });
  }
  async getCustomersByDateRange(from, to) {
    const fromDate = new Date(from);
		fromDate.setHours(0, 0, 0, 0);

		const toDate = new Date(to);
		toDate.setHours(0, 0, 0, 0);
		toDate.setDate(toDate.getDate() + 1);

    return await Customer.findAll({
      where: {
        created_at: {
          [Op.gte]: fromDate, // Greater than or equal to fromDate
          [Op.lt]: toDate, // Less than toDate
        }
      }
    });
  }
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
    return await Customer.create(payload, { transaction });
  }
  async listEmails({ limit = 5000 } = {}) {
    const rows = await Customer.findAll({
      attributes: ['email'],
      where: { email: { [Op.ne]: null } },
      limit,
    });
    return rows.map(r => r.email).filter(Boolean);
  }
  async findByConditions(params = {}) {
    const {
      limit = 5000,
      offset = 0,

      // tags
      tags_in,
      tags_not_in,

      // common filters (tùy bạn cần gì thêm)
      // gender
      gender,
      genders,

      // age
      age_min,
      ageMin,
      age_max,
      ageMax,

      // types
      customer_type,
      customerType,

      // search / other
      search,
      is_active,
      source,
      email,
      phone,
      created_from,
      created_to,
      birthday_month,
      interests,
    } = params;

    const where = {};

    if (birthday_month != null) {
      const m = Number(birthday_month);
      where[Op.and] = where[Op.and] || [];
      const literalExpr = `EXTRACT(MONTH FROM "birth_date") = ${m}`;
      where[Op.and].push(Customer.sequelize.literal(literalExpr));
    }

    // Gender filter
    if (gender) {
      where.gender = (typeof gender === 'string' && gender.toLowerCase() === 'all') ? { [Op.ne]: null } : gender;
    } else if (Array.isArray(genders) && genders.length) {
      where.gender = { [Op.in]: genders };
    }

    // Age filter (based on birth_date)
    const minAge = Number(age_min || ageMin || params.age?.min || 0);
    const maxAge = Number(age_max || ageMax || params.age?.max || 0);

    if (minAge > 0 || maxAge > 0) {
      where[Op.and] = where[Op.and] || [];
      const now = new Date();
      if (minAge > 0) {
        const d = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
        where[Op.and].push({ birth_date: { [Op.lte]: d } });
      }
      if (maxAge > 0) {
        const d = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate());
        where[Op.and].push({ birth_date: { [Op.gt]: d } });
      }
    }

    // Interests (treat as tags)
    const interestList = Array.isArray(interests) ? interests : (typeof interests === 'string' ? interests.split(',').map(s => s.trim()) : []);
    if (interestList.length) {
      where[Op.and] = where[Op.and] || [];
      const ors = interestList.map(t => ({ tags: { [Op.contains]: [String(t)] } }));
      where[Op.and].push({ [Op.or]: ors });
    }

    if (is_active != null) where.is_active = !!is_active;
    if (source) where.source = String(source);
    if (email) where.email = String(email);
    if (phone) where.phone = String(phone);
    if (customer_type || customerType) where.customer_type = customer_type || customerType;

    // Date range
    if (created_from || created_to) {
      where.created_at = {};
      if (created_from) where.created_at[Op.gte] = new Date(created_from);
      if (created_to) where.created_at[Op.lte] = new Date(created_to);
    }

    // Search (name/email/phone)
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
      ];
    }

    // tags_in: match ANY tag
    if (Array.isArray(tags_in) && tags_in.length) {
      const ors = tags_in
        .filter(Boolean)
        .map((t) => ({ tags: { [Op.contains]: [String(t)] } }));
      if (ors.length) {
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push({ [Op.or]: ors });
      }
    }

    // tags_not_in: exclude ANY tag
    if (Array.isArray(tags_not_in) && tags_not_in.length) {
      const nors = tags_not_in
        .filter(Boolean)
        .map((t) => ({ tags: { [Op.contains]: [String(t)] } }));
      if (nors.length) {
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push({ [Op.not]: { [Op.or]: nors } });
      }
    }

    return Customer.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(limit) || 5000,
      offset: Number(offset) || 0,
    });
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
  async deleteMany(customerIds = []) {
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return 0;
    }
    const deletedCount = await Customer.destroy({
      where: {
        customer_id: {
          [Op.in]: customerIds,
        },
      },
    });
  }
}
module.exports = new CustomerRepository();
