// backend/src/Infrastructure/database/seed.js
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const UserService = require('../../Application/Services/UserService');
const ProductService = require('../../Application/Services/ProductService');
const CategoryService = require('../../Application/Services/CategoryService');
const CampaignService = require('../../Application/Services/CampaignService');
const LeadService = require('../../Application/Services/LeadService');
const AutomationFlowService = require('../../Application/Services/AutomationFlowService');

const flowsRepo = require('../../Infrastructure/Repositories/AutomationFlowRepository');
const { seedAutomationCatalog } = require('./seed_automation_catalog');
const {seedRole} = require('./seedRole');
const {seedUser} = require('./seedUser');
const Category = require('../../Domain/Entities/Category');
const Campaign = require('../../Domain/Entities/Campaign');
const Lead = require('../../Domain/Entities/Lead');
const Product = require('../../Domain/Entities/Product'); // nếu không có model này thì bỏ phần load products

const AutomationCronJobRepository = require('../../Infrastructure/Repositories/AutomationCronJobRepository');

const csvFilePath = path.join(__dirname, 'product_e.csv');

const userService = new UserService();
const productService = ProductService;

// =========================
// USERS / ROLES
// Dùng 2 file riêng lẻ nằm cùng thư mục
// =========================
async function seedRolesAndUsers() {
  console.log('Seeding admin user qua service...');
  try {
    await userService.createUser({
      full_name: 'Admin User',
      email: 'admin@example.com',
      phone: '0901234567',
      password: '123456',
      role_name: 'Admin',
      status: 'active',
    });
    console.log('Admin user created');
  } catch (err) {
    console.warn('Skip admin seed:', err.message);
  }
}

// =========================
// CRON JOBS
// =========================
async function seedCronJobs() {
  await AutomationCronJobRepository.upsertByJobKey({
    job_key: 'daily',
    name: 'Daily Cron',
    description: 'Bắn event cron.daily mỗi ngày',
    event_type: 'cron.daily',
    cron_expr: '48 13 * * *', // 13:48 mỗi ngày (Asia/Ho_Chi_Minh)
    timezone: 'Asia/Ho_Chi_Minh',
    enabled: true,
    meta: {},
  });

  console.log('[Seed] Cron job "daily" upserted');
}

// =========================
// CATEGORIES
// =========================
async function seedCategories() {
  const existing = await Category.count();
  if (existing > 0) {
    console.log('Categories already exist, skip seeding.');
    return;
  }

  const categories = [
    { name: 'Trang Điểm Môi', description: 'Các sản phẩm dùng cho môi như son, dưỡng môi, tẩy tế bào chết môi.' },
    { name: 'Mặt Nạ', description: 'Sản phẩm chăm sóc da mặt như mặt nạ giấy, mặt nạ đất sét, mặt nạ ngủ.' },
    { name: 'Trang Điểm Mặt', description: 'Sản phẩm trang điểm nền như kem nền, phấn phủ, che khuyết điểm.' },
    { name: 'Sữa Rửa Mặt', description: 'Sản phẩm làm sạch da mặt giúp loại bỏ bụi bẩn và dầu thừa.' },
    { name: 'Trang Điểm Mắt', description: 'Sản phẩm dành cho mắt như mascara, kẻ mắt, phấn mắt.' },
    { name: 'Dầu Gội Và Dầu Xả', description: 'Các sản phẩm chăm sóc tóc giúp làm sạch và dưỡng tóc mềm mượt.' },
    { name: 'Chống Nắng Da Mặt', description: 'Kem chống nắng bảo vệ da khỏi tia UV và tác hại môi trường.' },
    { name: 'Tẩy Trang Mặt', description: 'Sản phẩm giúp làm sạch lớp trang điểm và bụi bẩn trên da mặt.' },
    { name: 'Sữa Tắm', description: 'Sản phẩm làm sạch cơ thể, mang lại cảm giác tươi mát và dưỡng ẩm.' },
    { name: 'Dưỡng Thể', description: 'Kem và sữa dưỡng thể giúp da mềm mịn và giữ ẩm lâu dài.' },
    { name: 'Nước Hoa', description: 'Các loại nước hoa và body mist cho cả nam và nữ.' },
    { name: 'Chăm Sóc Răng Miệng', description: 'Kem đánh răng, nước súc miệng và sản phẩm vệ sinh răng miệng.' },
    { name: 'Chăm Sóc Phụ Nữ', description: 'Sản phẩm vệ sinh, dưỡng thể và chăm sóc dành riêng cho phụ nữ.' },
    { name: 'Tẩy Tế Bào Chết Body', description: 'Sản phẩm giúp loại bỏ tế bào chết và làm sáng da cơ thể.' },
    { name: 'Serum / Dầu Dưỡng Tóc', description: 'Tinh dầu và serum dưỡng tóc, giúp phục hồi tóc hư tổn.' },
  ];

  console.log(`Seeding ${categories.length} categories with descriptions...`);

  await Promise.all(
    categories.map(async ({ name, description }) => {
      try {
        await CategoryService.create({
          name,
          description,
          status: 'ACTIVE',
        });
        console.log(`Created category: ${name}`);
      } catch (err) {
        console.warn(`Skip category ${name}: ${err.message}`);
      }
    })
  );

  console.log('All categories seeded successfully!');
}

// =========================
// PRODUCTS
// =========================
async function seedProductsFromCSV() {
  try {
    await productService.importFromCSV(csvFilePath);
    console.log('Products imported from CSV.');
  } catch (e) {
    console.warn('Skip product CSV import:', e.message);
  }
}

// =========================
// CAMPAIGN
// =========================
async function seedCampaign() {
  const count = await Campaign.count();
  if (count > 0) {
    console.log('Campaigns already exist, skip seeding.');
    return await Campaign.findOne();
  }

  console.log('Seeding campaign...');
  const campaign = await CampaignService.createCampaign({
    name: 'Rạng Rỡ Nét Đẹp Việt - Quà Tặng 20/10',
    channel: 'instagram',
    budget: 18000000,
    start_date: '2025-10-01',
    end_date: '2025-10-20',
    expected_kpi: {
      leads: 1500,
      cpl: 12000,
    },
  });

  console.log('Created campaign:', campaign.name);
  return campaign;
}

// =========================
// LEADS
// =========================
async function seedLeads(campaignId) {
  const count = await Lead.count();
  if (count > 0) {
    console.log('Leads already exist, skip seeding.');
    return;
  }

  // Lấy sản phẩm từ DB để prefill product_interest (nếu có)
  let products = [];
  try {
    products = await Product.findAll({
      attributes: ['product_id', 'name'],
      order: [['created_at', 'DESC']],
    });
  } catch (e) {
    console.warn('Cannot load products, seeding leads without product_interest:', e.message);
  }

  if (!products || products.length === 0) {
    console.warn('No products found. Leads will be created without product_interest.');
  } else {
    console.log(`Loaded ${products.length} products for lead product_interest.`);
  }

  console.log('Seeding leads...');
  const statuses = ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  const leads = statuses.map((status, index) => {
    const product = products.length ? products[index % products.length] : null;

    return {
      name: `Lead Mẫu ${index + 1}`,
      email: `nguyenquocmanh611200${index + 1}@gmail.com`,
      phone: `09000000${index + 1}`,
      source: 'Inbound',
      tags: ['Chiến dịch 20/10', 'tháng 10'],
      campaign_id: campaignId,
      status,
      priority: priorities[index % priorities.length],
      product_interest: product ? product.name : null,
      lead_score: Math.floor(Math.random() * 100),
      conversion_prob: parseFloat((Math.random() * 0.8 + 0.1).toFixed(2)),
    };
  });

  for (const lead of leads) {
    try {
      await LeadService.createLead(lead);
      console.log(
        `Created lead: ${lead.name} (${lead.status})` +
        (lead.product_interest ? ` — product_interest: ${lead.product_interest}` : '')
      );
    } catch (err) {
      console.warn(`Skip lead ${lead.name}: ${err.message}`);
    }
  }

  console.log('All leads seeded successfully!');
}

// =========================
// AUTOMATION FLOW HELPERS
// =========================
async function findFlowByNameInsensitive(name) {
  try {
    const all = await flowsRepo.findAll?.();
    if (!Array.isArray(all)) return null;
    const target = String(name || '').trim().toLowerCase();
    return all.find((f) => String(f?.name || '').trim().toLowerCase() === target) || null;
  } catch (e) {
    console.warn('[Seed][Automation] findFlowByNameInsensitive failed:', e.message);
    return null;
  }
}

async function ensureFlowId({ name, description, tags = [], enabled = true, status = 'draft' }) {
  const existed = await findFlowByNameInsensitive(name);
  if (existed) {
    const flowId = existed.flow_id || existed.id;
    console.log(`[Seed][Automation] Flow existed: ${name} (${flowId}) -> will update`);
    return flowId;
  }

  const created = await AutomationFlowService.createFlow({
    name,
    description: description || '',
    tags: Array.isArray(tags) ? tags.join(', ') : String(tags || ''),
    enabled,
    status,
  });

  if (!created?.ok) {
    console.warn('[Seed][Automation] createFlow failed:', created?.error?.message);
    return null;
  }

  return created.data.flow_id;
}

async function saveAndPublishFlow(flowId, editorPayload) {
  const save = await AutomationFlowService.saveEditor(flowId, editorPayload);
  if (!save?.ok) {
    console.warn('[Seed][Automation] saveEditor failed:', save?.error?.message);
    return false;
  }

  const pub = await AutomationFlowService.publishFlow(flowId, { simulate: false });
  if (!pub?.ok) {
    console.warn('[Seed][Automation] publishFlow failed:', pub?.error?.message);
    return false;
  }

  return true;
}

// =========================
// FLOW SEEDS (dùng template_key + content.email/theme, KHÔNG nhét HTML style)
// =========================

// 0) Welcome Flow
async function seedWelcomeFlow() {
  const flowId = await ensureFlowId({
    name: 'Welcome Flow',
    description: 'Gửi chào mừng',
    tags: ['welcome', 'automation', 'email'],
    enabled: true,
    status: 'draft',
  });

  if (!flowId) return;

  const save = await AutomationFlowService.saveEditor(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Welcome Flow',
      description: 'Gửi email chào mừng khi lead được tạo',
      tags: ['welcome', 'automation', 'email'],
    },
    upserts: {
      triggers: [
        {
          trigger_id: null,
          event_type: 'lead.created',
          is_active: true,
          conditions: {},
        },
      ],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'send_email',
          channel: 'email',
          content: {
            to: '{{ lead.email }}',
            subject: 'Khuyến mãi 20/10 – Set quà tặng đang giảm giá!',
            template_key: 'welcome',
            email: {
              title: 'Dịp 20/10 – Set Quà Tặng Đặc Biệt',
              subtitle: 'Rạng Rỡ Nét Đẹp Việt',
              greeting_name: '{{ lead.name || "Khách hàng mới của tôi" }}',
              body: 'Chúng tôi dành riêng cho bạn set quà tặng ưu đãi đặc biệt. Ưu đãi có hạn, xem ngay nhé.',
              cta_url: '{{ trigger.campaign_link || "#" }}',
              cta_text: 'Khám phá ngay',

            },
            theme: {
              primary: '#ff6f91',
              secondary: '#6b7280',
            },
          },
          delay_minutes: 5,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'tag_update',
          channel: 'internal',
          content: {
            op: 'add',
            tags: ['New Lead'],
          },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'schedule',
          channel: 'internal',
          content: {
            delay_minutes: 1440,
            next_action: {
              type: 'create_task',
              content: {
                title: 'Follow-up lead mới sau 24h',
                description: 'Nhắc gọi/Zalo lead đã nhận email chào mừng.',
                due_in_minutes: 60,
              },
            },
          },
          delay_minutes: 1440,
          order_index: 2,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (!save?.ok) {
    console.warn('[Seed][Automation] saveEditor failed:', save?.error?.message);
    return;
  }

  const pub = await AutomationFlowService.publishFlow(flowId, { simulate: false });
  if (!pub?.ok) {
    console.warn('[Seed][Automation] publishFlow failed:', pub?.error?.message);
  } else {
    console.log('[Seed][Automation] Welcome Flow published.');
  }
}

// 1) Birthday Cron Flow (cron.daily)
async function seedBirthdayCronFlow() {
  const flowId = await ensureFlowId({
    name: 'Birthday Cron Flow',
    description: 'Mỗi ngày quét khách sinh nhật hôm nay và gửi email chúc mừng.',
    tags: ['cron', 'birthday', 'email'],
    enabled: true,
    status: 'draft',
  });

  if (!flowId) return;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Birthday Cron Flow',
      description: 'Mỗi ngày quét khách sinh nhật hôm nay và gửi email chúc mừng.',
      tags: ['cron', 'birthday', 'email'],
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'cron.daily', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'query.customers',
          channel: 'system',
          content: {
            conditions: { birthday_today: true, has_email: true },
            limit: 5000,
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'for_each',
          channel: 'system',
          content: {
            from_path: 'batch',
            item_key: 'customer',
            next_action: {
              action_type: 'send_email',
              channel: 'email',
              content: {
                to: '{{ customer.email }}',
                subject: 'Chúc mừng sinh nhật {{ customer.full_name }}',
                template_key: 'birthday',
                email: {
                  greeting_name: '{{ customer.full_name }}',
                  body: '{{ brand.name || "MyShop" }} chúc bạn một ngày thật nhiều niềm vui. Tặng bạn một mã ưu đãi sinh nhật để mua sắm.',
                  coupon_code: '{{ trigger.coupon_code || "HBD-10" }}',
                  expire_text: '{{ trigger.expire_text || "7 ngày kể từ hôm nay" }}',
                  cta_url: '{{ trigger.cta_url || "#" }}',
                  cta_text: 'Xem ưu đãi sinh nhật',
                  banner_url: '{{ trigger.banner_url || "" }}',
                },
                theme: { primary: '#2563eb', secondary: '#6b7280' },
              },
            },
          },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Birthday Cron Flow published.');
}

// 2) VIP Daily Deals (cron.daily)
async function seedVipDailyDealsFlow() {
  const flowId = await ensureFlowId({
    name: 'VIP Daily Deals (Cron)',
    description: 'Mỗi ngày gửi ưu đãi cho nhóm VIP (lọc theo customer_type hoặc tags).',
    tags: ['cron', 'vip', 'email'],
    enabled: true,
    status: 'draft',
  });

  if (!flowId) return;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'VIP Daily Deals (Cron)',
      description: 'Mỗi ngày gửi ưu đãi cho nhóm VIP (lọc theo customer_type hoặc tags).',
      tags: ['cron', 'vip', 'email'],
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'cron.daily', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'query.customers',
          channel: 'system',
          content: {
            conditions: {
              has_email: true,
              customer_type: 'VIP',
            },
            limit: 5000,
          },
          delay_minutes: 1,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'for_each',
          channel: 'system',
          content: {
            from_path: 'batch',
            item_key: 'customer',
            next_action: {
              action_type: 'send_email',
              channel: 'email',
              content: {
                to: '{{ customer.email }}',
                subject: 'Ưu đãi VIP hôm nay dành cho {{ customer.full_name }}',
                template_key: 'vip_deals',
                email: {
                  greeting_name: '{{ customer.full_name }}',
                  vip_discount: '{{ trigger.vip_discount || "Giảm 15%" }}',
                  cta_url: '{{ trigger.cta_url || "#" }}',
                  cta_text: 'Xem ưu đãi',
                },
                theme: { primary: '#2563eb', secondary: '#6b7280' },
              },
            },
          },
          delay_minutes: 1,
          order_index: 1,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] VIP Daily Deals (Cron) published.');
}

// 3) Order Created → Confirm Email
async function seedOrderCreatedConfirmFlow() {
  const flowId = await ensureFlowId({
    name: 'Order Created - Confirm Email',
    description: 'Khi tạo đơn hàng, gửi email xác nhận đặt hàng.',
    tags: ['order', 'email'],
    enabled: true,
    status: 'draft',
  });

  if (!flowId) return;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Order Created - Confirm Email',
      description: 'Khi tạo đơn hàng, gửi email xác nhận đặt hàng.',
      tags: ['order', 'email'],
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'order.created', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'send_email',
          channel: 'email',
          content: {
            to: '{{ customer.email or order.email or lead.email }}',
            subject: 'Xác nhận đơn hàng {{ order.order_id or "" }}',
            template_key: 'order_confirm',
            email: {
              order_id: '{{ order.order_id or "" }}',
              greeting_name: '{{ customer.full_name or lead.name or "bạn" }}',
              body: 'Chúng tôi đã nhận được đơn hàng của bạn. Vui lòng nhấn nút bên dưới để thanh toán và xác nhận đơn.',
              cta_url: '{{ payment.url or (env.FRONTEND_URL ~ "/checkout?order_id=" ~ (order.order_id or "")) }}',
              cta_text: 'Thanh toán đơn hàng',
            },
            theme: { primary: '#f97316', secondary: '#6b7280' },
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'log',
          channel: 'internal',
          content: {
            level: 'info',
            message: 'Order created email sent for order={{ order.order_id or "N/A" }}',
            meta: { kind: 'order.created' },
          },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Order Created - Confirm Email published.');
}

// 4) Order Paid → Receipt Email
async function seedOrderPaidReceiptFlow() {
  const flowId = await ensureFlowId({
    name: 'Order Paid - Receipt Email',
    description: 'Khi thanh toán thành công, gửi email hóa đơn/biên nhận.',
    tags: ['order', 'paid', 'email'],
    enabled: true,
    status: 'draft',
  });

  if (!flowId) return;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Order Paid - Receipt Email',
      description: 'Khi thanh toán thành công, gửi email hóa đơn/biên nhận.',
      tags: ['order', 'paid', 'email'],
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'order.paid', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'send_email',
          channel: 'email',
          content: {
            to: '{{ customer.email or order.email }}',
            subject: 'Biên nhận thanh toán - Đơn {{ order.order_id or "" }}',
            template_key: 'order_receipt',
            email: {
              title: 'Thanh toán thành công',
              order_id: '{{ order.order_id or "" }}',
              greeting_name: '{{ customer.full_name or "bạn" }}',
              total_amount: '{{ order.total_amount or 0 }}',
              currency: '{{ order.currency or "VND" }}',
              body: 'Cảm ơn bạn. Đơn hàng đã được thanh toán thành công.',
            },
            theme: { primary: '#065f46', secondary: '#6b7280' },
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Order Paid - Receipt Email published.');
}

// 5) Tag Added → Send Zalo (ví dụ high_intent)
async function seedTagAddedZaloFlow() {
  const flowId = await ensureFlowId({
    name: 'Tag Added - High Intent (Zalo)',
    description: 'Khi gắn tag high_intent, gửi tin nhắn Zalo (nếu có zalo_id).',
    tags: ['tag', 'zalo'],
    enabled: true,
    status: 'draft',
  });

  if (!flowId) return;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Tag Added - High Intent (Zalo)',
      description: 'Khi gắn tag high_intent, gửi tin nhắn Zalo (nếu có zalo_id).',
      tags: ['tag', 'zalo'],
    },
    upserts: {
      triggers: [
        {
          trigger_id: null,
          event_type: 'tag.added',
          is_active: true,
          conditions: { tags_in: ['high_intent'] },
        },
      ],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'send_zalo',
          channel: 'zalo',
          content: {
            to: '{{ lead.zalo_id }}',
            message:
              'Chào {{ lead.name || "bạn" }}, bên mình thấy bạn đang quan tâm sản phẩm. Mình hỗ trợ tư vấn nhanh nhé.',
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'create_task',
          channel: 'internal',
          content: {
            title: 'Gọi tư vấn lead high_intent',
            description: 'Lead vừa được gắn tag high_intent. Ưu tiên gọi tư vấn.',
            due_in_minutes: 60,
            type: 'follow_up',
          },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Tag Added - High Intent (Zalo) published.');
}

// =========================
// MAIN SEED
// =========================
async function seedDatabase() {
  //await seedRolesAndUsers();

  // Roles, Users
  await seedRole();
  await seedUser();

  await seedCategories();
  await seedProductsFromCSV();
  await seedCronJobs();

  const campaign = await seedCampaign();
  if (campaign) await seedLeads(campaign.campaign_id);

  // Catalog trước
  await seedAutomationCatalog();

  // Flows mẫu
  await seedWelcomeFlow();
  await seedBirthdayCronFlow();
  await seedVipDailyDealsFlow();
  await seedOrderCreatedConfirmFlow();
  await seedOrderPaidReceiptFlow();
  await seedTagAddedZaloFlow();
}

module.exports = { seedDatabase };
