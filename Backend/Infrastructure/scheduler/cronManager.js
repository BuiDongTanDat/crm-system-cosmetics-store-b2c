// backend/src/Infrastructure/scheduler/cronManager.js
/* eslint-disable no-console */
const cron = require('node-cron');
const AutomationService = require('../../Application/Services/AutomationService');
const CronJobRepo = require('../Repositories/AutomationCronJobRepository');

const jobs = new Map();   // job_key -> { task, fingerprint }
let reloader = null;

function fingerprint(row) {
  return `${row.enabled}|${row.event_type}|${row.cron_expr}|${row.timezone}`;
}

function stopJob(job_key) {
  const cur = jobs.get(job_key);
  if (!cur) return;
  try {
    cur.task.stop();
  } catch (e) {}
  jobs.delete(job_key);
  console.log(`[CRON-MGR] stopped: ${job_key}`);
}

function startJob(row) {
  const tz = row.timezone || 'Asia/Ho_Chi_Minh';
  const expr = row.cron_expr;

  const task = cron.schedule(
    expr,
    async () => {
      try {
        console.log(`[CRON-MGR] fired job_key=${row.job_key} event=${row.event_type}`);
        await AutomationService.trigger(row.event_type, {
          job_key: row.job_key,
          fired_at: new Date().toISOString(),
          cron_expr: row.cron_expr,
          timezone: tz,
        });
      } catch (e) {
        console.error('[CRON-MGR] trigger error:', e?.message || e);
      }
    },
    { timezone: tz }
  );

  task.start();

  jobs.set(row.job_key, { task, fingerprint: fingerprint(row) });
  console.log(`[CRON-MGR] started: ${row.job_key} expr="${expr}" tz=${tz} event=${row.event_type}`);
}

async function reconcileOnce() {
  const enabledRows = await CronJobRepo.findEnabled();
  const seen = new Set();

  for (const row of enabledRows) {
    seen.add(row.job_key);

    const fp = fingerprint(row);
    const existing = jobs.get(row.job_key);

    // new
    if (!existing) {
      startJob(row);
      continue;
    }

    // changed => restart
    if (existing.fingerprint !== fp) {
      stopJob(row.job_key);
      startJob(row);
    }
  }

  // disabled or removed => stop
  for (const job_key of Array.from(jobs.keys())) {
    if (!seen.has(job_key)) stopJob(job_key);
  }
}

function startCronManager({ reloadSeconds = 30 } = {}) {
  if (reloader) return;

  // bootstrap
  reconcileOnce().catch((e) => console.error('[CRON-MGR] bootstrap error:', e));

  reloader = setInterval(() => {
    reconcileOnce().catch((e) => console.error('[CRON-MGR] reconcile error:', e));
  }, reloadSeconds * 1000);

  console.log(`[CRON-MGR] started with reloadSeconds=${reloadSeconds}`);
}

function stopCronManager() {
  if (reloader) clearInterval(reloader);
  reloader = null;

  for (const job_key of Array.from(jobs.keys())) stopJob(job_key);
  console.log('[CRON-MGR] stopped');
}

module.exports = { startCronManager, stopCronManager };
