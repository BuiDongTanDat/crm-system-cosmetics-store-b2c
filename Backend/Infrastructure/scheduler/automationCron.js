// backend/src/Infrastructure/scheduler/automationCron.js
const cron = require('node-cron');
const automationService = require('../../Application/Services/AutomationService');

// chạy mỗi ngày lúc 00:00
cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running daily automation flow...');
    await automationService.runDailyAutomation();
});

module.exports = cron;
