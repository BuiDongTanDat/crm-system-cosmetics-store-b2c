// Application/Services/campaign_runners/EmailRunner.js
const emailSvc = require('../../../Infrastructure/external/EmailService'); // chỉnh path

class EmailRunner {
  static async start(channelRow, campaign) {
    const subject = channelRow.metrics_extra?.subject || campaign.name || 'No Subject';
    let body = channelRow.metrics_extra?.body || campaign.description || 'Hello from campaign';

    const toEmails = channelRow.metrics_extra?.to_emails || [];
    const channelId = channelRow.channel_id;
    const campaignId = campaign.campaign_id;
    const baseUrl = process.env.API_URL || 'http://localhost:5000'; // Fallback logic

    if (Array.isArray(toEmails) && toEmails.length > 0) {
      for (const to of toEmails) {
        // Generate Tracking Links
        const mid = `${channelId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const trackOpenUrl = `${baseUrl}/v1/track/open?channel_id=${channelId}&campaign_id=${campaignId}&to=${to}&mid=${mid}`;
        // Default redirect to home if no specific URL
        const targetUrl = encodeURIComponent(process.env.FRONTEND_URL || 'http://localhost:5173');
        const trackClickUrl = `${baseUrl}/v1/track/click?channel_id=${channelId}&campaign_id=${campaignId}&to=${to}&mid=${mid}&url=${targetUrl}`;

        // Inject Tracking Elements
        const trackingPixel = `<img src="${trackOpenUrl}" width="1" height="1" alt="" style="display:none;" />`;
        const actionButton = `
          <div style="margin-top: 20px; text-align: center;">
            <a href="${trackClickUrl}" 
               style="background-color: #2563EB; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
               Ghé thăm Website
            </a>
          </div>
        `;

        const injectionContent = `${actionButton}${trackingPixel}`;
        let finalBody = body;
        if (body.includes('</body>')) {
          finalBody = body.replace('</body>', `${injectionContent}</body>`);
        } else if (body.includes('</html>')) {
          finalBody = body.replace('</html>', `${injectionContent}</html>`);
        } else {
          finalBody = `${body}<br/>${injectionContent}`;
        }

        await emailSvc.send({ to, subject, body: finalBody, channel: 'email' });
      }
      return { ok: true, provider: 'email', message: `Sent ${toEmails.length} emails` };
    }

    // nếu không có danh sách, coi như đã “activate” email channel
    return { ok: true, provider: 'email', message: 'Email channel activated (no direct recipients provided)' };
  }
}

module.exports = EmailRunner;
