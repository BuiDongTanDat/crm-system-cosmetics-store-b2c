const AutomationService = require('../../Application/Services/AutomationService');
const { fail, ok } = require('../../Application/helpers/errors');
class AutomationController {
    static async handleEvent(req, res) {
        try {
            const { eventName, leadId, payload } = req.body;
            const result = await AutomationService.handleEvent(eventName, leadId, payload);
            res.status(result.ok ? 200 : result.error?.status || 500).json(result);
        } catch (e) {
            res.status(500).json({ ok: false, data: null, error: { status: 500, code: 'INTERNAL_ERROR', message: e.message } });
        }
    }
    static async trigger(req, res) {
        try {
            const { event, lead_id, payload, timestamp } = req.body || {};
            if (!event) return res.status(400).json(fail(400, 'VALIDATION_ERROR', 'event is required'));
            if (!lead_id) return res.status(400).json(fail(400, 'VALIDATION_ERROR', 'lead_id is required'));

            await AutomationService.trigger(event, { lead_id, payload: payload || {}, timestamp: timestamp || new Date().toISOString() });
            return res.status(200).json(ok({ triggered: true }));
        } catch (err) {
            console.error('[AutomationController.trigger] error:', err);
            return res.status(500).json(fail(500, 'TRIGGER_FAILED', err.message));
        }
    }

}

module.exports = AutomationController;