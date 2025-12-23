// Application/Services/campaign_runners/EmailRunner.js
const emailSvc = require('../../../Infrastructure/external/EmailService'); // chỉnh path

class EmailRunner {
  static async start(channelRow, campaign) {
    const subject = channelRow.metrics_extra?.subject || campaign.name;
    const body = channelRow.metrics_extra?.body || campaign.description || 'Hello from campaign';

    const toEmails = channelRow.metrics_extra?.to_emails || []; // ['a@b.com','c@d.com']

    if (Array.isArray(toEmails) && toEmails.length > 0) {
      // gửi trực tiếp
      for (const to of toEmails) {
        await emailSvc.send({ to, subject, body, channel: 'email' });
      }
      return { ok: true, provider: 'email', message: `Sent ${toEmails.length} emails` };
    }

    // nếu không có danh sách, coi như đã “activate” email channel
    return { ok: true, provider: 'email', message: 'Email channel activated (no direct recipients provided)' };
  }
}

module.exports = EmailRunner;
