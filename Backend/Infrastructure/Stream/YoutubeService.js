/*
YOUTUBE SERVICE
    Sẽ đảm nhiệm các nhiệm vụ xác thực với google
    Quản lý và lấy tin nhắn từ youtube live chat
    Gửi tin nhắn vào youtube live chat
*/

const dotenv = require('dotenv');
dotenv.config();
const path = require('path');

const fs = require('fs').promises;
const { google } = require('googleapis');

class YouTubeService {
    constructor() {
        this.clientId = process.env.CLIENT_ID;
        this.clientSecret = process.env.CLIENT_SECRET;
        this.redirectURI = process.env.CALLBACK_URL;

        this.scope = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.force-ssl'
        ];

        this.auth = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            this.redirectURI
        );

        this.youtube = google.youtube('v3');

        this.liveChatId = null;
        this.nextPage = null;
        this.chatMessages = [];
        this.interval = null;
        this.intervalTime = 5000; // Cứ sau 5 giây cập nhật lại chat

        this.tokenFile = './tokens.json';

        // auto load saved token
        this.init();

        // auto update token
        this.auth.on('tokens', (tokens) => {
            if (tokens.refresh_token) this.saveTokens(this.auth.credentials);
        });
    }

    async init() {
        try {
            const data = await fs.readFile(this.tokenFile, 'utf8');
            const tokens = JSON.parse(data);
            this.auth.setCredentials(tokens);
            console.log('Loaded tokens from file');
        } catch {
            console.log('No saved tokens yet, login required.');
        }
    }

    async saveTokens(tokens) {
        await fs.writeFile(this.tokenFile, JSON.stringify(tokens, null, 2));
        console.log('Tokens saved');
    }

    // Lấy URL để redirect user đến trang Google login
    getLoginUrl(returnTo) {
        return this.auth.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: this.scope,
            state: returnTo || undefined
        });
    }

    // Reirect user đến trang Google login (accept optional returnTo)
    redirectToLogin(res, returnTo) {
        const url = this.getLoginUrl(returnTo);
        res.redirect(url);
    }

    // Lấy tokens từ code trả về sau khi user login
    async getTokensWithCode(code) {
        const { tokens } = await this.auth.getToken(code);
        this.auth.setCredentials(tokens);
        await this.saveTokens(tokens);
        console.log('Google OAuth success');
    }

    // Đảm bảo đã xác thực
    async ensureAuth() {
        if (!this.auth.credentials.access_token) {
            await this.init();
        }

        // Kiểm tra nếu không có credentials sau khi init
        if (!this.auth.credentials.access_token) {
            const loginUrl = this.getLoginUrl();
            const error = new Error('Not authenticated. Please login first.');
            error.code = 'AUTH_REQUIRED';
            error.loginUrl = loginUrl;
            throw error;
        }

        // Refresh if token expired
        if (this.auth.credentials.expiry_date < Date.now()) {
            try {
                console.log('Token expired, attempting to refresh...');
                const newTokens = await this.auth.refreshAccessToken();
                this.auth.setCredentials(newTokens.credentials);
                await this.saveTokens(this.auth.credentials);
                console.log('Token refreshed successfully');
            } catch (error) {
                console.log('Token refresh failed:', error.message);

                // Xóa token cũ
                try {
                    await fs.unlink(this.tokenFile);
                    console.log('Deleted expired tokens file');
                } catch (unlinkErr) {
                    // Không quan trọng nếu file không tồn tại
                }

                // Reset credentials
                this.auth.setCredentials({});

                // Tạo URL đăng nhập mới
                const loginUrl = this.getLoginUrl();
                const authError = new Error('Refresh token expired or revoked. Please re-authenticate.');
                authError.code = 'AUTH_EXPIRED';
                authError.loginUrl = loginUrl;
                throw authError;
            }
        }
    }
    
    // Tìm live chat ID từ broadcast đang active
    async findActiveChat() {
        const res = await this.youtube.liveBroadcasts.list({
            auth: this.auth,
            part: 'snippet,status',
            broadcastStatus: 'active',
            mine: true
        });

        const live = res.data.items?.[0];
        if (live?.snippet?.liveChatId) {
            this.liveChatId = live.snippet.liveChatId;
            return this.liveChatId;
        }
    }

    // Hàm lấy tin nhắn từ live chat
    async pullChat() {
        if (!this.liveChatId) await this.findActiveChat();
        if (!this.liveChatId) return;

        const res = await this.youtube.liveChatMessages.list({
            auth: this.auth,
            part: 'snippet,authorDetails',
            liveChatId: this.liveChatId,
            pageToken: this.nextPage
        });

        const items = res.data.items || [];
        this.chatMessages.push(...items);
        this.nextPage = res.data.nextPageToken;

        console.log(` Total messages: ${this.chatMessages.length}`);

        // Optional auto reply logic
        // for (const msg of items) {
        //   if (msg.snippet.displayMessage.toLowerCase().includes('thank')) {
        //     await this.sendMessage(`You're welcome ${msg.authorDetails.displayName}!`);
        //   }
        // }
    }
    // Bắt đầu / dừng polling chat
    async startChatPolling() {
        this.isPolling = true;
        while (this.isPolling) {
            await this.pullChat().catch(console.error);
            await new Promise(r => setTimeout(r, this.intervalTime));
        }
    }

    stopChatPolling() {
        this.isPolling = false;
    }


    // Gửi tin nhắn vào live chat
    async sendMessage(text) {
        if (!this.liveChatId) await this.findActiveChat();
        if (!this.liveChatId) return;

        const res = await this.youtube.liveChatMessages.insert({
            auth: this.auth,
            part: 'snippet',
            requestBody: {
                snippet: {
                    liveChatId: this.liveChatId,
                    type: 'textMessageEvent',
                    textMessageDetails: { messageText: text }
                }
            }
        });

        return res.data?.id; // return messageId
    }

    //Gửi text sau đó pin, vì api ko cho phép pin trực tiếp
    async pinMessage(messageId) {
        return this.youtube.liveChatMessages.insert({
            auth: this.auth,
            part: 'snippet',
            requestBody: {
                snippet: {
                    liveChatId: this.liveChatId,
                    type: 'pinnedMessage',
                    pinnedMessageId: messageId
                }
            }
        });
    }

    //Set thumnail cho broadcast
    async setThumbnail(broadcastId, thumbnailPath = null) {
        await this.ensureAuth();
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        thumbnailPath = path.join(process.cwd(), "public", "product_temp_small.png");
        // Step 1 — chờ broadcast vào state "ready"
        const waitForReady = async () => {
            for (let i = 0; i < 6; i++) {
                const res = await this.youtube.liveBroadcasts.list({
                    auth: this.auth,
                    part: "status",
                    id: broadcastId
                });

                const state = res.data.items?.[0]?.status?.lifeCycleStatus;
                console.log(`[YouTube] broadcast state = ${state}`);

                if (state === "ready") return true;
                await sleep(1000);
            }
            return false;
        };

        const isReady = await waitForReady();
        if (!isReady) {
            console.log("[YouTube] Thumbnail skipped — broadcast never reached READY");
            return false;
        }

        // Step 2 — delay trước attempt đầu tiên (YouTube cần ~2-3s để tạo file video)
        await sleep(3000);

        // Step 3 — Retry upload thumbnail
        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                const res = await this.youtube.thumbnails.set({
                    auth: this.auth,
                    videoId: broadcastId,
                    media: {
                        mimeType: "image/jpeg",
                        body: fs.createReadStream(thumbnailPath),
                    }
                });

                console.log(`[YouTube] Thumbnail updated successfully`);
                return true;

            } catch (err) {
                const code = err?.errors?.[0]?.reason || err?.code;
                console.log(`[YouTube] setThumbnail attempt ${attempt} failed:`, code);

                if (attempt === 5) {
                    console.log("[YouTube] give up setting thumbnail.");
                    return false;
                }

                // exponential backoff
                await sleep(1500 * attempt);
            }
        }
    }

    // Hàm tạo live stream mới và lấy thông tin RTMP (Stream Key, Ingest URL)
    async createLive({
        title = "Live stream",
        description = "",
        privacy = "public",
        resolution = "720p",
        frameRate = "30fps"
    } = {}) {
        this.ensureAuth();
        console.log('[YouTube] Creating live stream...');
        const stream = await this.youtube.liveStreams.insert({
            auth: this.auth,
            part: "snippet,cdn",
            requestBody: {
                snippet: { title: `${title} - Stream` },
                cdn: {
                    resolution,       // "720p" hoặc "1080p"
                    frameRate,        // "30fps" hoặc "60fps"
                    ingestionType: "rtmp"
                }
            }
        });

        const streamKey = stream.data.cdn.ingestionInfo.streamName;
        const ingestAddr = stream.data.cdn.ingestionInfo.ingestionAddress;
        const fullRtmp = `${ingestAddr}/${streamKey}`;

        //Delay
        await new Promise(r => setTimeout(r, 2000));

        console.log('[YouTube] Creating live broadcast...');
        const broadcast = await this.youtube.liveBroadcasts.insert({
            auth: this.auth,
            part: "snippet,status,contentDetails",
            requestBody: {
                snippet: {
                    title,
                    description,
                    scheduledStartTime: new Date(Date.now() + 5000).toISOString()
                },
                status: {
                    privacyStatus: "public", // "public", "unlisted", "private"
                    selfDeclaredMadeForKids: false
                },
                contentDetails: {
                    latencyPreference: "low",
                    enableAutoStart: false, // Tắt tự động bắt đầu
                    enableAutoStop: true,
                    enableDvr: true,
                    enableEmbed: true,
                    recordFromStart: true,
                    monitorStream: {
                        enableMonitorStream: true  // Live chat 
                    }
                }
            }

        });

        //Delay
        await new Promise(r => setTimeout(r, 2000));

        console.log('[YouTube] Binding broadcast to stream...');
        await this.youtube.liveBroadcasts.bind({
            auth: this.auth,
            id: broadcast.data.id,
            part: "id,contentDetails",
            streamId: stream.data.id
        });


        return {
            streamKey,
            fullRtmp,
            streamId: stream.data.id,
            broadcastId: broadcast.data.id,
            watchUrl: `https://www.youtube.com/live/${broadcast.data.id}`
        };
    }


    async waitForIngest(streamId) {
        for (let i = 0; i < 7; i++) { // 20 → 7
            const res = await this.youtube.liveStreams.list({ auth: this.auth, part: 'status', id: streamId });
            const st = res.data.items?.[0]?.status?.streamStatus;
            console.log('[YouTube] Stream status:', st);
            if (st === 'active') return true;
            await new Promise(r => setTimeout(r, 2000));
        }
        throw new Error('Stream never became active');
    }


    // helper: get current broadcast status (tries several fields for robustness)
    async getBroadcastStatus(broadcastId) {
        const res = await this.youtube.liveBroadcasts.list({
            auth: this.auth,
            part: 'status',
            id: broadcastId
        });
        const item = res.data.items?.[0];
        const statusObj = item?.status || {};
        // try common fields returned by API
        return statusObj.lifeCycleStatus || statusObj.broadcastStatus || statusObj.phase || null;
    }

    // Chuyển trạng thái broadcast sang "live"
    async goLive(broadcastId) {
        await this.ensureAuth();

        const getState = async () => {
            const res = await this.youtube.liveBroadcasts.list({
                auth: this.auth,
                part: "status",
                id: broadcastId
            });
            const st = res.data.items?.[0]?.status?.lifeCycleStatus;
            return st || null;
        };

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        for (let attempt = 1; attempt <= 5; attempt++) {

            const state = await getState();
            console.log(`[YouTube] Broadcast ${broadcastId} state = ${state} (attempt ${attempt})`);

            if (state === "live") {
                console.log("[YouTube] Already LIVE — nothing to do");
                return true;
            }

            if (state === "ready") {
                console.log("[YouTube] Transition ready → testing");
                await this.youtube.liveBroadcasts.transition({
                    auth: this.auth,
                    id: broadcastId,
                    part: "status",
                    broadcastStatus: "testing"
                });

                await sleep(1500); // đợi propagate state
                continue;
            }

            if (state === "testing") {
                console.log("[YouTube] Transition testing → live");
                await this.youtube.liveBroadcasts.transition({
                    auth: this.auth,
                    id: broadcastId,
                    part: "status",
                    broadcastStatus: "live"
                });

                return true; // done
            }

            console.log(`[YouTube] Unknown state "${state}", retrying...`);
            await sleep(1500);
        }

        throw new Error("Failed to transition broadcast to LIVE after multiple attempts.");
    }


    // Kết thúc broadcast
    async completeLive(broadcastId) {
        return this.youtube.liveBroadcasts.transition({
            auth: this.auth,
            id: broadcastId,
            part: 'status',
            broadcastStatus: 'complete'
        });
    }

}

module.exports = new YouTubeService();
