/* eslint-disable no-console */
const amqp = require('amqplib');
const AutomationService = require('../../Application/Services/AutomationService'); // chỉnh path cho đúng dự án của bạn

class RabbitMQConsumer {
    constructor() {
        this.conn = null;
        this.ch = null;

        this.exchange = process.env.RABBIT_EXCHANGE || 'automation_exchange';
        this.exchangeType = process.env.RABBIT_EXCHANGE_TYPE || 'topic';
        this.queue = process.env.RABBIT_QUEUE || 'automation_queue';
        this.routingKey = process.env.RABBIT_ROUTING_KEY || '#'; // lắng nghe tất cả
        this.prefetch = Number(process.env.RABBIT_PREFETCH || 10);

        // DLQ optional
        this.useDLQ = (process.env.RABBIT_USE_DLQ || 'true') === 'true';
        this.dlx = process.env.RABBIT_DLX || `${this.exchange}.dlx`;
        this.dlq = process.env.RABBIT_DLQ || `${this.queue}.dlq`;
    }

    async start() {
        const url = process.env.RABBIT_URL || 'amqp://localhost';
        this.conn = await amqp.connect(url);
        this.conn.on('error', err => console.error('[RabbitMQConsumer] Connection error:', err));
        this.conn.on('close', () => console.warn('[RabbitMQConsumer] Connection closed'));

        this.ch = await this.conn.createChannel();
        await this.ch.assertExchange(this.exchange, this.exchangeType, { durable: true });

        // DLX/DLQ (optional)
        let queueArgs = { durable: true };
        if (this.useDLQ) {
            await this.ch.assertExchange(this.dlx, 'topic', { durable: true });
            await this.ch.assertQueue(this.dlq, { durable: true });
            queueArgs = {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': this.dlx,
                    'x-dead-letter-routing-key': `${this.queue}.dead`,
                },
            };
        }

        await this.ch.assertQueue(this.queue, queueArgs);
        await this.ch.bindQueue(this.queue, this.exchange, this.routingKey);
        await this.ch.prefetch(this.prefetch);

        await this.ch.consume(this.queue, async (msg) => {
            if (!msg) return;

            let decoded;
            try {
                decoded = JSON.parse(msg.content.toString('utf8'));
            } catch (e) {
                console.error('[RabbitMQConsumer] JSON parse error, acking to avoid poison loop:', e.message);
                // Nếu muốn chuyển DLQ khi parse lỗi, có thể publish lại với routing-key .dead
                return this.ch.ack(msg);
            }

            const { event, payload } = decoded || {};
            if (!event) {
                console.warn('[RabbitMQConsumer] Missing event in message, acking.');
                return this.ch.ack(msg);
            }

            try {
                console.log(`[RabbitMQConsumer] Received event: ${event}`);
                await AutomationService.trigger(event, payload || {});
                this.ch.ack(msg);
            } catch (err) {
                console.error('[RabbitMQConsumer] Handler error:', err);

                // Lỗi tạm thời → requeue = true (cẩn thận vòng lặp)
                // Lỗi không thể xử lý (ví dụ validate fail) → bạn có thể chọn nack requeue=false để đẩy vào DLQ
                const requeueOnError = (process.env.RABBIT_REQUEUE_ON_ERROR || 'false') === 'true';
                this.ch.nack(msg, false, requeueOnError);
            }
        });

        console.log('[RabbitMQConsumer] Listening for automation events...');
    }

    async stop() {
        try {
            if (this.ch) {
                await this.ch.close();
                this.ch = null;
            }
            if (this.conn) {
                await this.conn.close();
                this.conn = null;
            }
            console.log('[RabbitMQConsumer] Stopped.');
        } catch (e) {
            console.error('[RabbitMQConsumer] Stop error:', e);
        }
    }
}

module.exports = new RabbitMQConsumer();
