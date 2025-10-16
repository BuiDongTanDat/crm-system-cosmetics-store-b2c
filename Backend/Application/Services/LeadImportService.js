// src/Application/services/LeadImportService.js
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync'); // npm i csv-parse
const EventEmitter = require('events');

class LeadImportService {
  /**
   * @param {object} deps
   *  - leadRepo: LeadRepository
   *  - bus: EventEmitter (để bắn event cho automation)
   *  - logger: console-like
   */
  constructor({ leadRepo, bus = new EventEmitter(), logger = console }) {
    this.leadRepo = leadRepo;
    this.bus = bus;
    this.logger = logger;
  }

  /** Chuẩn hoá & validate sơ bộ */
  normalize(row) {
    if (!row) return null;
    const statusEnum = new Set(['New','Contacted','Nurturing','Qualified','Converted','Lost']);

    const lead = {
      lead_id: row.lead_id ?? undefined,
      customer_id: row.customer_id ?? null,

      full_name: row.full_name ?? null,
      phone: row.phone ?? null,
      email: row.email?.toLowerCase?.() ?? null,

      lead_source: row.lead_source || 'InBound',
      source_detail: row.source_detail ?? null,

      status: statusEnum.has(row.status) ? row.status : 'New',
      lead_score: Number.isFinite(+row.lead_score) ? +row.lead_score : 0,
      conversion_prob: Number.isFinite(+row.conversion_prob) ? +row.conversion_prob : 0.0,

      assigned_to: row.assigned_to ?? null,

      flow_id: row.flow_id ?? null,
      trigger_type: row.trigger_type ?? null,
      trigger_at: row.trigger_at ? new Date(row.trigger_at) : null,

      notes: row.notes ?? null,
    };

    return lead;
  }

  /** Import từ CSV file path */
  async importFromCSV(filePath) {
    const content = fs.readFileSync(path.resolve(filePath));
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    const imported = [];
    for (const r of records) {
      const lead = this.normalize(r);
      if (!lead) continue;
      const saved = await this.leadRepo.save(lead);
      imported.push(saved);

      // phát event cho automation
      this.bus.emit('lead.imported', { type: 'lead_imported', payload: saved });
      // nếu có trigger_type trong data import thì bắn event tương ứng luôn
      if (saved.trigger_type) {
        this.bus.emit('lead.triggered', {
          type: saved.trigger_type, // ví dụ: 'CART_ABANDON', 'CHECKOUT_RECOVERY'
          payload: { lead_id: saved.lead_id, when: saved.trigger_at || new Date() }
        });
      }
    }
    return imported;
  }

  /** Import từ mảng object JSON */
  async importFromArray(rows = []) {
    const out = [];
    for (const r of rows) {
      const lead = this.normalize(r);
      if (!lead) continue;
      const saved = await this.leadRepo.save(lead);
      out.push(saved);
      this.bus.emit('lead.imported', { type: 'lead_imported', payload: saved });
      if (saved.trigger_type) {
        this.bus.emit('lead.triggered', {
          type: saved.trigger_type,
          payload: { lead_id: saved.lead_id, when: saved.trigger_at || new Date() }
        });
      }
    }
    return out;
  }
}

module.exports = LeadImportService;
