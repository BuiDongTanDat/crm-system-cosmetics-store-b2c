// backend/src/Infrastructure/Repositories/AutomationCronJobRepository.js
const AutomationCronJob = require('../../Domain/Entities/AutomationCronJob');

class AutomationCronJobRepository {
  async findAll() {
    return AutomationCronJob.findAll({ order: [['created_at', 'DESC']] });
  }

  async findEnabled() {
    return AutomationCronJob.findAll({
      where: { enabled: true },
      order: [['job_key', 'ASC']],
    });
  }

  async findByJobKey(job_key) {
    return AutomationCronJob.findOne({ where: { job_key } });
  }

  async upsertByJobKey(payload) {
    const job_key = payload.job_key;
    if (!job_key) throw new Error('job_key is required');

    const existed = await this.findByJobKey(job_key);
    if (existed) {
      await existed.update(payload);
      return existed;
    }
    return AutomationCronJob.create(payload);
  }

  async updateByJobKey(job_key, payload) {
    const existed = await this.findByJobKey(job_key);
    if (!existed) return null;
    await existed.update(payload);
    return existed;
  }

  async deleteByJobKey(job_key) {
    const existed = await this.findByJobKey(job_key);
    if (!existed) return false;
    await existed.destroy();
    return true;
  }
}

module.exports = new AutomationCronJobRepository();
