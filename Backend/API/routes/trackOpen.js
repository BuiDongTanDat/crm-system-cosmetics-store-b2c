// routes/trackOpen.js
const express = require('express');
const amqp = require('amqplib');
const router = express.Router();

const GIF_1PX = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');

let channel;
(async () => {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await conn.createChannel();
    await channel.assertExchange('engagement.events', 'topic', { durable: true });
})();

router.get('/track/open', async (req, res) => {
    const { lead_id, email_id } = req.query;

    // publish event duy nhất bạn có
    const payload = {
        type: 'engagement.email_opened',
        lead: { lead_id, status: 'new' }, // hoặc truy DB lấy status thật
        meta: { email_id, timestamp: new Date().toISOString(), ua: req.get('user-agent') || '' }
    };

    if (channel) {
        channel.publish('engagement.events', 'engagement.email_opened',
            Buffer.from(JSON.stringify(payload)), { persistent: true });
    }

    // trả ảnh 1x1 + no-cache
    res.set({
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
    });
    res.status(200).end(GIF_1PX);
});

module.exports = router;
