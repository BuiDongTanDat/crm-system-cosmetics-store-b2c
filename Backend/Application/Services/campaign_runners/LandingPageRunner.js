// Application/Services/campaign_runners/LandingPageRunner.js
class LandingPageRunner {
  static async start(channelRow, campaign) {
    const landingUrl = channelRow.metrics_extra?.landing_url || channelRow.metrics_extra?.url || null;

    if (!landingUrl) {
      return {
        ok: false,
        code: 'MISSING_ASSET',
        message: 'Landing page channel thiếu landing_url (set metrics_extra.landing_url).',
      };
    }

    // TODO: tích hợp deploy/enable landing page nếu bạn có.
    console.log('[LandingPageRunner] Landing page ready:', {
      campaign_id: campaign.campaign_id,
      channel_id: channelRow.channel_id,
      landingUrl
    });

    return { ok: true, provider: 'landing_page', message: 'Landing page enabled', landingUrl };
  }
}

module.exports = LandingPageRunner;
