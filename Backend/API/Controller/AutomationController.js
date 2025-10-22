const AutomationService = require('../../Application/Services/AutomationService');
const { fail, ok } = require('../../Application/helpers/errors');
class AutomationController {

    static async trigger(req, res) {
        try {
            const { event_name, payload } = req.body;
            if (!event_name) return res.status(400).json(fail('Missing event_name'));

            await AutomationService.trigger(event_name, payload);
            return res.json(ok(`Event ${event_name} triggered successfully.`));
        } catch (err) {
            console.error('[AutomationController.trigger] Error:', err);
            return res.status(500).json(fail('Failed to trigger automation', err.message));
        }
    }
    static async runDaily(req, res) {
        try {
            const result = await AutomationService.runDailyAutomation();
            return res.json(ok(result));
        } catch (err) {
            console.error('[AutomationController.runDaily] Error:', err);
            return res.status(500).json(fail('Failed to run daily automation', err.message));
        }
    }
    static async triggerNow(req, res) {
        try {
            const result = await AutomationService.triggerNow();
            return res.json(ok(result));
        } catch (err) {
            console.error('[AutomationController.triggerNow] Error:', err);
            return res.status(500).json(fail('Failed to trigger now', err.message));
        }
    }
}

module.exports = AutomationController;