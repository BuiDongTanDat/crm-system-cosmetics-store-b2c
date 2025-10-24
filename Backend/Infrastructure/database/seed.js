// backend/src/Infrastructure/database/seed.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const UserService = require('../../Application/Services/UserService');
const ProductService = require('../../Application/Services/ProductService');
const CategoryService = require('../../Application/Services/CategoryService');
const CampaignService = require('../../Application/Services/CampaignService');
const LeadService = require('../../Application/Services/LeadService');
const Category = require('../../Domain/Entities/Category');
const Campaign = require('../../Domain/Entities/Campaign');
const Lead = require('../../Domain/Entities/Lead');
const csvFilePath = path.join(__dirname, 'product.csv');
const userService = new UserService();
const categoryService = new CategoryService();
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
async function seedCategories() {
    const existing = await Category.count();
    if (existing > 0) {
        console.log('Categories already exist, skip seeding.');
        return;
    }

    // Danh sách danh mục + mô tả
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

    console.log(` Seeding ${categories.length} categories with descriptions...`);

    // Tạo song song bằng Promise.all
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
async function seedProductsFromCSV() {
    ProductService.importFromCSV(csvFilePath);
}
async function seedCampaign() {
    const count = await Campaign.count();
    if (count > 0) {
        console.log('Campaigns already exist, skip seeding.');
        return;
    }

    console.log(' Seeding campaign...');
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

    console.log(' Created campaign:', campaign.name);
    return campaign;
}
async function seedLeads(campaignId) {
    const count = await Lead.count();
    if (count > 0) {
        console.log('Leads already exist, skip seeding.');
        return;
    }

    console.log(' Seeding leads...');
    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURING', 'CONVERTED', 'LOST'];

    const leads = statuses.map((status, index) => ({
        name: `Lead Mẫu ${index + 1}`,
        email: `lead${index + 1}@gmail.com`,
        phone: `09000000${index + 1}`,
        source: 'Inbound',
        tags: ['Chiến dịch 20/10', 'tháng 10'],
        campaign_id: campaignId,
        status,
    }));

    for (const lead of leads) {
        try {
            await LeadService.createLead(lead);
            console.log(`Created lead: ${lead.name} (${lead.status})`);
        } catch (err) {
            console.warn(`Skip lead ${lead.name}: ${err.message}`);
        }
    }
    console.log(' All leads seeded successfully!');
}
async function seedDatabase() {
    await seedRolesAndUsers();
    await seedCategories();
    await seedProductsFromCSV();
    const campaign = await seedCampaign();
    if (campaign) await seedLeads(campaign.campaign_id);
}

module.exports = { seedDatabase };
