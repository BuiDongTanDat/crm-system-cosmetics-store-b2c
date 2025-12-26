// backend/src/Infrastructure/external/EmailService.js

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.env = process.env.NODE_ENV || 'development';
        this.mockMode = (process.env.MAIL_MOCK ?? '').length
            ? process.env.MAIL_MOCK === 'true'
            : this.env !== 'production';

        this.transporter = null;

        if (!this.mockMode) {
            this.initTransporter();
        }

        this.send = this.send.bind(this);
        console.log('[EmailService] env =', this.env, 'mockMode =', this.mockMode);
    }

    initTransporter() {
        const {
            SMTP_HOST,
            SMTP_PORT = '587',
            SMTP_SECURE,
            SMTP_USER,
            SMTP_PASS,
        } = process.env;

        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
            throw new Error('Email transporter not configured: missing SMTP_HOST/SMTP_USER/SMTP_PASS');
        }

        const portNum = Number(SMTP_PORT);
        const secure =
            typeof SMTP_SECURE !== 'undefined'
                ? String(SMTP_SECURE) === 'true'
                : portNum === 465;

        this.transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: portNum,
            secure,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
            logger: true,
            debug: true,
            tls: { ciphers: 'TLSv1.2' },
        });
    }

    async send({ to, subject, body, channel = 'email', template }) {
        if (!to) throw new Error('EmailService.send() missing `to`');

        const templateTag =
            template && typeof template === 'object'
                ? (template.key || template.name || 'template')
                : (template ? String(template) : '');

        // đảm bảo có HTML tối thiểu
        const safeHtml = (body && String(body).trim())
            ? String(body)
            : `<div style="font-family:Arial,sans-serif;line-height:1.5">
          <h3 style="margin:0 0 8px">${subject || 'Thông báo'}</h3>
          <div>Thông báo từ hệ thống.</div>
        </div>`;

        if (this.mockMode) {
            console.log('📨 [EmailService:MOCK]', { to, subject, channel, template: templateTag, body: safeHtml });
            return { ok: true, mock: true };
        }

        try {
            if (!this.transporter) this.initTransporter();
            await this.transporter.verify();

            const mailOptions = {
                from: process.env.MAIL_FROM || '"MyShop" <no-reply@myshop.vn>',
                to,
                subject,
                html: safeHtml,
                text: safeHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),

                envelope: {
                    from: process.env.MAIL_ENVELOPE_FROM || 'bounce@myshop.vn',
                    to,
                },
                headers: {
                    'X-App': 'MyShop',
                    'X-Channel': channel,
                    ...(templateTag ? { 'X-Template': templateTag } : {}),
                },
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log('[EmailService] Sent:', {
                messageId: result?.messageId,
                response: result?.response,
                accepted: result?.accepted,
                rejected: result?.rejected,
            });

            if (Array.isArray(result?.rejected) && result.rejected.length) {
                return { ok: false, error: 'Some recipients were rejected', result };
            }

            return { ok: true, result };
        } catch (err) {
            console.error('[EmailService] Send failed:', err?.message, err?.response || '', err?.responseCode || '');
            return { ok: false, error: err?.message, code: err?.responseCode, response: err?.response };
        }
    }
}

module.exports = new EmailService();
