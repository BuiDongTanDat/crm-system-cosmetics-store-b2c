// backend/src/Presentation/routes/track.js
const express = require('express');
const Rabbit = require('../../Infrastructure/Bus/RabbitMQPublisher');
const CampaignChannelRepo = require('../../Infrastructure/Repositories/CampaignChannelRepository');

const router = express.Router();

const GIF_1x1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64'
);
const openedDedupe = new Map();
function seenRecently(key, ttlMs) {
  const now = Date.now();
  const last = openedDedupe.get(key);
  if (last && now - last < ttlMs) return true;
  openedDedupe.set(key, now);
  if (openedDedupe.size > 50000) {
    const cutoff = now - ttlMs;
    for (const [k, t] of openedDedupe.entries()) {
      if (t < cutoff) openedDedupe.delete(k);
    }
  }
  return false;
}
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    ''
  );
}
async function publishOpened({ mid, req, extra = {} }) {
  if (!mid) return;
  const ip = getClientIp(req);
  const ua = req.get('user-agent') || '';
  const key = `${mid}|${ip}|${ua}`;
  if (seenRecently(key, 10 * 60 * 1000)) return;
  await Rabbit.publish('engagement.email_opened', {
    mid,
    user_agent: ua,
    ip,
    at: new Date().toISOString(),
    ...extra,
  });
}
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
    campaign_id,
    channel_id,
  } = req.query;
  const ip = getClientIp(req);
  const ua = req.get('user-agent') || '';
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).send('Invalid url');
  }
  try {
    await publishOpened({
      mid,
      req,
      extra: {
        source: 'click',
        to,
        flow_id,
        template_key,
        order_id,
        customer_id,
        lead_id,
        campaign_id,
        channel_id,
      },
    });
    if (mid) {
      await Rabbit.publish('engagement.link_clicked', {
        mid,
        to,
        flow_id,
        template_key,
        order_id,
        customer_id,
        lead_id,
        campaign_id,
        channel_id,
        url,
        user_agent: ua,
        ip,
        at: new Date().toISOString(),
      });
    }
  } catch (e) {
  }
  if (channel_id) {
    try {
      // total click +1
      await CampaignChannelRepo.incById(channel_id, { clicks_total: 1 });
      const uniqKey = `click|${channel_id}|${String(to || '')}|${String(mid || '')}`;
      if (!seenRecently(uniqKey, 24 * 60 * 60 * 1000)) {
        await CampaignChannelRepo.incById(channel_id, { clicks_unique: 1 });
      }
    } catch (e) {
      // không block redirect
    }
  }
  return res.redirect(302, url);
});

module.exports = router;
