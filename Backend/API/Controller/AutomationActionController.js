// ENDPOINT GỢI Ý:
// POST   /automation/triggers/:trigger_id/actions
// GET    /automation/flows/:flow_id/actions
// GET    /automation/triggers/:trigger_id/actions
// GET    /automation/actions?status=pending
// GET    /automation/actions/:action_id
// PATCH  /automation/actions/:action_id
// DELETE /automation/actions/:action_id
// GET    /automation/actions/due
// POST   /automation/actions/:action_id/sent
// POST   /automation/actions/:action_id/failed

// const IAutomationActionService = require('../../Application/Interfaces/IAutomationActionService.js');
const AutomationActionService = require('../../Application/Services/AutomationActionService.js');

const actionService = AutomationActionService; // hoặc new AutomationActionService(deps)

class AutomationActionController {
  static async createForTrigger(req, res) {
    try {
      const trigger_id = req.params.trigger_id;
      const {
        flow_id,
        action_type,
        channel = null,
        content = {},
        delay_minutes = 0,
        status = 'pending',
        executed_at = null
      } = req.body;

      if (!action_type) return res.status(400).json({ error: 'action_type is required' });

      const action = await actionService.createAction({
        trigger_id,
        flow_id,
        action_type,
        channel,
        content,
        delay_minutes: Number(delay_minutes) || 0,
        status,
        executed_at,
        created_at: new Date()
      });
      res.status(201).json(action);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async listByFlow(req, res) {
    try {
      const data = await actionService.listActions({ flow_id: req.params.flow_id });
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async listByTrigger(req, res) {
    try {
      const data = await actionService.listActions({ trigger_id: req.params.trigger_id });
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async list(req, res) {
    try {
      const { status, limit, offset } = req.query;
      const data = await actionService.listActions({
        status,
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
      const a = await actionService.getAction(req.params.action_id);
      res.status(200).json(a);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const a = await actionService.updateAction(req.params.action_id, req.body);
      res.status(200).json(a);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await actionService.deleteAction(req.params.action_id);
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async pickDue(req, res) {
    try {
      const now = req.query.now ? new Date(req.query.now) : new Date();
      const data = await actionService.pickDueActions(now);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async markSent(req, res) {
    try {
      const ts = req.body.executed_at ? new Date(req.body.executed_at) : new Date();
      const a = await actionService.markSent(req.params.action_id, ts);
      res.status(200).json(a);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async markFailed(req, res) {
    try {
      const a = await actionService.markFailed(req.params.action_id, req.body.reason || 'unknown');
      res.status(200).json(a);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = AutomationActionController;
