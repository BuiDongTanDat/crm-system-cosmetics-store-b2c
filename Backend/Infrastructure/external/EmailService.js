/**
 * EmailService
 * - Gửi email thật hoặc log mock tùy theo môi trường/biến cấu hình
 * - Dễ mở rộng sang SendGrid/Mailgun/AWS SES
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.env = process.env.NODE_ENV || 'development';
        // Ưu tiên MAIL_MOCK nếu set; nếu không, mặc định mock khi không phải production
        this.mockMode = (process.env.MAIL_MOCK ?? '').length
            ? process.env.MAIL_MOCK === 'true'
            : this.env !== 'production';

        this.transporter = null;

        // Nếu đang chạy thật, khởi tạo transporter ngay; nếu lỗi thiếu config sẽ throw tại đây
        if (!this.mockMode) {
            this.initTransporter();
        }

        // phòng khi bạn gọi bằng cách destructure method
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

        // secure: nếu không chỉ định, tự suy dựa vào port
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
            logger: true,   // log SMTP
            debug: true,    // log chi tiết
            tls: { ciphers: 'TLSv1.2' },
        });
    }

    /**
     * Gửi email
     * @param {Object} options
     * @param {string} options.to - người nhận
     * @param {string} options.subject - tiêu đề
     * @param {string} options.body - nội dung HTML hoặc text
     * @param {string} [options.channel='email']
     * @param {Object} [options.template]
     */
    async send({ to, subject, body, channel = 'email', template }) {
        if (!to) throw new Error('EmailService.send() missing `to`');

        if (this.mockMode) {
            console.log('📨 [EmailService:MOCK]', {
                to,
                subject,
                channel,
                template,
                body,
            });
            return { ok: true, mock: true };
        }

        try {
            // Lazy-init nếu vì lý do nào đó chưa có transporter
            if (!this.transporter) this.initTransporter();

            // Verify cấu hình SMTP trước khi gửi
            await this.transporter.verify();

            const mailOptions = {
                from: process.env.MAIL_FROM || '"MyShop" <no-reply@myshop.vn>',
                to,
                subject,
                html: body || '',
                text: body?.replace(/<[^>]+>/g, '') || '',

                // giúp DMARC/SPF: Return-Path sẽ dùng envelope.from
                envelope: {
                    from: process.env.MAIL_ENVELOPE_FROM || 'bounce@myshop.vn',
                    to,
                },
                headers: {
                    'X-App': 'MyShop',
                    'X-Channel': channel,
                    ...(template ? { 'X-Template': String(template) } : {}),
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
