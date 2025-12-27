const actionTypeRepo = require('../../Infrastructure/Repositories/AutomationActionTypeRepository');

class AutomationActionTypeService {
  constructor({ repo = actionTypeRepo, logger = console } = {}) {
    this.repo = repo;
    this.logger = logger;
  }

  async create(dto) {
    if (!dto?.action_type) throw new Error('action_type is required');
    if (!dto?.name) dto.name = dto.action_type;

    const existed = await this.repo.findById(dto.action_type);
    if (existed) throw new Error('Action type already exists');

    return this.repo.create({
      action_type: dto.action_type,
      name: dto.name,
      description: dto.description || '',
      config_schema: dto.config_schema || {},
      supported_channels: Array.isArray(dto.supported_channels) ? dto.supported_channels : [],
      is_active: dto.is_active ?? true,
      handler_kind: dto.handler_kind || 'primitive',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async upsert(dto) {
    if (!dto?.action_type) throw new Error('action_type is required');
    if (!dto?.name) dto.name = dto.action_type;

    return this.repo.upsert({
      action_type: dto.action_type,
      name: dto.name,
      description: dto.description || '',
      config_schema: dto.config_schema || {},
      supported_channels: Array.isArray(dto.supported_channels) ? dto.supported_channels : [],
      is_active: dto.is_active ?? true,
      handler_kind: dto.handler_kind || 'primitive',
      updated_at: new Date(),
    });
  }

  async get(action_type) {
    const row = await this.repo.findById(action_type);
    if (!row) throw new Error('Action type not found');
    return row;
  }

  async list(params = {}) {
    return this.repo.list(params);
  }

  async update(action_type, patch) {
    const row = await this.repo.update(action_type, patch);
    if (!row) throw new Error('Action type not found');
    return row;
  }

  async setActive(action_type, is_active) {
    const row = await this.repo.setActive(action_type, is_active);
    if (!row) throw new Error('Action type not found');
    return row;
  }

  async remove(action_type) {
    const ok = await this.repo.delete(action_type);
    if (!ok) throw new Error('Action type not found');
    return { ok: true };
  }
}

module.exports = new AutomationActionTypeService();