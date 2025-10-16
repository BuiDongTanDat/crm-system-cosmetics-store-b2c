// helpers/errors.js
class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details) this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

const asAppError = (err, fallback = {}) => {
  if (err instanceof AppError) return err;
  const status = fallback.status ?? 500;
  const code = fallback.code ?? 'INTERNAL_ERROR';
  const details = err?.errors || err?.original || undefined;
  return new AppError(err?.message || 'Internal Server Error', { status, code, details });
};

// Định dạng response chuẩn
const ok = (data) => ({ ok: true, data, error: null });
const fail = (err) => ({
  ok: false,
  data: null,
  error: {
    status: err.status ?? 500,
    code: err.code ?? 'INTERNAL_ERROR',
    message: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  },
});

module.exports = { AppError, asAppError, ok, fail };
