const express = require('express');
const router = express.Router();
const { verifyPaymentLink } = require('../../Infrastructure/utils/paymentLink');
const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
router.get('/verify', async (req, res) => {
  const { order_id, exp, sig } = req.query;
  const v = verifyPaymentLink(order_id, exp, sig);
  if (!v.ok) return res.status(400).json({ ok: false, reason: v.reason });
  const order = await OrderRepo.findById(order_id);
  if (!order) return res.status(404).json({ ok: false, reason: 'order_not_found' });
  return res.json({ ok: true, order: order?.toJSON?.() ?? order });
});
router.post('/confirm', async (req, res) => {
  const { order_id, exp, sig, method } = req.body || {};
  const v = verifyPaymentLink(order_id, exp, sig);
  if (!v.ok) return res.status(400).json({ ok: false, reason: v.reason });
  await OrderRepo.updateById(order_id, { status: 'paid', payment_method: method || 'manual' });
  return res.json({ ok: true });
});

module.exports = router;
