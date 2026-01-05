// backend/src/Application/Services/CustomerInteractionService.js
const repo = require('../../Infrastructure/Repositories/CustomerInteractionRepository');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');
class CustomerInteractionService {
    async add(customerId, payload, options = {}) {
        try {
            const row = await repo.addInteraction(customerId, payload, options);
            return ok ? ok(row) : { ok: true, data: row };
        } catch (e) {
            return fail ? fail(asAppError(e)) : { ok: false, error: { message: e.message } };
        }
    }

    async list(customerId, query = {}, options = {}) {
        try {
            const rows = await repo.getInteractions(customerId, query, options);
            return ok ? ok(rows) : { ok: true, data: rows };
        } catch (e) {
            return fail ? fail(asAppError(e)) : { ok: false, error: { message: e.message } };
        }
    }
}

module.exports = new CustomerInteractionService();
