const eventTypeRepo = require('../../Infrastructure/Repositories/AutomationEventTypeRepository');

class AutomationEventTypeService {
  constructor({ repo = eventTypeRepo, logger = console } = {}) {
    this.repo = repo;
    this.logger = logger;
  }

  async create(dto) {
    if (!dto?.event_type) throw new Error('event_type is required');
    if (!dto?.name) dto.name = dto.event_type;

    const existed = await this.repo.findById(dto.event_type);
    if (existed) throw new Error('Event type already exists');

    return this.repo.create({
      event_type: dto.event_type,
      name: dto.name,
      description: dto.description || '',
      payload_schema: dto.payload_schema || {},
      is_active: dto.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async upsert(dto) {
    if (!dto?.event_type) throw new Error('event_type is required');
    if (!dto?.name) dto.name = dto.event_type;

    return this.repo.upsert({
      event_type: dto.event_type,
      name: dto.name,
      description: dto.description || '',
      payload_schema: dto.payload_schema || {},
      is_active: dto.is_active ?? true,
      updated_at: new Date(),
    });
  }

  async get(event_type) {
    const row = await this.repo.findById(event_type);
    if (!row) throw new Error('Event type not found');
    return row;
  }

  async list(params = {}) {
    return this.repo.list(params);
  }

  async update(event_type, patch) {
    const row = await this.repo.update(event_type, patch);
    if (!row) throw new Error('Event type not found');
    return row;
  }

  async setActive(event_type, is_active) {
    const row = await this.repo.setActive(event_type, is_active);
    if (!row) throw new Error('Event type not found');
    return row;
  }

  async remove(event_type) {
    const ok = await this.repo.delete(event_type);
    if (!ok) throw new Error('Event type not found');
    return { ok: true };
  }
}

module.exports = new AutomationEventTypeService();