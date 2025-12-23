const axios = require('axios');

class FacebookRunner {
  static async start(channelRow, campaign) {
    const pageId = channelRow.metrics_extra?.page_id || process.env.FB_PAGE_ID;
    const pageToken = channelRow.metrics_extra?.page_access_token || process.env.FB_PAGE_ACCESS_TOKEN;

    const imageUrl = channelRow.metrics_extra?.image;
    const message = channelRow.metrics_extra?.content;

    if (!pageId || !pageToken) {
      return { ok: false, code: 'MISSING_FB_AUTH', message: 'Thiếu page_id hoặc page_access_token' };
    }
    if (!imageUrl || !message) {
      return { ok: false, code: 'MISSING_ASSET', message: 'Thiếu image hoặc content' };
    }

    // 1) Upload photo (by URL)
    const uploadRes = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      null,
      {
        params: {
          url: imageUrl,
          caption: message,
          access_token: pageToken,
          published: true, // đăng luôn
        }
      }
    );

    return {
      ok: true,
      provider: 'facebook',
      message: 'Posted to Facebook Page',
      data: uploadRes.data, // contains id / post_id depending on API response
    };
  }
}

module.exports = FacebookRunner;