const { CronExpressionParser } = require('cron-parser');
const repo = require('../../Infrastructure/Repositories/AutomationCronJobRepository');

function validateCronExpr(expr, timezone = 'Asia/Ho_Chi_Minh') {
    const it = CronExpressionParser.parse(String(expr), { tz: timezone });
    it.next();
    return true;
}

class AutomationCronJobService {
    async list() {
        const rows = await repo.findAll();
        return { ok: true, data: rows };
    }

    async listEnabled() {
        const rows = await repo.findEnabled();
        return { ok: true, data: rows };
    }

    async get(job_key) {
        const row = await repo.findByJobKey(job_key);
        if (!row) return { ok: false, error: { message: 'CRON_JOB_NOT_FOUND' }, status: 404 };
        return { ok: true, data: row };
    }

    async upsert(payload) {
        const { job_key, name, event_type, cron_expr } = payload || {};
        if (!job_key || !name || !event_type || !cron_expr) {
            return { ok: false, error: { message: 'Missing required fields: job_key,name,event_type,cron_expr' }, status: 400 };
        }

        try {
            validateCronExpr(cron_expr, payload.timezone || 'Asia/Ho_Chi_Minh');
        } catch (e) {
            return { ok: false, error: { message: `Invalid cron_expr: ${e.message}` }, status: 400 };
        }

        const row = await repo.upsertByJobKey({
            job_key,
            name,
            description: payload.description ?? null,
            event_type,
            cron_expr,
            timezone: payload.timezone || 'Asia/Ho_Chi_Minh',
            enabled: payload.enabled ?? true,
            meta: payload.meta ?? {},
        });

        return { ok: true, data: row };
    }

    async update(job_key, payload) {
        if (!job_key) return { ok: false, error: { message: 'job_key is required' }, status: 400 };

        if (payload?.cron_expr) {
            try {
                validateCronExpr(payload.cron_expr, payload.timezone || 'Asia/Ho_Chi_Minh');
            } catch (e) {
                return { ok: false, error: { message: `Invalid cron_expr: ${e.message}` }, status: 400 };
            }
        }

        const row = await repo.updateByJobKey(job_key, {
            ...(payload.name != null ? { name: payload.name } : {}),
            ...(payload.description != null ? { description: payload.description } : {}),
            ...(payload.event_type != null ? { event_type: payload.event_type } : {}),
            ...(payload.cron_expr != null ? { cron_expr: payload.cron_expr } : {}),
            ...(payload.timezone != null ? { timezone: payload.timezone } : {}),
            ...(payload.enabled != null ? { enabled: payload.enabled } : {}),
            ...(payload.meta != null ? { meta: payload.meta } : {}),
        });

        if (!row) return { ok: false, error: { message: 'CRON_JOB_NOT_FOUND' }, status: 404 };
        return { ok: true, data: row };
    }

    async remove(job_key) {
        const ok = await repo.deleteByJobKey(job_key);
        if (!ok) return { ok: false, error: { message: 'CRON_JOB_NOT_FOUND' }, status: 404 };
        return { ok: true, data: { deleted: true } };
    }
}

module.exports = new AutomationCronJobService();
