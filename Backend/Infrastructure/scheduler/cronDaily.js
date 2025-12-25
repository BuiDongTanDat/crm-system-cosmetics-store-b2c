/* eslint-disable no-console */
const cron = require('node-cron');
const AutomationService = require('../../Application/Services/AutomationService');

let job = null;

function startCronDaily() {
  if (job) return; // tránh register 2 lần

  const tz = process.env.TZ || 'Asia/Ho_Chi_Minh';
  const expr = process.env.CRON_DAILY_EXPR || '26 21 * * *';

  job = cron.schedule(
    expr,
    async () => {
      try {
        console.log('[CRON] cron.daily fired');
        await AutomationService.trigger('cron.daily', { job_key: 'daily', fired_at: new Date().toISOString() });
      } catch (e) {
        console.error('[CRON] cron.daily error:', e?.message || e);
      }
    },
    { timezone: tz }
  );

  job.start();
  console.log(`[CRON] startCronDaily registered: "${expr}" tz=${tz}`);
}

function stopCronDaily() {
  if (!job) return;
  job.stop();
  job = null;
  console.log('[CRON] cron.daily stopped');
}

module.exports = { startCronDaily, stopCronDaily };
