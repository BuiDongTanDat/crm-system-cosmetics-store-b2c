const FacebookRunner = require('./FacebookRunner');
const BannerRunner = require('./BannerRunner');
const LandingPageRunner = require('./LandingPageRunner');
const EmailRunner = require('./EmailRunner');
const ZaloRunner = require('./ZaloRunner'); // 👈 thêm

const runners = {
  facebook: FacebookRunner,
  banner: BannerRunner,
  landing_page: LandingPageRunner,
  email: EmailRunner,
  zalo: ZaloRunner, // 👈 thêm
};

class ChannelDispatcher {
  static async start(channelRow, campaign, ctx = {}) {
    const key = String(channelRow.channel || '').toLowerCase();
    const runner = runners[key];
    if (!runner) {
      return {
        ok: false,
        code: 'CHANNEL_NOT_SUPPORTED',
        message: `Channel "${channelRow.channel}" chưa được hỗ trợ.`,
      };
    }
    return runner.start(channelRow, campaign, ctx);
  }
}

module.exports = ChannelDispatcher;
