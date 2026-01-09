// backend/src/Infrastructure/database/seed.js
/* eslint-disable no-console */
const path = require('path');

const UserService = require('../../Application/Services/UserService');
const ProductService = require('../../Application/Services/ProductService');
const CategoryService = require('../../Application/Services/CategoryService');
const CampaignService = require('../../Application/Services/CampaignService');
const LeadService = require('../../Application/Services/LeadService');
const AutomationFlowService = require('../../Application/Services/AutomationFlowService');

const flowsRepo = require('../../Infrastructure/Repositories/AutomationFlowRepository');
const CampaignRepository = require('../../Infrastructure/Repositories/CampaignRepository');
const CampaignChannelRepository = require('../../Infrastructure/Repositories/CampaignChannelRepository');
const CampaignChannelFlowRepository = require('../../Infrastructure/Repositories/CampaignChannelFlowRepository');
const customerRepository = require('../../Infrastructure/Repositories/CustomerRepository');
const OrderRepo = require('../../Infrastructure/Repositories/OrderRepository');
const AutomationCronJobRepository = require('../../Infrastructure/Repositories/AutomationCronJobRepository');

const { seedAutomationCatalog } = require('./seed_automation_catalog');
const { seedRole } = require('./seedRole');
// const { seedUser } = require('./seedUser'); // ❌ bỏ: tránh seed user 2 lần gây lệch password

// Domain models (for quick count/find)
const Category = require('../../Domain/Entities/Category');
const Campaign = require('../../Domain/Entities/Campaign');
const Lead = require('../../Domain/Entities/Lead');
const Product = require('../../Domain/Entities/Product');

// Optional: sequelize instance for transaction
let sequelize = null;
try {
  const DataManager = require('../../Infrastructure/database/postgres');
  sequelize = DataManager.getSequelize?.() || null;
} catch {
  sequelize = null;
}

const csvFilePath = path.join(__dirname, 'product_e.csv');

const userService = new UserService();

// =========================
// Helpers
// =========================
function safeJson(x) {
  return x?.toJSON?.() ?? x;
}

async function safeCount(model) {
  try {
    return await model.count();
  } catch {
    return 0;
  }
}

function normLeadSource(v) {
  const s = String(v || '').trim().toLowerCase();
  const ALLOWED = ['inbound', 'outbound', 'ads', 'referral'];
  return ALLOWED.includes(s) ? s : 'inbound';
}

// Enum/status: cho phép override bằng ENV để khớp DB của bạn (ACTIVE vs active)
const ENUMS = {
  categoryStatus: process.env.SEED_CATEGORY_STATUS || 'ACTIVE',
  userStatus: process.env.SEED_USER_STATUS || 'active', // nếu DB bạn dùng 'ACTIVE' thì set env SEED_USER_STATUS=ACTIVE
  campaignStatus: process.env.SEED_CAMPAIGN_STATUS || 'active',
  campaignChannelStatus: process.env.SEED_CAMPAIGN_CHANNEL_STATUS || 'active',
  orderStatusPending: process.env.SEED_ORDER_STATUS_PENDING || 'pending',
  orderStatusPaid: process.env.SEED_ORDER_STATUS_PAID || 'paid',
};

// helper chạy transaction nếu có sequelize
async function runTx(fn) {
  if (!sequelize?.transaction) return fn(null);
  return sequelize.transaction(async (t) => fn(t));
}

function nowISO() {
  return new Date().toISOString();
}

// bcrypt helper (bcrypt / bcryptjs)
function getBcrypt() {
  try {
    // eslint-disable-next-line global-require
    return require('bcrypt');
  } catch {
    // eslint-disable-next-line global-require
    return require('bcryptjs');
  }
}

// Try load User model (fallback cho update hash trực tiếp)
function tryLoadUserModel() {
  const candidates = [
    '../../Domain/Entities/User',
    '../../Domain/Entities/Users',
    '../../Domain/Entities/user',
    '../../Domain/Models/User',
  ];
  for (const p of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const m = require(p);
      if (m) return m;
    } catch { /* ignore */ }
  }
  return null;
}

async function findUserByEmailInsensitive(email) {
  const User = tryLoadUserModel();
  if (!User?.findOne) return null;

  // Sequelize Op
  let Op = null;
  try {
    // eslint-disable-next-line global-require
    ({ Op } = require('sequelize'));
  } catch {
    Op = null;
  }

  const e = String(email || '').trim();
  if (!e) return null;

  // best-effort find
  try {
    // case-insensitive if possible
    if (Op?.iLike) {
      return await User.findOne({ where: { email: { [Op.iLike]: e } } });
    }
    // fallback: lowercase compare in code
    const u = await User.findOne({ where: { email: e } });
    if (u) return u;

    // If DB stores normalized lower-case, try lower-case
    return await User.findOne({ where: { email: e.toLowerCase() } });
  } catch {
    return null;
  }
}

// =========================
// 0) Seed Catalog (event types / action types)
// =========================
async function seedCatalogFirst() {
  console.log('[Seed] Seeding automation catalog (event_types/action_types)...');
  try {
    await seedAutomationCatalog();
    console.log('[Seed] Automation catalog seeded.');
  } catch (e) {
    console.warn('[Seed] seedAutomationCatalog failed:', e.message);
  }
}

// =========================
// 1) ADMIN USER (idempotent: tồn tại thì reset password)
// =========================
async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'default123';

  console.log(`[Seed] Upserting admin user: ${email}`);

  // 1) Nếu UserService của bạn đã có method "upsert/reset password" thì ưu tiên dùng
  try {
    if (typeof userService.upsertAdminUser === 'function') {
      await userService.upsertAdminUser({ email, password });
      console.log('[Seed] Admin upserted via UserService.upsertAdminUser()');
      return;
    }
  } catch (e) {
    console.warn('[Seed] upsertAdminUser() failed, fallback:', e.message);
  }

  // 2) Fallback: check user tồn tại, không thì create qua service; nếu tồn tại thì update hash trực tiếp
  try {
    const existed = await findUserByEmailInsensitive(email);

    if (!existed) {
      await userService.createUser({
        full_name: 'Admin User',
        email,
        phone: '0901234567',
        password,
        role_name: 'Admin',
        status: ENUMS.userStatus,
      });
      console.log('[Seed] Admin created.');
      return;
    }

    // reset password -> hash rồi update trực tiếp
    const bcrypt = getBcrypt();
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const hash = await bcrypt.hash(password, saltRounds);

    // cố gắng đoán field hash phổ biến
    const patch = {};
    if (Object.prototype.hasOwnProperty.call(existed, 'password_hash') || existed.password_hash !== undefined) {
      patch.password_hash = hash;
    } else if (Object.prototype.hasOwnProperty.call(existed, 'passwordHash') || existed.passwordHash !== undefined) {
      patch.passwordHash = hash;
    } else if (Object.prototype.hasOwnProperty.call(existed, 'password') || existed.password !== undefined) {
      // một số schema lưu ngay "password" là hash
      patch.password = hash;
    } else {
      // fallback hard
      patch.password_hash = hash;
    }

    // nếu hệ thống login lọc status, đảm bảo status hợp lệ
    if (ENUMS.userStatus) patch.status = ENUMS.userStatus;

    await existed.update(patch);
    console.log('[Seed] Admin existed -> password reset.');
  } catch (err) {
    console.error('[Seed] seedAdminUser failed:', err.message);
  }
}

// =========================
// 1.5) MULTIPLE USERS WITH DIFFERENT ROLES
// =========================
async function seedMultipleUsers() {
  console.log('[Seed] Seeding multiple users with different roles...');

  const users = [
    {
      full_name: 'Nguyễn Văn Marketing',
      email: 'marketing@example.com',
      phone: '0901234568',
      password: 'marketing123',
      role_name: 'Marketing',
      status: ENUMS.userStatus,
    },
    {
      full_name: 'Trần Thị Sale',
      email: 'sale@example.com',
      phone: '0901234569',
      password: 'sale123',
      role_name: 'Sale',
      status: ENUMS.userStatus,
    },
    {
      full_name: 'Lê Văn Sale 2',
      email: 'sale2@example.com',
      phone: '0901234570',
      password: 'sale123',
      role_name: 'Sale',
      status: ENUMS.userStatus,
    },
  ];

  for (const userData of users) {
    try {
      const existed = await findUserByEmailInsensitive(userData.email);

      if (!existed) {
        await userService.createUser(userData);
        console.log(`[Seed] Created user: ${userData.full_name} (${userData.role_name})`);
      } else {
        // Reset password for existing user
        const bcrypt = getBcrypt();
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
        const hash = await bcrypt.hash(userData.password, saltRounds);

        const patch = {};
        if (Object.prototype.hasOwnProperty.call(existed, 'password_hash') || existed.password_hash !== undefined) {
          patch.password_hash = hash;
        } else if (Object.prototype.hasOwnProperty.call(existed, 'passwordHash') || existed.passwordHash !== undefined) {
          patch.passwordHash = hash;
        } else {
          patch.password = hash;
        }

        if (ENUMS.userStatus) patch.status = ENUMS.userStatus;

        await existed.update(patch);
        console.log(`[Seed] User existed, password reset: ${userData.full_name} (${userData.role_name})`);
      }
    } catch (err) {
      console.warn(`[Seed] Skip user ${userData.email}:`, err.message);
    }
  }

  console.log('[Seed] Multiple users seeded.');
}


// =========================
// 2) CATEGORIES
// =========================
async function seedCategories() {
  const existing = await safeCount(Category);
  if (existing > 0) {
    console.log('[Seed] Categories already exist, skip.');
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

  console.log(`[Seed] Seeding ${categories.length} categories...`);
  for (const { name, description } of categories) {
    try {
      await CategoryService.create({ name, description, status: ENUMS.categoryStatus });
      console.log(`[Seed] Created category: ${name}`);
    } catch (err) {
      console.warn(`[Seed] Skip category ${name}: ${err.message}`);
    }
  }
  console.log('[Seed] Categories seeded.');
}

// =========================
// 3) PRODUCTS
// =========================
async function seedProductsFromCSV() {
  console.log('[Seed] Importing products from CSV (best-effort)...');
  try {
    if (!ProductService?.importFromCSV) {
      console.warn('[Seed] ProductService.importFromCSV missing, skip.');
      return;
    }
    await ProductService.importFromCSV(csvFilePath);
    console.log('[Seed] Products imported from CSV.');
  } catch (e) {
    console.warn('[Seed] Skip product CSV import:', e.message);
  }
}

// =========================
// 4) CUSTOMERS
// =========================
async function seedCustomers() {
  let existing = 0;
  try {
    if (customerRepository.count) existing = await customerRepository.count();
  } catch {
    existing = 0;
  }

  if (existing > 0) {
    console.log('[Seed] Customers already exist, skip.');
    try {
      if (customerRepository.findAll) {
        const all = await customerRepository.findAll();
        return (Array.isArray(all) ? all : []).map(safeJson);
      }
    } catch { /* ignore */ }
    return [];
  }

  console.log('[Seed] Creating 20 customers...');
  const customers = [
    {
      full_name: 'Nguyễn Thị Hồng',
      email: 'nguyenthihong@gmail.com',
      phone: '0901234567',
      birthday: '1995-03-15',
      tags: ['VIP', 'email_ok', 'high_value'],
      customer_type: 'VIP',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Trần Văn Minh',
      email: 'tranvanminh@gmail.com',
      phone: '0902345678',
      birthday: '1998-07-22',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'zalo' },
    },
    {
      full_name: 'Lê Thị Lan',
      email: 'lethilan@gmail.com',
      phone: '0903456789',
      birthday: '2000-11-08',
      tags: ['New', 'email_ok', 'student'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Phạm Quốc Anh',
      email: 'phamquocanh@gmail.com',
      phone: '0904567890',
      birthday: '1992-05-30',
      tags: ['VIP', 'email_ok', 'loyal'],
      customer_type: 'VIP',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Hoàng Thị Mai',
      email: 'hoangthimai@gmail.com',
      phone: '0905678901',
      birthday: '1997-09-12',
      tags: ['Regular', 'email_ok', 'beauty_lover'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Vũ Văn Hùng',
      email: 'vuvanhung@gmail.com',
      phone: '0906789012',
      birthday: '1990-02-18',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'zalo' },
    },
    {
      full_name: 'Đỗ Thị Thảo',
      email: 'dothithao@gmail.com',
      phone: '0907890123',
      birthday: '1999-12-25',
      tags: ['VIP', 'email_ok', 'influencer'],
      customer_type: 'VIP',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Bùi Văn Đức',
      email: 'buivanduc@gmail.com',
      phone: '0908901234',
      birthday: '1994-06-14',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Ngô Thị Hương',
      email: 'ngothihuong@gmail.com',
      phone: '0909012345',
      birthday: '1996-04-20',
      tags: ['VIP', 'email_ok', 'premium'],
      customer_type: 'VIP',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Đinh Văn Tùng',
      email: 'dinhvantung@gmail.com',
      phone: '0910123456',
      birthday: '1993-08-05',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'zalo' },
    },
    {
      full_name: 'Lý Thị Nga',
      email: 'lythinga@gmail.com',
      phone: '0911234567',
      birthday: '2001-01-10',
      tags: ['New', 'email_ok', 'gen_z'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Trịnh Văn Phong',
      email: 'trinhvanphong@gmail.com',
      phone: '0912345678',
      birthday: '1991-10-28',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Phan Thị Linh',
      email: 'phanthilinh@gmail.com',
      phone: '0913456789',
      birthday: '1998-03-17',
      tags: ['VIP', 'email_ok', 'skincare_fan'],
      customer_type: 'VIP',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Dương Văn Khoa',
      email: 'duongvankhoa@gmail.com',
      phone: '0914567890',
      birthday: '1995-07-09',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'zalo' },
    },
    {
      full_name: 'Võ Thị Tâm',
      email: 'vothitam@gmail.com',
      phone: '0915678901',
      birthday: '1997-11-23',
      tags: ['Regular', 'email_ok', 'makeup_lover'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Hồ Văn Long',
      email: 'hovanlong@gmail.com',
      phone: '0916789012',
      birthday: '1992-09-03',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Mai Thị Xuân',
      email: 'maithixuan@gmail.com',
      phone: '0917890123',
      birthday: '2000-05-19',
      tags: ['New', 'email_ok', 'student'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Tô Văn Bình',
      email: 'tovanbinh@gmail.com',
      phone: '0918901234',
      birthday: '1994-12-07',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'zalo' },
    },
    {
      full_name: 'Chu Thị Yến',
      email: 'chuthiyen@gmail.com',
      phone: '0919012345',
      birthday: '1996-08-26',
      tags: ['VIP', 'email_ok', 'loyal'],
      customer_type: 'VIP',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
    {
      full_name: 'Lưu Văn Hải',
      email: 'luuvanhai@gmail.com',
      phone: '0920123456',
      birthday: '1993-02-14',
      tags: ['Regular', 'email_ok'],
      customer_type: 'Regular',
      status: 'active',
      settings: { preferred_channel: 'email' },
    },
  ];

  const out = [];
  for (const c of customers) {
    try {
      if (!customerRepository.create) {
        console.warn('[Seed] customerRepository.create not found, cannot seed customers.');
        break;
      }
      const created = await customerRepository.create(c);
      out.push(safeJson(created));
    } catch (e) {
      console.warn('[Seed] Create customer failed:', e.message);
    }
  }

  console.log(`[Seed] Created ${out.length} customers.`);
  return out;
}

// =========================
// 5) CAMPAIGN (center of flow)
// =========================
async function findCampaignByNameInsensitive(name) {
  const target = String(name || '').trim().toLowerCase();
  try {
    if (CampaignRepository?.findAll) {
      const all = await CampaignRepository.findAll();
      const hit = (Array.isArray(all) ? all : []).find(
        (c) => String(c?.name || '').trim().toLowerCase() === target,
      );
      return hit ? safeJson(hit) : null;
    }
  } catch { /* ignore */ }

  try {
    const all = await Campaign.findAll?.();
    const hit = (Array.isArray(all) ? all : []).find(
      (c) => String(c?.name || '').trim().toLowerCase() === target,
    );
    return hit ? safeJson(hit) : null;
  } catch {
    return null;
  }
}

async function ensureCampaign() {
  const name = 'Beauty Picks - Gợi ý sản phẩm theo nhu cầu';

  const existed = await findCampaignByNameInsensitive(name);
  if (existed) {
    console.log('[Seed] Campaign existed, reuse:', existed.campaign_id || existed.id);
    return existed;
  }

  console.log('[Seed] Creating campaign...');
  const created = await CampaignService.createCampaign({
    name,
    channel: 'multi',
    budget: 18000000,
    start_date: '2025-10-01',
    end_date: '2025-10-31',
    expected_kpi: { leads: 1500, cpl: 12000 },
    settings: {
      subject_prefix: '[Beauty Picks] ',
      brand_name: 'MyShop',
      footer_note: 'Bạn nhận email này vì đã từng quan tâm sản phẩm của MyShop.',
    },
    status: ENUMS.campaignStatus,
  });

  if (!created?.ok) {
    console.warn('[Seed] Create campaign failed:', created?.error?.message || 'unknown');
    return null;
  }

  const campaign = safeJson(created.data ?? created);
  console.log('[Seed] Created campaign:', campaign?.campaign_id || campaign?.id);
  return campaign;
}

// =========================
// 6) CAMPAIGN CHANNELS
// =========================
async function seedCampaignChannels(campaign) {
  if (!campaign) return [];

  const campaignJson = safeJson(campaign);
  const campaign_id = campaignJson.campaign_id || campaignJson.id;
  if (!campaign_id) return [];

  let existed = [];
  try {
    existed = await CampaignChannelRepository.findByCampaignId?.(campaign_id);
  } catch {
    existed = [];
  }

  if (Array.isArray(existed) && existed.length > 0) {
    console.log(`[Seed] Campaign channels already exist (${existed.length}), skip creating.`);
    return existed.map(safeJson);
  }

  console.log('[Seed] Creating campaign channels...');
  const channelsToCreate = [
    {
      campaign_id,
      channel_type: 'email',
      name: 'Email Blast',
      status: ENUMS.campaignChannelStatus,
      is_active: true,
      order_index: 0,
      segment_key: 'VIP',
      settings: { from_name: 'MyShop', sender: 'noreply@myshop.local' },
    },
    {
      campaign_id,
      channel_type: 'zalo',
      name: 'Zalo Broadcast',
      status: ENUMS.campaignChannelStatus,
      is_active: true,
      order_index: 1,
      segment_key: 'high_intent',
      settings: { oa_id: 'MYSHOP_OA' },
    },
  ];

  const out = [];
  for (const ch of channelsToCreate) {
    try {
      if (CampaignChannelRepository.create) {
        const created = await CampaignChannelRepository.create(ch);
        out.push(safeJson(created));
        continue;
      }
      if (CampaignChannelRepository.upsert) {
        const created = await CampaignChannelRepository.upsert(ch);
        out.push(safeJson(created));
        continue;
      }
      console.warn('[Seed] CampaignChannelRepository missing create/upsert, cannot create channels.');
      break;
    } catch (e) {
      console.warn('[Seed] Create channel failed:', e.message);
    }
  }

  console.log(`[Seed] Created ${out.length} campaign channels.`);
  return out;
}

async function mapFlowToChannel({ channel_id, flow_id, order_index = 0, is_active = true }) {
  if (!channel_id || !flow_id) return null;
  try {
    if (CampaignChannelFlowRepository.upsertMapping) {
      return await CampaignChannelFlowRepository.upsertMapping({
        channel_id,
        flow_id,
        order_index,
        is_active,
      });
    }
    if (CampaignChannelFlowRepository.upsertByUnique) {
      return await CampaignChannelFlowRepository.upsertByUnique({
        channel_id,
        flow_id,
        order_index,
        is_active,
      });
    }
    if (CampaignChannelFlowRepository.create) {
      return await CampaignChannelFlowRepository.create({
        channel_id,
        flow_id,
        order_index,
        is_active,
      });
    }
    console.warn('[Seed] CampaignChannelFlowRepository missing upsert/create mapping method.');
    return null;
  } catch (e) {
    console.warn('[Seed] mapFlowToChannel failed:', e.message);
    return null;
  }
}

// =========================
// 7) LEADS (linked to campaign + optionally customer)
// =========================
async function seedLeads(campaignId, customers = []) {
  const count = await safeCount(Lead);
  if (count > 0) {
    console.log('[Seed] Leads already exist, skip.');
    try {
      const all = await Lead.findAll?.();
      return (Array.isArray(all) ? all : []).map(safeJson);
    } catch { /* ignore */ }
    return [];
  }

  let products = [];
  try {
    products = await Product.findAll({
      attributes: ['product_id', 'name'],
      order: [['created_at', 'DESC']],
    });
  } catch (e) {
    console.warn('[Seed] Cannot load products for leads:', e.message);
  }

  console.log('[Seed] Creating 20 leads...');

  const leadData = [
    { name: 'Nguyễn Thị Phương', email: 'nguyenthiphuong@gmail.com', phone: '0921111111', status: 'new', priority: 'high', source: 'ads', score: 85, prob: 0.75 },
    { name: 'Trần Văn Đạt', email: 'tranvandat@gmail.com', phone: '0922222222', status: 'contacted', priority: 'medium', source: 'inbound', score: 65, prob: 0.55 },
    { name: 'Lê Thị Hà', email: 'lethiha@gmail.com', phone: '0923333333', status: 'qualified', priority: 'high', source: 'referral', score: 90, prob: 0.85 },
    { name: 'Phạm Văn Tú', email: 'phamvantu@gmail.com', phone: '0924444444', status: 'nurturing', priority: 'medium', source: 'ads', score: 70, prob: 0.60 },
    { name: 'Hoàng Thị Nhung', email: 'hoangthinhung@gmail.com', phone: '0925555555', status: 'converted', priority: 'urgent', source: 'inbound', score: 95, prob: 0.90 },
    { name: 'Vũ Văn Sơn', email: 'vuvanson@gmail.com', phone: '0926666666', status: 'closed_lost', priority: 'low', source: 'outbound', score: 30, prob: 0.15 },
    { name: 'Đỗ Thị Bích', email: 'dothibich@gmail.com', phone: '0927777777', status: 'new', priority: 'urgent', source: 'ads', score: 88, prob: 0.80 },
    { name: 'Bùi Văn Cường', email: 'buivancuong@gmail.com', phone: '0928888888', status: 'contacted', priority: 'high', source: 'referral', score: 75, prob: 0.65 },
    { name: 'Ngô Thị Diệu', email: 'ngothidieu@gmail.com', phone: '0929999999', status: 'qualified', priority: 'medium', source: 'inbound', score: 80, prob: 0.70 },
    { name: 'Đinh Văn Hải', email: 'dinhvanhai@gmail.com', phone: '0930000000', status: 'nurturing', priority: 'low', source: 'ads', score: 55, prob: 0.45 },
    { name: 'Lý Thị Kim', email: 'lythikim@gmail.com', phone: '0931111111', status: 'new', priority: 'medium', source: 'inbound', score: 60, prob: 0.50 },
    { name: 'Trịnh Văn Lâm', email: 'trinhvanlam@gmail.com', phone: '0932222222', status: 'contacted', priority: 'high', source: 'referral', score: 82, prob: 0.72 },
    { name: 'Phan Thị My', email: 'phanthimy@gmail.com', phone: '0933333333', status: 'qualified', priority: 'urgent', source: 'ads', score: 92, prob: 0.88 },
    { name: 'Dương Văn Nam', email: 'duongvannam@gmail.com', phone: '0934444444', status: 'nurturing', priority: 'medium', source: 'outbound', score: 68, prob: 0.58 },
    { name: 'Võ Thị Oanh', email: 'vothioanh@gmail.com', phone: '0935555555', status: 'converted', priority: 'high', source: 'inbound', score: 94, prob: 0.89 },
    { name: 'Hồ Văn Phúc', email: 'hovanphuc@gmail.com', phone: '0936666666', status: 'new', priority: 'low', source: 'ads', score: 45, prob: 0.35 },
    { name: 'Mai Thị Quỳnh', email: 'maithiquynh@gmail.com', phone: '0937777777', status: 'contacted', priority: 'medium', source: 'referral', score: 72, prob: 0.62 },
    { name: 'Tô Văn Rồng', email: 'tovanrong@gmail.com', phone: '0938888888', status: 'qualified', priority: 'high', source: 'inbound', score: 86, prob: 0.76 },
    { name: 'Chu Thị Sang', email: 'chuthisang@gmail.com', phone: '0939999999', status: 'nurturing', priority: 'medium', source: 'ads', score: 64, prob: 0.54 },
    { name: 'Lưu Văn Tài', email: 'luuvantai@gmail.com', phone: '0940000000', status: 'closed_lost', priority: 'low', source: 'outbound', score: 25, prob: 0.12 },
  ];

  const leads = leadData.map((data, index) => {
    const p = products.length ? products[index % products.length] : null;
    const c = customers.length ? customers[index % customers.length] : null;

    return {
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: normLeadSource(data.source),
      tags: ['Lead', data.status, data.source],
      campaign_id: campaignId,
      customer_id: c?.customer_id || c?.id || null,
      status: data.status,
      priority: data.priority,
      product_interest: p ? p.name : null,
      lead_score: data.score,
      conversion_prob: data.prob,
      zalo_id: index % 3 === 0 ? `zalo_${index + 1}` : null,
    };
  });

  const out = [];
  for (const lead of leads) {
    try {
      const created = await LeadService.createLead(lead);
      if (!created?.ok) {
        console.warn(`[Seed] Skip lead ${lead.name}: ${created?.error?.message || 'unknown error'}`);
        continue;
      }
      out.push(created.data ?? created);
      console.log(`[Seed] Created lead: ${lead.name} (${lead.status})`);
    } catch (err) {
      console.warn(`[Seed] Skip lead ${lead.name}: ${err.message}`);
    }
  }

  console.log('[Seed] Leads seeded.');
  return out.map(safeJson);
}

// =========================
// 8) ORDERS (to test order.created / order.paid)
// =========================
async function seedOrders(customers = [], leads = []) {
  if (!OrderRepo?.create) {
    console.warn('[Seed] OrderRepo.create missing, skip orders seed.');
    return [];
  }

  try {
    if (OrderRepo.findAll) {
      const all = await OrderRepo.findAll();
      if (Array.isArray(all) && all.length > 0) {
        console.log('[Seed] Orders already exist, skip.');
        return all.map(safeJson);
      }
    }
  } catch { /* ignore */ }

  // Load products for order items
  let products = [];
  try {
    products = await Product.findAll({
      attributes: ['product_id', 'name', 'price_current', 'price_original'],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
  } catch (e) {
    console.warn('[Seed] Cannot load products for orders:', e.message);
  }

  if (!products.length) {
    console.warn('[Seed] No products available, cannot create orders with items.');
    return [];
  }

  console.log('[Seed] Creating 30 orders with product items...');

  const statuses = ['pending', 'paid', 'processing', 'shipped', 'completed'];
  const paymentMethods = ['bank_transfer', 'cash_on_delivery', 'credit_card', 'paypal'];
  const channels = ['web', 'mobile', 'zalo', 'facebook'];

  const orders = [];
  for (let i = 0; i < 30; i++) {
    const customer = customers.length ? customers[i % customers.length] : null;
    const lead = leads.length ? leads[i % leads.length] : null;

    // Random 1-4 products per order
    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderProducts = [];
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const product = products[(i + j) % products.length];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const priceUnit = parseFloat(product.price_current || product.price_original || 100000);
      const discount = Math.random() > 0.7 ? 0.1 : 0; // 30% chance of 10% discount

      const lineTotal = priceUnit * quantity * (1 - discount);
      totalAmount += lineTotal;

      orderProducts.push({
        product_id: product.product_id,
        quantity,
        price_unit: priceUnit,
        price_original: parseFloat(product.price_original || priceUnit),
        discount,
      });
    }

    orders.push({
      customer_id: customer?.customer_id || customer?.id || null,
      lead_id: lead?.lead_id || lead?.id || null,
      order_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random within last 30 days
      total_amount: Math.round(totalAmount),
      currency: 'VND',
      payment_method: paymentMethods[i % paymentMethods.length],
      status: statuses[i % statuses.length],
      channel: channels[i % channels.length],
      notes: `Seed order ${i + 1}`,
      items: orderProducts,
    });
  }

  const out = [];
  const OrderDetail = require('../../Domain/Entities/OrderDetail');

  for (const orderData of orders) {
    try {
      const { items, ...orderFields } = orderData;

      // Create order first
      const createdOrder = await OrderRepo.create(orderFields);
      const orderId = createdOrder.order_id || createdOrder.id;

      // Create order details
      if (items && items.length > 0) {
        for (const item of items) {
          try {
            await OrderDetail.create({
              order_id: orderId,
              ...item,
            });
          } catch (e) {
            console.warn(`[Seed] Failed to create order detail for order ${orderId}:`, e.message);
          }
        }
      }

      out.push(safeJson(createdOrder));
      console.log(`[Seed] Created order ${orderId} with ${items.length} items (${orderFields.status})`);
    } catch (e) {
      console.warn('[Seed] Create order failed:', e.message);
    }
  }

  console.log(`[Seed] Created ${out.length} orders with product items.`);
  return out;
}

// =========================
// 9) CRON JOBS
// =========================
async function seedCronJobs() {
  try {
    await AutomationCronJobRepository.upsertByJobKey({
      job_key: 'daily',
      name: 'Daily Cron',
      description: 'Bắn event cron.daily mỗi ngày',
      event_type: 'cron.daily',
      cron_expr: '48 13 * * *',
      timezone: 'Asia/Ho_Chi_Minh',
      enabled: true,
      meta: {},
    });
    console.log('[Seed] Cron job "daily" upserted');
  } catch (e) {
    console.warn('[Seed] seedCronJobs failed:', e.message);
  }
}

// =========================
// 10) AUTOMATION FLOW HELPERS
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
    console.log(`[Seed][Automation] Flow existed: ${name} (${flowId}) -> reuse`);
    return flowId;
  }

  const created = await AutomationFlowService.createFlow({
    name,
    description: description || '',
    tags: Array.isArray(tags) ? tags : [String(tags || '')],
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
// 11) FLOW SEEDS
// =========================
async function seedWelcomeLeadFlow() {
  const flowId = await ensureFlowId({
    name: 'Lead Created - Welcome Email',
    description: 'Khi lead được tạo, gửi email chào mừng.',
    tags: ['lead', 'welcome', 'email'],
    enabled: true,
    status: 'draft',
  });
  if (!flowId) return null;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Lead Created - Welcome Email',
      description: 'Khi lead được tạo, gửi email chào mừng.',
      tags: ['lead', 'welcome', 'email'],
      status: 'draft',
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'lead.created', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'send_email',
          channel: 'email',
          content: {
            to: '{{ lead.email }}',
            subject: 'Chào mừng {{ lead.name or "bạn" }} đến với {{ brand.name or "MyShop" }}',
            template_key: 'lead_welcome',
            email: {
              body_text: 'Cảm ơn bạn đã quan tâm sản phẩm của MyShop.',
              body_html:
                '<p>Chào {{ lead.name or "bạn" }}, cảm ơn bạn đã quan tâm.</p><p>Trả lời email này để mình tư vấn routine phù hợp nhé.</p>',
              cta: { label: 'Xem sản phẩm', url: '{{ env.FRONTEND_URL or "#" }}' },
            },
            theme: { brand_name: 'MyShop' },
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'tag_update',
          channel: 'internal',
          content: { op: 'add', tags: ['Email Welcome Sent'] },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'create_task',
          channel: 'internal',
          content: {
            type: 'follow_up',
            title: 'Follow-up lead mới',
            description: 'Lead vừa nhận welcome email, follow-up sau 2 giờ.',
            due_in_minutes: 120,
          },
          delay_minutes: 0,
          order_index: 2,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Lead welcome flow published.');
  return flowId;
}

async function seedBirthdayCronFlow() {
  const flowId = await ensureFlowId({
    name: 'Cron Daily - Birthday Email',
    description: 'Mỗi ngày quét khách sinh nhật hôm nay và gửi email chúc mừng.',
    tags: ['cron', 'birthday', 'email'],
    enabled: true,
    status: 'draft',
  });
  if (!flowId) return null;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Cron Daily - Birthday Email',
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
          channel: 'internal',
          content: {
            conditions: { birthday_today: true, has_email: true },
            limit: 5000,
            save_to_ctx: 'batch',
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'for_each',
          channel: 'internal',
          content: {
            from_path: 'batch',
            item_key: 'customer',
            next_action: {
              action_type: 'send_email',
              channel: 'email',
              content: {
                to: '{{ customer.email }}',
                subject: 'Chúc mừng sinh nhật {{ customer.full_name or "bạn" }}',
                template_key: 'birthday',
                email: {
                  body_text: 'MyShop chúc bạn sinh nhật vui vẻ.',
                  body_html:
                    '<p>Chúc mừng sinh nhật {{ customer.full_name or "bạn" }}.</p><p>Tặng bạn mã ưu đãi sinh nhật.</p>',
                  coupon: {
                    code: '{{ trigger.coupon_code or "HBD-10" }}',
                    expire_text: '{{ trigger.expire_text or "7 ngày" }}',
                  },
                  cta: { label: 'Nhận ưu đãi', url: '{{ env.FRONTEND_URL or "#" }}' },
                },
                theme: { brand_name: 'MyShop' },
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

  if (ok) console.log('[Seed][Automation] Birthday cron flow published.');
  return flowId;
}

async function seedOrderCreatedConfirmFlow() {
  const flowId = await ensureFlowId({
    name: 'Order Created - Confirm Email',
    description: 'Khi tạo đơn hàng, gửi email xác nhận đặt hàng.',
    tags: ['order', 'email'],
    enabled: true,
    status: 'draft',
  });
  if (!flowId) return null;

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
              body_text: 'Cảm ơn bạn đã đặt hàng.',
              body_html:
                '<p>Chào {{ customer.full_name or lead.name or "bạn" }}, cảm ơn bạn đã đặt hàng.</p><p>Nhấn nút bên dưới để thanh toán.</p>',
              order: {
                id: '{{ order.order_id or "" }}',
                total: '{{ order.total_amount or 0 }}',
                currency: '{{ order.currency or "VND" }}',
              },
              cta: {
                label: 'Thanh toán',
                url: '{{ payment.url or (env.FRONTEND_URL ~ "/checkout?order_id=" ~ (order.order_id or "")) }}',
              },
            },
            theme: { brand_name: 'MyShop' },
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

  if (ok) console.log('[Seed][Automation] Order created confirm flow published.');
  return flowId;
}

async function seedOrderPaidReceiptFlow() {
  const flowId = await ensureFlowId({
    name: 'Order Paid - Receipt Email',
    description: 'Khi thanh toán thành công, gửi email hóa đơn/biên nhận.',
    tags: ['order', 'paid', 'email'],
    enabled: true,
    status: 'draft',
  });
  if (!flowId) return null;

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
              body_text: 'Thanh toán thành công. Cảm ơn bạn.',
              body_html:
                '<p>Chào {{ customer.full_name or "bạn" }}, đơn hàng {{ order.order_id or "" }} đã thanh toán thành công.</p>',
              order: {
                id: '{{ order.order_id or "" }}',
                total: '{{ order.total_amount or 0 }}',
                currency: '{{ order.currency or "VND" }}',
              },
            },
            theme: { brand_name: 'MyShop' },
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Order paid receipt flow published.');
  return flowId;
}

async function seedCampaignChannelEmailBlastFlow() {
  const flowId = await ensureFlowId({
    name: 'Campaign Channel Run - Email Blast',
    description: 'Khi campaign.channel.run, query customers theo segment và gửi email hàng loạt.',
    tags: ['campaign', 'channel', 'email'],
    enabled: true,
    status: 'draft',
  });
  if (!flowId) return null;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Campaign Channel Run - Email Blast',
      description: 'Khi campaign.channel.run, query customers theo segment và gửi email hàng loạt.',
      tags: ['campaign', 'channel', 'email'],
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'campaign.channel.run', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'query.customers',
          channel: 'internal',
          content: {
            conditions: { has_email: true, customer_type: '{{ campaign_channel.segment_key or "VIP" }}' },
            limit: 5000,
            save_to_ctx: 'batch',
          },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'for_each',
          channel: 'internal',
          content: {
            from_path: 'batch',
            item_key: 'customer',
            next_action: {
              action_type: 'send_email',
              channel: 'email',
              condition: 'ctx.customer && ctx.customer.email',
              content: {
                to: '{{ customer.email }}',
                subject: '{{ (settings.merged.subject_prefix or "") }}{{ campaign.name or "Chiến dịch" }}',
                template_key: 'campaign_blast',
                email: {
                  body_text: 'Ưu đãi dành cho bạn từ chiến dịch.',
                  body_html:
                    '<p>Chào {{ customer.full_name or "bạn" }},</p><p>{{ campaign.description or "" }}</p>',
                  cta: {
                    label: 'Xem ưu đãi',
                    url: '{{ env.FRONTEND_URL or "#" }}/campaigns/{{ campaign.campaign_id or campaign.id }}',
                  },
                },
                theme: { brand_name: '{{ settings.merged.brand_name or "MyShop" }}' },
              },
            },
          },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'log',
          channel: 'internal',
          content: {
            level: 'info',
            message:
              'Campaign channel blast executed. campaign={{ campaign.campaign_id or campaign.id }} channel={{ campaign_channel.channel_id or campaign_channel.id }} run_id={{ trigger.run_id or "" }}',
          },
          delay_minutes: 0,
          order_index: 2,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Campaign Channel Email Blast flow published.');
  return flowId;
}

async function seedEmailOpenedFlow() {
  const flowId = await ensureFlowId({
    name: 'Engagement - Email Opened',
    description: 'Khi email được mở, gắn tag + add_interaction.',
    tags: ['engagement', 'email', 'opened'],
    enabled: true,
    status: 'draft',
  });
  if (!flowId) return null;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Engagement - Email Opened',
      description: 'Khi email được mở, gắn tag + add_interaction.',
      tags: ['engagement', 'email', 'opened'],
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'engagement.email_opened', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'tag_update',
          channel: 'internal',
          content: { op: 'add', tags: ['Email Opened'] },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'add_interaction',
          channel: 'internal',
          content: {
            type: 'email_opened',
            source: '{{ trigger.source or "pixel" }}',
            mid: '{{ trigger.mid or "" }}',
            template_key: '{{ trigger.template_key or "" }}',
            flow_id: '{{ trigger.flow_id or "" }}',
            order_id: '{{ trigger.order_id or "" }}',
            at: '{{ trigger.at or "" }}',
          },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'log',
          channel: 'internal',
          content: {
            level: 'info',
            message:
              'Email opened mid={{ trigger.mid or "" }} template={{ trigger.template_key or "" }} lead={{ trigger.lead_id or "" }} order={{ trigger.order_id or "" }}',
          },
          delay_minutes: 0,
          order_index: 2,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Engagement email opened flow published.');
  return flowId;
}

async function seedEngagementLinkClickedFlow() {
  const flowId = await ensureFlowId({
    name: 'Engagement - Link Clicked',
    description: 'Khi link tracking được click, gắn tag Interested + add_interaction.',
    tags: ['engagement', 'email', 'clicked'],
    enabled: true,
    status: 'draft',
  });
  if (!flowId) return null;

  const ok = await saveAndPublishFlow(flowId, {
    isNewRecord: true,
    flow_meta: {
      name: 'Engagement - Link Clicked',
      description: 'Khi link tracking được click, gắn tag Interested + add_interaction.',
      tags: ['engagement', 'email', 'clicked'],
    },
    upserts: {
      triggers: [{ trigger_id: null, event_type: 'engagement.link_clicked', is_active: true, conditions: {} }],
      actions: [
        {
          action_id: null,
          trigger_id: null,
          action_type: 'tag_update',
          channel: 'internal',
          content: { op: 'add', tags: ['Interested', 'Link Clicked'] },
          delay_minutes: 0,
          order_index: 0,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'add_interaction',
          channel: 'internal',
          content: {
            type: 'link_clicked',
            source: '{{ trigger.source or "email" }}',
            mid: '{{ trigger.mid or "" }}',
            url: '{{ trigger.url or "" }}',
            template_key: '{{ trigger.template_key or "" }}',
            flow_id: '{{ trigger.flow_id or "" }}',
            order_id: '{{ trigger.order_id or "" }}',
            at: '{{ trigger.at or "" }}',
          },
          delay_minutes: 0,
          order_index: 1,
          status: 'pending',
        },
        {
          action_id: null,
          trigger_id: null,
          action_type: 'log',
          channel: 'internal',
          content: {
            level: 'info',
            message:
              'Link clicked mid={{ trigger.mid or "" }} url={{ trigger.url or "" }} lead={{ trigger.lead_id or "" }}',
          },
          delay_minutes: 0,
          order_index: 2,
          status: 'pending',
        },
      ],
    },
    deletes: { trigger_ids: [], action_ids: [] },
  });

  if (ok) console.log('[Seed][Automation] Engagement link clicked flow published.');
  return flowId;
}

// =========================
// MAIN SEED (campaign-centric order)
// =========================
async function seedDatabase() {
  console.log('================ SEED START ================');

  // 0) Catalog trước để flows publish không thiếu action_types / event_types
  await seedCatalogFirst();

  // 1) Roles trước
  await seedRole();

  // 2) Admin user: idempotent (tồn tại thì reset password)
  await seedAdminUser();

  // 2.5) Multiple users with different roles
  await seedMultipleUsers();

  // 3) Master data
  await seedCategories();
  await seedProductsFromCSV();
  const customers = await seedCustomers();

  // 4) Campaign (center)
  const campaign = await ensureCampaign();
  const campaignJson = safeJson(campaign);
  const campaign_id = campaignJson?.campaign_id || campaignJson?.id;
  if (!campaign_id) {
    console.warn('[Seed] No campaign_id. Skip campaign-dependent seeding (channels/leads/orders/mapping).');
  }

  // 5) Channels
  const channels = campaign_id ? await seedCampaignChannels(campaignJson || campaign) : [];

  // 6) Leads/Orders
  const leads = campaign_id ? await seedLeads(campaign_id, customers) : [];
  await seedOrders(customers, leads);

  // 7) Cron jobs
  await seedCronJobs();

  // 8) Flows
  const leadWelcomeFlowId = await seedWelcomeLeadFlow();
  await seedBirthdayCronFlow();
  await seedOrderCreatedConfirmFlow();
  await seedOrderPaidReceiptFlow();
  await seedOrderPaidReceiptFlow();
  await seedEmailOpenedFlow();
  await seedEngagementLinkClickedFlow();

  // Flow mapped cho channel email
  const campaignEmailBlastFlowId = await seedCampaignChannelEmailBlastFlow();

  // 9) Mapping channel->flow
  const emailChannel = (channels || []).find((c) => String(c.channel_type || '').toLowerCase() === 'email');
  if (emailChannel && campaignEmailBlastFlowId) {
    const channel_id = emailChannel.channel_id || emailChannel.id;
    await mapFlowToChannel({ channel_id, flow_id: campaignEmailBlastFlowId, order_index: 0, is_active: true });
    console.log('[Seed] Mapped Email Blast channel -> Campaign Channel Email Blast flow');
  }

  void leadWelcomeFlowId;

  console.log('[Seed] Done.');
  console.log('================= SEED END =================');
}

module.exports = { seedDatabase };
