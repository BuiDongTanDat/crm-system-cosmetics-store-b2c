// ENDPOINT GỢI Ý:
// POST   /automation/flows/:flow_id/triggers
// GET    /automation/flows/:flow_id/triggers
// GET    /automation/triggers
// GET    /automation/triggers/:trigger_id
// PATCH  /automation/triggers/:trigger_id
// DELETE /automation/triggers/:trigger_id
// POST   /automation/triggers/:trigger_id/activate
// POST   /automation/triggers/:trigger_id/deactivate

// const IAutomationTriggerService = require('../../Application/Interfaces/IAutomationTriggerService');
const AutomationTriggerService = require('../../Application/Services/AutomationTriggerService');

const triggerService = AutomationTriggerService; // hoặc new AutomationTriggerService(deps)

class AutomationTriggerController {
  static async createForFlow(req, res) {
    try {
      const flow_id = req.params.flow_id;
      const { event_type, conditions = {}, is_active = true } = req.body;
      if (!event_type) return res.status(400).json({ error: 'event_type is required' });
      const trig = await triggerService.createTrigger({ flow_id, event_type, conditions, is_active });
      res.status(201).json(trig);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async listByFlow(req, res) {
    try {
      const data = await triggerService.listTriggers({ flow_id: req.params.flow_id });
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async list(req, res) {
    try {
      const { event_type, is_active, limit, offset } = req.query;
      const data = await triggerService.listTriggers({
        event_type,
        is_active: is_active === undefined ? undefined : is_active === 'true',
        limit: Number(limit) || 100,
        offset: Number(offset) || 0
      });
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async get(req, res) {
    try {
      const t = await triggerService.getTrigger(req.params.trigger_id);
      res.status(200).json(t);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const t = await triggerService.updateTrigger(req.params.trigger_id, req.body);
      res.status(200).json(t);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await triggerService.deleteTrigger(req.params.trigger_id);
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async activate(req, res) {
    try {
      const t = await triggerService.setActive(req.params.trigger_id, true);
      res.status(200).json(t);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deactivate(req, res) {
    try {
      const t = await triggerService.setActive(req.params.trigger_id, false);
      res.status(200).json(t);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = AutomationTriggerController;
