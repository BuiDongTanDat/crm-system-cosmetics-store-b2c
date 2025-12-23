// Application/Services/campaign_runners/BannerRunner.js
class BannerRunner {
  static async start(channelRow, campaign) {
    const bannerImage = channelRow.metrics_extra?.image || null;
    const qr = channelRow.metrics_extra?.qr || channelRow.metrics_extra?.qr_url || null;

    if (!bannerImage || !qr) {
      return {
        ok: false,
        code: 'MISSING_ASSET',
        message: 'Banner channel thiếu image hoặc QR (set metrics_extra.image + metrics_extra.qr).',
      };
    }

    // TODO: nếu bạn có hệ thống publish banner: CMS, POS screen, website header...
    console.log('[BannerRunner] Start Banner campaign:', {
      campaign_id: campaign.campaign_id,
      channel_id: channelRow.channel_id,
      bannerImage, qr
    });

    return { ok: true, provider: 'banner', message: 'Banner activated', assets: { bannerImage, qr } };
  }
}

module.exports = BannerRunner;
