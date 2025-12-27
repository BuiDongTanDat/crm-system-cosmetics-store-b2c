const express = require('express');
const router = express.Router();
const { verifyPaymentLink } = require('../../Infrastructure/utils/paymentLink');
const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');

// GET /payment/verify?order_id=...&exp=...&sig=...
router.get('/verify', async (req, res) => {
  const { order_id, exp, sig } = req.query;
  const v = verifyPaymentLink(order_id, exp, sig);
  if (!v.ok) return res.status(400).json({ ok: false, reason: v.reason });
  // optional: check order exists
  const order = await OrderRepo.findById(order_id);
  if (!order) return res.status(404).json({ ok: false, reason: 'order_not_found' });
  return res.json({ ok: true, order: order?.toJSON?.() ?? order });
});

// POST /payment/confirm { order_id, exp, sig, method }
router.post('/confirm', async (req, res) => {
  const { order_id, exp, sig, method } = req.body || {};
  const v = verifyPaymentLink(order_id, exp, sig);
  if (!v.ok) return res.status(400).json({ ok: false, reason: v.reason });
  // TODO: tích hợp cổng thanh toán thật; tạm thời mark paid:
  await OrderRepo.updateById(order_id, { status: 'paid', payment_method: method || 'manual' });
  // phát event order.paid nếu bạn có event emitter cho Order:
  // OrderEvents.emitPaid({ order_id });

  return res.json({ ok: true });
});

module.exports = router;
