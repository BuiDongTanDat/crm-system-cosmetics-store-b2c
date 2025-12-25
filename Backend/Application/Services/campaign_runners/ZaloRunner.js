const zaloSvc = require('../../../Infrastructure/external/ZaloService'); // chỉnh path

class ZaloRunner {
  static async start(channelRow, campaign) {
    const message =
      channelRow.metrics_extra?.message ||
      channelRow.metrics_extra?.body || // cho “tương tự email”
      campaign.description ||
      `Hello from campaign: ${campaign.name}`;

    const toUsers = channelRow.metrics_extra?.to_users || []; // ['uid1','uid2']

    if (Array.isArray(toUsers) && toUsers.length > 0) {
      for (const to of toUsers) {
        await zaloSvc.send({ to, message, channel: 'zalo' });
      }
      return { ok: true, provider: 'zalo', message: `Sent ${toUsers.length} Zalo messages` };
    }

    return { ok: true, provider: 'zalo', message: 'Zalo channel activated (no direct recipients provided)' };
  }
}

module.exports = ZaloRunner;
