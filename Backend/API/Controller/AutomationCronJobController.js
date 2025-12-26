// backend/src/Presentation/Controllers/AutomationCronJobController.js
const svc = require('../../Application/Services/AutomationCronJobService');

class AutomationCronJobController {
  async list(req, res) {
    const r = await svc.list();
    return res.status(200).json(r);
  }

  async get(req, res) {
    const r = await svc.get(req.params.job_key);
    return res.status(r.status || 200).json(r);
  }

  async upsert(req, res) {
    const r = await svc.upsert(req.body);
    return res.status(r.status || 200).json(r);
  }

  async update(req, res) {
    const r = await svc.update(req.params.job_key, req.body);
    return res.status(r.status || 200).json(r);
  }

  async remove(req, res) {
    const r = await svc.remove(req.params.job_key);
    return res.status(r.status || 200).json(r);
  }
}

module.exports = new AutomationCronJobController();
