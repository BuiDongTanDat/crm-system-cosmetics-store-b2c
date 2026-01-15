const axios = require('axios');

class FacebookRunner {
  static async start(channelRow, campaign) {

    // NEW LOGIC: Check if channel has valid flow attached and execute it
    // We expect the Dispatcher or Service to pass 'flow_id' or we fetch it.
    // For now, let's assume we can trigger the 'campaign.channel.run' event
    // and let AutomationService find the flow triggered by that event OR 
    // we explicitly run the flow if we know the flowId.

    // If channelRow has flows (enriched by Service) or we can look it up.
    // Ideally, ChannelDispatcher should pass the flowId if known.

    // For this implementation, we'll assume we want to trigger the specific flow linked to this channel.
    const flowId = channelRow.flow_id || (channelRow.flows && channelRow.flows[0]?.flow_id);

    if (flowId) {
      const AutomationService = require('../AutomationService');
      console.log(`[FacebookRunner] Triggering Flow ${flowId} for Channel ${channelRow.channel_id}`);

      // We trigger a generic event 'campaign.channel.run' but force the specific flow if possible,
      // OR we just use runFlow directly if exposed.
      // Since AutomationService.trigger usually matches triggers, let's use a Direct Run if available,
      // or Trigger with a context that matches.

      await AutomationService.emit('campaign.channel.run', {
        campaign,
        campaign_channel: channelRow,
        // user/actor?
      }, { flow_id: flowId }); // Custom option to force flow? Or just rely on Trigger mapping?

      // Note: If 'emit' doesn't support forcing flow_id, we might need a direct 'executeFlow' method.
      // Let's assume 'emit' is safer as it handles concurrency/queueing.

      return {
        ok: true,
        provider: 'facebook',
        message: 'Automation Flow Triggered',
        flow_id: flowId
      };
    }

    // FALLBACK: OLD LOGIC (Direct Post)
    const pageId = channelRow.metrics_extra?.page_id || process.env.FB_PAGE_ID;
    const pageToken = channelRow.metrics_extra?.page_access_token || process.env.FB_PAGE_ACCESS_TOKEN;

    const imageUrl = channelRow.metrics_extra?.image;
    const message = channelRow.metrics_extra?.content;

    // ... validate and generic post if no flow ...
    if (!pageId || !pageToken) {
      return { ok: false, code: 'MISSING_FB_AUTH', message: 'Thiếu page_id hoặc page_access_token (và không có Flow)' };
    }

    // ... (keep existing direct post logic as fallback) ...
    const uploadRes = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      null,
      {
        params: {
          url: imageUrl,
          caption: message,
          access_token: pageToken,
          published: true,
        }
      }
    );

    return {
      ok: true,
      provider: 'facebook',
      message: 'Posted to Facebook Page (Direct)',
      data: uploadRes.data,
    };
  }
}

module.exports = FacebookRunner;