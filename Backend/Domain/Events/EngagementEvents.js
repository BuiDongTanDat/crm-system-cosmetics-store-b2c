const TriggerRegistry = require('../valueObjects/TriggerRegistry');

TriggerRegistry.register('engagement.link_clicked', { domain: 'Engagement', description: 'Click link' });
TriggerRegistry.register('engagement.email_opened', { domain: 'Engagement', description: 'Mở email' });
TriggerRegistry.register('engagement.video_played', { domain: 'Engagement', description: 'Xem video' });

module.exports = {
    LINK_CLICKED: 'engagement.link_clicked',
    EMAIL_OPENED: 'engagement.email_opened',
    VIDEO_PLAYED: 'engagement.video_played'
};
