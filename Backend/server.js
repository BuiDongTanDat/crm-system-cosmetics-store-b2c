/* eslint-disable no-console */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { startCronManager } = require('./Infrastructure/scheduler/cronManager');
const authRoutes = require('./API/routes/authRoutes');
const flowRoutes = require('./API/routes/AutomationRoutes');
const LeadRoutes = require('./API/routes/LeadRoutes');
const AiRoutes = require('./API/routes/aiRoutes');
const userRoutes = require('./API/routes/userRoutes');
const roleRoutes = require('./API/routes/roleRoutes');
const categoryRoutes = require('./API/routes/categoryRoutes');
const productRoutes = require('./API/routes/productRoutes');
const DataManager = require('./Infrastructure/database/postgres');
const CampaignRoute = require('./API/routes/CampaignRoutes')
const OrderRoutes = require('./API/routes/OrderRoutes');
const automationCatalogRoutes = require('./API/routes/automationCatalogRoutes');
const paymentRoutes = require('./API/routes/paymentRoutes');
// const OrderDetailRoutes = require('./API/routes/OrderDetailRoutes');
const CustomerRoutes = require('./API/routes/CustomerRoutes');
const StreamingRoutes = require('./API/routes/streamingRoutes');
const YoutubeRoutes = require('./API/routes/youtubeRoutes');

// Middlewares
const AutomationService = require('./Application/Services/AutomationService');
const automationCronJobRoutes = require('./API/routes/automationCronJobRoutes');
const protectedRoute = require('./API/Middleware/authMiddleware');

// cron utils & domain events
require('./Domain/Events/LeadEvents');
require('./Domain/Events/OrderEvents');
require('./Domain/Events/EngagementEvents');

const TriggerRegistry = require('./Domain/valueObjects/TriggerRegistry');
const RabbitConsumer = require('./Infrastructure/Bus/RabbitMQConsumer');
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   Middlewares
/* =========================
   Routes
========================= */
app.use('/v1/track', require('./API/routes/track'));
app.use('/cron', automationCronJobRoutes);
app.use('/auth', authRoutes);
/* đăng ký middleware bảo vệ các route phía dưới
   Lưu ý là nếu route nào nằm dưới protected route thì khi call api cần truyền access token trong header
   Để tránh bất tiện trong lúc debug nên tạm comment lại */

// YouTube OAuth routes (không cần bảo vệ)
app.use('/youtube', YoutubeRoutes); // Sau khi implement xong, thì path khi callback sẽ là /youtube/callback đúng với url mình khai báo trên Google Console nhen
app.use('/stream', StreamingRoutes);

// Vì cần api checkout public nên router này để ở ngoài
//Các route private sẽ được xử lý bên trong OrderRoute luôn
app.use('/orders', OrderRoutes);


app.use(protectedRoute); // Áp dụng middleware bảo vệ từ đây trở xuống

app.use('/users', userRoutes);
app.use('/automation', flowRoutes);
app.use('/leads', LeadRoutes);
app.use('/Ai', AiRoutes);
app.use('/roles', roleRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/orders', OrderRoutes);
app.use('/automation-event', automationCatalogRoutes);
// app.use('/order_details', OrderDetailRoutes); // không cần route riêng cho order details
app.use('/customers', CustomerRoutes);
app.use('/campaign', CampaignRoute)
app.use('/payment', paymentRoutes);


// Diagnostics
app.get('/triggers', (_req, res) => res.json(TriggerRegistry.getAll()));
app.get('/', (_req, res) => res.send('CRM API is running successfully!'));
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
app.get('/readyz', (_req, res) => res.status(200).json({ ready: true }));

// Manual run automation now: POST /automation/run-now?dryRun=true
app.post('/automation/run-now', async (req, res, next) => {
  try {
    const dryRun = (req.query.dryRun || process.env.AUTOMATION_DRYRUN) === 'true';
    const limitPerFlow = Number(process.env.AUTOMATION_LIMIT || 5000);
    const out = await AutomationService.runDailyAutomation({ dryRun, limitPerFlow });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

// Error handler (cuối chuỗi middleware)
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) res.status(500).json({ error: err.message || 'Internal Server Error' });
});

/* =========================
   Bootstrap
========================= */
const PORT = Number(process.env.PORT || 5000);
let server = null;
let automationInterval = null;

async function startRabbitWithRetry(retries = 12, delayMs = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[BOOT] Starting RabbitMQ consumer (attempt ${i}/${retries})...`);
      // Nếu RabbitConsumer.start() không return Promise, vẫn gọi được
      const maybePromise = RabbitConsumer.start();
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
      console.log('[BOOT] RabbitMQ consumer started.');
      return;
    } catch (e) {
      console.error(`[BOOT] RabbitMQ connect failed (${i}/${retries}):`, e.code || e.message);
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function startAutomationIfEnabled() {
  const mode = (process.env.AUTOMATION_MODE || 'cron').toLowerCase(); // cron | off

  if (mode === 'off') {
    console.log('[BOOT] Automation disabled (AUTOMATION_MODE=off).');
    return;
  }

  if (mode === 'cron') {
    console.log('[BOOT] Automation mode=cron: cron.daily enabled.');
    return;
  }

  console.warn(`[BOOT] Unknown AUTOMATION_MODE=${mode}. Use 'cron' | 'off'.`);
}

async function main() {
  try {
    // 1) DB connect & sync
    await DataManager.connectAndSync({ alter: true });
    console.log('[BOOT] Database connected & synced.');
    startCronManager({ reloadSeconds: 20 });
    console.log('[BOOT] CronManager started (DB-driven).');
    // 2) Rabbit consumer with retry (đảm bảo rabbit sẵn sàng)
    await startRabbitWithRetry();
    // 3) Start automation scheduler (tick/cron)
    await startAutomationIfEnabled();
    // 4) Start HTTP server (single listen)
    server = app.listen(PORT, () => {
      console.log('------------------------------------------');
      console.log(`Server is running on: http://localhost:${PORT}`);
      console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Automation mode: ${process.env.AUTOMATION_MODE || 'tick'}`);
      console.log('------------------------------------------');
    });

  } catch (err) {
    console.error('[BOOT] Failed to start application:', err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  try {
    console.log(`\n[SHUTDOWN] Received ${signal}. Closing resources...`);

    if (automationInterval) {
      clearInterval(automationInterval);
      automationInterval = null;
    }

    if (server) {
      await new Promise(resolve => server.close(resolve));
      console.log('[SHUTDOWN] HTTP server closed.');
    }

    if (RabbitConsumer.stop) {
      try {
        await RabbitConsumer.stop();
        console.log('[SHUTDOWN] Rabbit consumer stopped.');
      } catch (e) {
        console.error('[SHUTDOWN] Rabbit consumer stop error:', e);
      }
    }

    if (DataManager.close) {
      try {
        await DataManager.close();
        console.log('[SHUTDOWN] Database connection closed.');
      } catch (e) {
        console.error('[SHUTDOWN] Database close error:', e);
      }
    }
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main();
