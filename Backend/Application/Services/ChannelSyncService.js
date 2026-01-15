const axios = require('axios');
const CampaignChannelRepo = require('../../Infrastructure/Repositories/CampaignChannelRepository');
const { google } = require('googleapis');

class ChannelSyncService {
    async syncChannel(channelId) {
        const channel = await CampaignChannelRepo.findById(channelId);
        if (!channel) throw new Error('Channel not found');

        const provider = channel.channel; // 'facebook_post' or 'banner' (or 'email')

        if (provider === 'facebook_post' || provider === 'facebook') {
            return this.syncFacebook(channel);
        }

        if (provider === 'banner') {
            return this.syncBanner(channel);
        }

        return { ok: true, message: 'No sync logic for this provider' };
    }

    async syncFacebook(channel) {
        const extra = channel.metrics_extra || {};
        const postIds = Array.isArray(extra.fb_post_ids) ? extra.fb_post_ids : [];

        if (!postIds.length) {
            return { ok: true, message: 'No FB posts to sync' };
        }

        const pageToken = channel.settings?.page_access_token || process.env.FB_PAGE_ACCESS_TOKEN;
        if (!pageToken) return { ok: false, message: 'Missing FB Page Access Token' };

        let totalImpressions = 0;
        let totalClicks = 0;
        let totalLikes = 0;

        for (const postId of postIds) {
            try {
                // Fetch Insights
                // Metrics: post_impressions, post_clicks, post_reactions_like_total
                const url = `https://graph.facebook.com/v19.0/${postId}/insights?metric=post_impressions,post_clicks,post_reactions_like_total&access_token=${pageToken}`;
                const res = await axios.get(url);
                const data = res.data?.data || [];

                data.forEach(item => {
                    const val = item.values?.[0]?.value || 0;
                    if (item.name === 'post_impressions') totalImpressions += val;
                    if (item.name === 'post_clicks') totalClicks += val;
                    if (item.name === 'post_reactions_like_total') totalLikes += val;
                });
            } catch (e) {
                console.warn(`[ChannelSync] FB Post ${postId} fetch failed:`, e.message);
            }
        }

        // Update DB
        // Note: This replaces existing stats. If we want cumulative, logic differs.
        // Here we assume "sync" means "refresh to current total".
        await CampaignChannelRepo.updateById(channel.channel_id, {
            impressions: totalImpressions,
            clicks: totalClicks,
            // For conversions, maybe map Likes? Or keep conversions separate (web events)
            metrics_extra: { ...extra, likes: totalLikes }
        });

        return {
            ok: true,
            stats: { impressions: totalImpressions, clicks: totalClicks, likes: totalLikes }
        };
    }

    async syncBanner(channel) {
        const extra = channel.metrics_extra || {};
        const sheetId = extra.spreadsheet_id;

        if (!sheetId) return { ok: true, message: 'No Spreadsheet ID for Banner' };

        // Google Sheets Sync
        // Auth: Requires Service Account or OAuth env vars
        // Simplified for MVP: verify if we have credentials
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return { ok: false, message: 'Missing Google Auth Env' };
        }

        try {
            const jwtClient = new google.auth.JWT(
                process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                null,
                process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                ['https://www.googleapis.com/auth/spreadsheets.readonly']
            );
            await jwtClient.authorize();

            const sheets = google.sheets({ version: 'v4', auth: jwtClient });

            // Get Row Count (approximate conversions)
            // Assuming Form responses start from Row 2
            const res = await sheets.spreadsheets.get({
                spreadsheetId: sheetId,
                includeGridData: false
            });

            const sheet = res.data.sheets?.[0]; // First sheet usually
            const gridProps = sheet?.properties?.gridProperties;

            // Better: Get data range
            const rangeRes = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'A:A' // Count column A
            });

            const rows = rangeRes.data.values || [];
            const responsesCount = Math.max(0, rows.length - 1); // Exclude header

            await CampaignChannelRepo.updateById(channel.channel_id, {
                conversions: responsesCount
            });

            return { ok: true, stats: { conversions: responsesCount } };

        } catch (e) {
            console.error('[ChannelSync] Google Sheet Sync failed:', e);
            return { ok: false, error: e.message };
        }
    }
}

module.exports = new ChannelSyncService();
