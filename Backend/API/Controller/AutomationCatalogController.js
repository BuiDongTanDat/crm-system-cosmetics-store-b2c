
// backend/src/Presentation/Controllers/AutomationCatalogController.js
const eventTypeSvc = require('../../Application/Services/AutomationEventTypeService.js');
const actionTypeSvc = require('../../Application/Services/AutomationActionTypeService.js');

function parseBool(v) {
  if (v === undefined) return undefined;
  if (v === true || v === 'true' || v === '1' || v === 1) return true;
  if (v === false || v === 'false' || v === '0' || v === 0) return false;
  return undefined;
}

class AutomationCatalogController {
  // ---- EVENT TYPES ----
  async listEventTypes(req, res) {
    try {
      const items = await eventTypeSvc.list({
        is_active: parseBool(req.query.is_active),
        q: req.query.q,
        limit: Number(req.query.limit || 1000),
        offset: Number(req.query.offset || 0),
      });
      return res.json({ ok: true, data: items.map((x) => x.toJSON?.() ?? x) });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async getEventType(req, res) {
    try {
      const row = await eventTypeSvc.get(req.params.event_type);
      return res.json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(404).json({ ok: false, error: { message: e.message } });
    }
  }

  async createEventType(req, res) {
    try {
      const row = await eventTypeSvc.create(req.body);
      return res.status(201).json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async updateEventType(req, res) {
    try {
      const row = await eventTypeSvc.update(req.params.event_type, req.body || {});
      return res.json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async setEventTypeActive(req, res) {
    try {
      const row = await eventTypeSvc.setActive(req.params.event_type, !!req.body?.is_active);
      return res.json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async deleteEventType(req, res) {
    try {
      const out = await eventTypeSvc.remove(req.params.event_type);
      return res.json({ ok: true, data: out });
    } catch (e) {
      return res.status(404).json({ ok: false, error: { message: e.message } });
    }
  }

  // ---- ACTION TYPES ----
  async listActionTypes(req, res) {
    try {
      const items = await actionTypeSvc.list({
        is_active: parseBool(req.query.is_active),
        q: req.query.q,
        limit: Number(req.query.limit || 1000),
        offset: Number(req.query.offset || 0),
      });
      return res.json({ ok: true, data: items.map((x) => x.toJSON?.() ?? x) });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async getActionType(req, res) {
    try {
      const row = await actionTypeSvc.get(req.params.action_type);
      return res.json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(404).json({ ok: false, error: { message: e.message } });
    }
  }

  async createActionType(req, res) {
    try {
      const row = await actionTypeSvc.create(req.body);
      return res.status(201).json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async updateActionType(req, res) {
    try {
      const row = await actionTypeSvc.update(req.params.action_type, req.body || {});
      return res.json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async setActionTypeActive(req, res) {
    try {
      const row = await actionTypeSvc.setActive(req.params.action_type, !!req.body?.is_active);
      return res.json({ ok: true, data: row.toJSON?.() ?? row });
    } catch (e) {
      return res.status(400).json({ ok: false, error: { message: e.message } });
    }
  }

  async deleteActionType(req, res) {
    try {
      const out = await actionTypeSvc.remove(req.params.action_type);
      return res.json({ ok: true, data: out });
    } catch (e) {
      return res.status(404).json({ ok: false, error: { message: e.message } });
    }
  }
}

module.exports = new AutomationCatalogController();
