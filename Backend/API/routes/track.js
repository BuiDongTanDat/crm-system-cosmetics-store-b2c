// backend/src/Presentation/routes/track.js
const express = require('express');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');

const router = express.Router();

const GIF_1x1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64'
);

// -------------------
// EMAIL OPEN TRACKING
// -------------------
router.get('/open.gif', async (req, res) => {
  try {
    const {
      mid,
      to,
      flow_id,
      template_key,
      order_id,
      customer_id,
      lead_id,
    } = req.query;

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      req.ip;

    if (mid) {
      await Rabbit.publish('engagement.email_opened', {
        mid,
        to,
        flow_id,
        template_key,
        order_id,
        customer_id,
        lead_id,
        user_agent: req.get('user-agent') || '',
        ip,
        at: new Date().toISOString(),
      });
    }
  } catch (e) {
    // nuốt lỗi để không ảnh hưởng load ảnh
  }

  res.set('Content-Type', 'image/gif');
  res.set('Content-Length', GIF_1x1.length);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');

  return res.status(200).send(GIF_1x1);
});

// -------------------
// LINK CLICK TRACKING
// -------------------
router.get('/click', async (req, res) => {
  const {
    mid,
    to,
    url,
    flow_id,
    template_key,
    order_id,
    customer_id,
    lead_id,
  } = req.query;

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip;

  try {
    if (mid && url) {
      await Rabbit.publish('engagement.link_clicked', {
        mid,
        to,
        flow_id,
        template_key,
        order_id,
        customer_id,
        lead_id,
        url,
        user_agent: req.get('user-agent') || '',
        ip,
        at: new Date().toISOString(),
      });
    }
  } catch (e) {
    // nuốt lỗi
  }

  // chặn open redirect
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).send('Invalid url');
  }

  return res.redirect(302, url);
});

module.exports = router;
