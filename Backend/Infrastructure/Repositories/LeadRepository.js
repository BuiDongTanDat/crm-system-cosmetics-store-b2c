const { Op } = require('sequelize');
const Lead = require('../../Domain/Entities/Lead'); // file Model.init kiểu Product bạn đã làm

class LeadRepository {
  // Lấy lead theo ID
  async findById(leadId) {
    return await Lead.findByPk(leadId);
  }

  // Lấy tất cả lead (cẩn thận với volume lớn)
  async findAll() {
    return await Lead.findAll();
  }

  // Tạo hoặc cập nhật lead
  async save(lead) {
    const payload = typeof lead.toJSON === 'function' ? lead.toJSON() : lead;

    if (!payload.lead_id) {
      return await Lead.create(payload);
    }

    const existing = await Lead.findByPk(payload.lead_id);
    if (existing) {
      await existing.update(payload);
      return existing;
    }
    return await Lead.create(payload);
  }

  // Xoá lead theo ID
  async delete(leadId) {
    await Lead.destroy({ where: { lead_id: leadId } });
  }

  // Tìm lead theo trạng thái
  async findByStatus(status) {
    return await Lead.findAll({ where: { status }, order: [['updated_at', 'DESC']] });
  }

  // Tìm lead theo nguồn/kênh
  async findBySource(lead_source, source_detail = null) {
    const where = { lead_source };
    if (source_detail) where.source_detail = source_detail;
    return await Lead.findAll({ where, order: [['updated_at', 'DESC']] });
  }

  // Tìm nhanh theo tên/email/phone
  async search(q, limit = 50) {
    if (!q) return [];
    return await Lead.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${q}%` } },
          { email:     { [Op.iLike]: `%${q}%` } },
          { phone:     { [Op.iLike]: `%${q}%` } },
          { notes:     { [Op.iLike]: `%${q}%` } },
        ]
      },
      order: [['updated_at', 'DESC']],
      limit
    });
  }

  // Cập nhật trạng thái
  async updateStatus(leadId, newStatus) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) return null;
    await lead.update({ status: newStatus });
    return lead;
  }

  // Gán owner
  async assignOwner(leadId, owner) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) return null;
    await lead.update({ assigned_to: owner });
    return lead;
  }

  // Cập nhật flow/trigger
  async updateFlow(leadId, { flow_id = null, trigger_type = null, trigger_at = null } = {}) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) return null;
    await lead.update({ flow_id, trigger_type, trigger_at });
    return lead;
  }

  // Lấy lead “nóng” theo điểm
  async findHot(minScore = 70, limit = 100) {
    return await Lead.findAll({
      where: { lead_score: { [Op.gte]: minScore } },
      order: [['lead_score', 'DESC']],
      limit
    });
  }

  // Phân trang đơn giản
  async paginate({ page = 1, pageSize = 20, filters = {} } = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.lead_source) where.lead_source = filters.lead_source;
    if (filters.source_detail) where.source_detail = filters.source_detail;

    const offset = (Math.max(page, 1) - 1) * pageSize;

    const { rows, count } = await Lead.findAndCountAll({
      where,
      order: [['updated_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    return {
      data: rows,
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize) || 1,
    };
  }
}

module.exports = LeadRepository;
