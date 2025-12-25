const crypto = require('crypto');

function signPaymentLink({ order_id, exp }, secret) {
  const msg = `${order_id}.${exp}`;
  return crypto.createHmac('sha256', secret).update(msg).digest('hex');
}

function buildPaymentUrl({ frontendUrl, order_id, exp, sig }) {
  const u = new URL('/checkout', frontendUrl);
  u.searchParams.set('order_id', order_id);
  u.searchParams.set('exp', String(exp));
  u.searchParams.set('sig', sig);
  return u.toString();
}

function createPaymentLink(orderId, { ttlMinutes = 60 } = {}) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const secret = process.env.PAYMENT_LINK_SECRET || 'dev_secret';

  const exp = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
  const sig = signPaymentLink({ order_id: orderId, exp }, secret);
  const url = buildPaymentUrl({ frontendUrl, order_id: orderId, exp, sig });

  return { url, exp, sig };
}

function verifyPaymentLink(orderId, exp, sig) {
  const secret = process.env.PAYMENT_LINK_SECRET || 'dev_secret';
  const now = Math.floor(Date.now() / 1000);
  if (!orderId || !exp || !sig) return { ok: false, reason: 'missing_params' };
  if (Number(exp) < now) return { ok: false, reason: 'expired' };

  const expected = signPaymentLink({ order_id: orderId, exp: Number(exp) }, secret);
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig)))) {
    return { ok: false, reason: 'bad_signature' };
  }
  return { ok: true };
}

module.exports = { createPaymentLink, verifyPaymentLink };
