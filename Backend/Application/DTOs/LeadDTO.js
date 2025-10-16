class CreateRequestLeadDTO {
  constructor(req = {}) {
    this.id = req.id || null;
    this.name = req.name || '';
    this.email = req.email || '';
    this.phone = req.phone || '';
    this.status = req.status || 'new';
    this.source = req.source || 'manual';
    this.tags = Array.isArray(req.tags) ? req.tags : [];
  }
  static from(body = {}) {
    return new CreateRequestLeadDTO(body);
  }
}
module.exports = {CreateRequestLeadDTO};