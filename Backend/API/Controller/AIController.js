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
      const { topic } = req.body;
      // const { customer_data } = req.body || {};
      // customer_data = custommerService.listCustomers();
      // Product_data = productService.getAll();
      const customer_data =
        [
          {
            "customer_id": "a1b2c3d4-5678-9101-1121-314151617181",
            "full_name": "Nguyễn Thị Hồng",
            "customer_type": "VIP",
            "birth_date": "1990-06-21",
            "gender": "female",
            "email": "hong.nguyen@example.com",
            "phone": "0912345678",
            "address": "123 Nguyễn Trãi, Hà Nội",
            "social_channels": {
              "facebook": "fb.com/hong.nguyen",
              "zalo": "zalo.me/0912345678"
            },
            "source": "Facebook Ads",
            "tags": ["khách hàng thân thiết", "thích serum"],
            "notes": "Mua hàng đều đặn hàng tháng, phản hồi tích cực về chất lượng.",
            "created_at": "2024-08-12T08:45:00Z",
            "updated_at": "2025-01-03T10:10:00Z"
          },
          {
            "customer_id": "b2c3d4e5-6789-0123-4567-890abcdef123",
            "full_name": "Trần Minh Tâm",
            "customer_type": "Mới",
            "birth_date": "1997-04-12",
            "gender": "male",
            "email": "minhtam.tran@example.com",
            "phone": "0987654321",
            "address": "45 Lý Thường Kiệt, Đà Nẵng",
            "social_channels": {
              "tiktok": "tiktok.com/@tamtran97"
            },
            "source": "Website",
            "tags": ["chăm sóc da", "quan tâm khuyến mãi"],
            "notes": "Mới đăng ký tài khoản, chưa có đơn hàng.",
            "created_at": "2025-02-15T09:00:00Z",
            "updated_at": "2025-02-15T09:00:00Z"
          },
          {
            "customer_id": "c3d4e5f6-7890-1234-5678-901234567890",
            "full_name": "Lê Thảo Vy",
            "customer_type": "Khách tiềm năng",
            "birth_date": "1995-09-18",
            "gender": "female",
            "email": "thaovy.le@example.com",
            "phone": "0909123456",
            "address": "56 Điện Biên Phủ, TP.HCM",
            "social_channels": {
              "instagram": "instagram.com/thaovy.skincare"
            },
            "source": "TikTok Ads",
            "tags": ["quan tâm dưỡng ẩm", "serum vitamin C"],
            "notes": "Đã tương tác với chiến dịch TikTok Ads tháng 9/2024.",
            "created_at": "2025-03-01T13:20:00Z",
            "updated_at": "2025-03-01T13:20:00Z"
          }
        ]
      const Product_data = [
        {
          "product_id": "f8a1b2c3-4d5e-678f-9012-3456789abcde",
          "name": "Serum Vitamin C Dưỡng Trắng",
          "brand": "GlowSkin",
          "short_description": "Tinh chất dưỡng sáng da, giảm thâm nám, phù hợp mọi loại da.",
          "category": "Serum",
          "image": "https://cdn.example.com/products/serum-vitamin-c.jpg",
          "price_current": 450000,
          "price_original": 520000,
          "discount_percent": 15,
          "rating": 4.7,
          "reviews_count": 134,
          "monthly_sales": "120",
          "sell_progress": "80%",
          "inventory_qty": 230,
          "status": "AVAILABLE",
          "status_updated_at": "2025-02-10T00:00:00Z"
        },
        {
          "product_id": "a9b8c7d6-5432-1098-7654-3210fedcba98",
          "name": "Kem Dưỡng Ẩm Ban Đêm",
          "brand": "AquaPlus",
          "short_description": "Kem cấp ẩm sâu, phục hồi da ban đêm, giúp da mềm mịn.",
          "category": "Cream",
          "image": "https://cdn.example.com/products/night-cream.jpg",
          "price_current": 390000,
          "price_original": 450000,
          "discount_percent": 13,
          "rating": 4.5,
          "reviews_count": 98,
          "monthly_sales": "85",
          "sell_progress": "70%",
          "inventory_qty": 150,
          "status": "AVAILABLE",
          "status_updated_at": "2025-02-05T00:00:00Z"
        },
        {
          "product_id": "d1e2f3a4-b5c6-789d-012e-345f67890123",
          "name": "Sữa Rửa Mặt Dịu Nhẹ Cho Da Nhạy Cảm",
          "brand": "PureSkin",
          "short_description": "Sữa rửa mặt làm sạch nhẹ nhàng, không gây khô da, pH 5.5.",
          "category": "Cleanser",
          "image": "https://cdn.example.com/products/cleanser.jpg",
          "price_current": 250000,
          "price_original": 280000,
          "discount_percent": 10,
          "rating": 4.6,
          "reviews_count": 76,
          "monthly_sales": "210",
          "sell_progress": "95%",
          "inventory_qty": 90,
          "status": "AVAILABLE",
          "status_updated_at": "2025-02-18T00:00:00Z"
        }
      ]
      if (!customer_data || typeof customer_data !== 'object') {
        return res.status(400).json(
          fail({
            code: 'INVALID_INPUT',
            message: 'Thiếu trường "customer_data" trong body (vd: { customer_data: {...} })',
          })
        );
      }
      const result = await aiClient.suggest_marketing_campaign(topic, customer_data, Product_data);
      return res.status(200).json(ok(result));
    } catch (err) {
      console.error('[AI] suggest_marketing_campaign failed:', err.message);
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
