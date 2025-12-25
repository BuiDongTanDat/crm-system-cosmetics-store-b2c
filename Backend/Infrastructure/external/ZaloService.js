/**
 * ZaloService
 * - Gửi Zalo thật hoặc log mock tùy môi trường/biến cấu hình
 * - Có thể triển khai qua Zalo OA API hoặc ZNS tùy use-case
 *
 * ENV gợi ý:
 *   ZALO_MOCK=true|false
 *   ZALO_OA_ACCESS_TOKEN=...
 *   ZALO_OA_ID=...
 *   ZALO_API_BASE=https://openapi.zalo.me
 */

class ZaloService {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';

    // Ưu tiên ZALO_MOCK nếu set; nếu không, mặc định mock khi không phải production
    this.mockMode = (process.env.ZALO_MOCK ?? '').length
      ? process.env.ZALO_MOCK === 'true'
      : this.env !== 'production';

    this.send = this.send.bind(this);

    console.log('[ZaloService] env =', this.env, 'mockMode =', this.mockMode);
  }

  /**
   * Gửi Zalo
   * @param {Object} options
   * @param {string} options.to - người nhận (zalo user id / phone / oa_uid tùy bạn quy ước)
   * @param {string} options.message - nội dung tin nhắn
   * @param {string} [options.channel='zalo']
   * @param {Object} [options.template] - nếu dùng ZNS template
   * @param {Object} [options.meta] - data bổ sung
   */
  async send({ to, message, channel = 'zalo', template, meta }) {
    if (!to) throw new Error('ZaloService.send() missing `to`');

    if (this.mockMode) {
      console.log('📩 [ZaloService:MOCK]', {
        to,
        channel,
        template,
        message,
        meta,
      });
      return { ok: true, mock: true };
    }

    try {
      return await this.sendReal({ to, message, channel, template, meta });
    } catch (err) {
      console.error('[ZaloService] Send failed:', err?.message || err);
      return { ok: false, error: err?.message || String(err) };
    }
  }

  /**
   * Implement thật: OA API / ZNS API
   * Bạn thay phần này theo đúng endpoint & payload của bạn.
   */
  async sendReal({ to, message, template, meta }) {
    const token = process.env.ZALO_OA_ACCESS_TOKEN;
    const apiBase = process.env.ZALO_API_BASE || 'https://openapi.zalo.me';

    if (!token) {
      throw new Error('ZaloService not configured: missing ZALO_OA_ACCESS_TOKEN');
    }

    // Nếu bạn dùng Node >= 18, có fetch sẵn. Nếu không, dùng axios/node-fetch.
    // Ví dụ placeholder endpoint (bạn thay bằng endpoint đúng bạn đang dùng):
    const url = `${apiBase}/v3.0/oa/message/cs`; // placeholder

    const payload = {
      recipient: { user_id: to },
      message: { text: message },
      // template/meta nếu dùng ZNS hoặc message kiểu khác
      ...(template ? { template } : {}),
      ...(meta ? { meta } : {}),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.message || data?.error || `HTTP ${res.status}`;
      return { ok: false, error: errMsg, status: res.status, data };
    }

    return { ok: true, data };
  }
}

module.exports = new ZaloService();
