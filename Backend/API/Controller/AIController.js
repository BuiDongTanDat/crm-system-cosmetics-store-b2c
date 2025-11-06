// controllers/AIController.js
const aiClient = require('../../Infrastructure/external/AIClient');
const { ok, fail, asAppError } = require('../../Application/helpers/errors');
const custommerService = require('../../Application/Services/CustomerService');
const productService = require('../../Application/Services/ProductService');
// const LeadService = require('../../Application/Services/LeadService');
// const orderService = require('../../Application/Services/OrderService');
// const campaignService = require('../../Application/Services/CampaignService');
class AIController {
  static async healthCheck(req, res) {
    try {
      const result = await aiClient.health();
      return res.status(200).json(ok(result || { message: 'AI Service OK' }));
    } catch (err) {
      console.error('[AI] health check failed:', err.message);
      return res.status(500).json(
        fail(asAppError(err, { status: 500, code: 'AI_HEALTH_FAILED' }))
      );
    }
  }
  static async generate_email_content(req, res) {
    try {
      const { input, options } = req.body || {};
      console.log('>>> generate_email_content input:', input, 'options:', options);
      if (!input || typeof input !== 'object') {
        return res.status(400).json(
          fail({
            code: 'INVALID_INPUT',
            message: 'Thiếu trường "input" trong body (vd: { input: {...}, options: {...} })',
          })
        );
      }
      const result = await aiClient.generate_email_content(input, options || {});
      return res
        .status(200)
        .json(ok(result || { message: 'Email content generated successfully' }));
    } catch (err) {
      console.error('[AI] generate_email_content failed:', err.message);
      return res
        .status(500)
        .json(
          fail(asAppError(err, {
            status: 500,
            code: 'AI_GENERATION_FAILED',
            message: 'Không thể sinh nội dung email từ AI service.',
          }))
        );
    }
  }
  //đề xuất chiến dịch marketing dựa trên dữ liệu khách hàng
  static async suggest_marketing_campaign(req, res) {
    try {
      const { topic, options } = req.body || {};
      const customer_data = [
        {
          customer_id: "a1b2c3d4-5678-9101-1121-314151617181",
          full_name: "Nguyễn Thị Hồng",
          customer_type: "VIP",
          birth_date: "1990-06-21",
          gender: "female",
          email: "hong.nguyen@example.com",
          phone: "0912345678",
          address: "123 Nguyễn Trãi, Hà Nội",
          social_channels: {
            facebook: "fb.com/hong.nguyen",
            zalo: "zalo.me/0912345678",
          },
          source: "Facebook Ads",
          tags: ["khách hàng thân thiết", "thích serum"],
          notes: "Mua hàng đều đặn hàng tháng, phản hồi tích cực về chất lượng.",
          created_at: "2024-08-12T08:45:00Z",
          updated_at: "2025-01-03T10:10:00Z",
        },
        {
          customer_id: "b2c3d4e5-6789-0123-4567-890abcdef123",
          full_name: "Trần Minh Tâm",
          customer_type: "Mới",
          birth_date: "1997-04-12",
          gender: "male",
          email: "minhtam.tran@example.com",
          phone: "0987654321",
          address: "45 Lý Thường Kiệt, Đà Nẵng",
          social_channels: {
            tiktok: "tiktok.com/@tamtran97",
          },
          source: "Website",
          tags: ["chăm sóc da", "quan tâm khuyến mãi"],
          notes: "Mới đăng ký tài khoản, chưa có đơn hàng.",
          created_at: "2025-02-15T09:00:00Z",
          updated_at: "2025-02-15T09:00:00Z",
        },
        {
          customer_id: "c3d4e5f6-7890-1234-5678-901234567890",
          full_name: "Lê Thảo Vy",
          customer_type: "Khách tiềm năng",
          birth_date: "1995-09-18",
          gender: "female",
          email: "thaovy.le@example.com",
          phone: "0909123456",
          address: "56 Điện Biên Phủ, TP.HCM",
          social_channels: {
            instagram: "instagram.com/thaovy.skincare",
          },
          source: "TikTok Ads",
          tags: ["quan tâm dưỡng ẩm", "serum vitamin C"],
          notes: "Đã tương tác với chiến dịch TikTok Ads tháng 9/2024.",
          created_at: "2025-03-01T13:20:00Z",
          updated_at: "2025-03-01T13:20:00Z",
        },
      ];

      const products = await productService.getAll();
      const product_data = (Array.isArray(products) ? products : [])
        .filter(p => String(p.status || '').toUpperCase() === 'AVAILABLE')
        .map(p => ({
          product_id: String(p.product_id || p.id || '').trim(),
          name: String(p.name || '').trim(),
          brand: p.brand || null,
          category: p.category || null,
          short_description: p.short_description || null,
          description: p.description || null,
          image: p.image || null,
          price_current: Number(p.price_current) || 0,
          price_original: Number(p.price_original) || 0,
          discount_percent: Number(p.discount_percent) || 0,
          rating: Number(p.rating) || 0,
          reviews_count: p.reviews_count || 0,
          monthly_sales: p.monthly_sales || null,
          sell_progress: p.sell_progress || null,
          inventory_qty: Number(p.inventory_qty) || 0,
          status: p.status || null,
          created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
          updated_at: p.updated_at ? new Date(p.updated_at).toISOString() : null,
        }))
        .filter(p => p.product_id && p.name); // loại item trống id/name
      console.log("[AI] product_data prepared:", product_data.length, "items");

      const result = await aiClient.suggest_marketing_campaign(
        topic,
        customer_data,
        product_data,
        options
      );
      return res.status(200).json(ok(result));
    } catch (err) {
      console.error("[AI] suggest_marketing_campaign failed:", err);
      return res.status(500).json(
        fail(asAppError(err, {
          status: 500,
          code: 'AI_SUGGESTION_FAILED',
          message: 'Không thể đề xuất chiến dịch marketing từ AI service.',
        }))
      );
    }
  }

}

module.exports = AIController;
