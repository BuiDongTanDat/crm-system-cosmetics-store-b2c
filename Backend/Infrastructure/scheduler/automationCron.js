/* eslint-disable no-console */
const Rabbit = require('../Bus/RabbitMQPublisher');

// parse đơn giản: PT5M / PT10S / PT1H
function parseDelayToMs(delay) {
  if (!delay) return 0;
  const s = String(delay).trim();

  // hỗ trợ dạng minutes int (nếu bạn truyền 5 thay vì PT5M)
  if (/^\d+$/.test(s)) return Number(s) * 60 * 1000;

  const m = s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) return 0;

  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const sec = Number(m[3] || 0);
  return ((h * 60 + min) * 60 + sec) * 1000;
}

async function enqueueIn(delayIso, event, payload) {
  const ms = parseDelayToMs(delayIso);
  console.log('[Scheduler] enqueueIn', { delayIso, ms, event });

  setTimeout(async () => {
    try {
      await Rabbit.publish(event, payload);
      console.log('[Scheduler] published delayed event:', event);
    } catch (e) {
      console.error('[Scheduler] delayed publish failed:', e?.message || e);
    }
  }, Math.max(0, ms));

  return { ok: true };
}

module.exports = { enqueueIn };
