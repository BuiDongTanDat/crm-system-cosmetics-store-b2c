class ILeadService {
  async getAll() {}
  async getById(id) {}
  async create(data) {}
  async update(id, data) {}
  async delete(id) {}

  async assignLead(id, userId) {}
  async changeStatus(id, status) {}
  async getByStatus(status) {}

  async importLeads(filePath) {} // <== thêm mới

  // AI-related
  async analyzeLeadScore(id) {}
  async autoClassifyLead(id) {}
  async autoDistributeLeads() {}
  async convertLeadToCustomer(id) {}
  
}

module.exports = ILeadService;
