/* eslint-disable no-console */
const amqp = require('amqplib');

class RabbitMQPublisher {
    constructor() {
        this.connection = null;
        this.channel = null; // confirm channel
        this.exchange = process.env.RABBIT_EXCHANGE || 'automation_exchange';
        this.exchangeType = process.env.RABBIT_EXCHANGE_TYPE || 'topic';
        this.url = process.env.RABBIT_URL || 'amqp://localhost';
        this._connecting = null;
    }

    async init() {
        if (this.channel) return;

        if (this._connecting) {
            await this._connecting; // tránh race
            return;
        }

        this._connecting = (async () => {
            this.connection = await amqp.connect(this.url);
            this.connection.on('error', err => console.error('[RabbitMQPublisher] Connection error:', err));
            this.connection.on('close', () => {
                console.warn('[RabbitMQPublisher] Connection closed');
                this.channel = null;
                this.connection = null;
            });

            // confirm channel để biết publish thành công
            this.channel = await this.connection.createConfirmChannel();
            await this.channel.assertExchange(this.exchange, this.exchangeType, { durable: true });
            console.log('[RabbitMQPublisher] Connected & exchange ready');
        })();

        try {
            await this._connecting;
        } finally {
            this._connecting = null;
        }
    }

    async publish(event, payload) {
        await this.init();
        const message = JSON.stringify({ event, payload, ts: Date.now() });
        return new Promise((resolve, reject) => {
            this.channel.publish(
                this.exchange,
                event,
                Buffer.from(message, 'utf8'),
                {
                    persistent: true,
                    contentType: 'application/json',
                },
                (err, ok) => {
                    if (err) {
                        console.error('[RabbitMQPublisher] Publish error:', err);
                        reject(err);
                    } else {
                        console.log(`[RabbitMQPublisher] Event published: ${event}`);
                        resolve(ok);
                    }
                }
            );
        });
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            console.log('[RabbitMQPublisher] Closed.');
        } catch (e) {
            console.error('[RabbitMQPublisher] Close error:', e);
        }
    }
}

module.exports = new RabbitMQPublisher();
