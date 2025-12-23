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
  static async predict_churn(req, res) {
    try {
      const { features, options } = req.body || {};
      if (!features || typeof features !== 'object') {
        return res.status(400).json(fail({
          code: 'INVALID_INPUT',
          message: 'Thiếu "features" (object) trong body',
        }));
      }

      // Optional: basic validation for common fields
      // (không bắt buộc, nhưng giúp giảm lỗi model service)
      // ví dụ: features.recency, features.frequency_90d...
      const result = await aiClient.predict_churn(features, options || {});
      return res.status(200).json(ok(result));
    } catch (err) {
      console.error('[AI] predict_churn failed:', err);
      return res.status(500).json(
        fail(asAppError(err, {
          status: 500,
          code: 'AI_CHURN_PREDICT_FAILED',
          message: 'Không thể dự đoán churn.',
        }))
      );
    }
  }
   static async batch_predict_churn(req, res) {
    try {
      const { items, options } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json(fail({
          code: 'INVALID_INPUT',
          message: 'Thiếu "items" (array) trong body',
        }));
      }

      // chỉ lấy features để gửi sang AI service
      const payload = items.map((it) => ({
        customer_id: it.customer_id || null,
        features: it.features || {},
      }));

      const result = await aiClient.batch_predict_churn(payload, options || {});
      return res.status(200).json(ok(result));
    } catch (err) {
      console.error('[AI] batch_predict_churn failed:', err);
      return res.status(500).json(
        fail(asAppError(err, {
          status: 500,
          code: 'AI_CHURN_BATCH_FAILED',
          message: 'Không thể dự đoán churn theo danh sách.',
        }))
      );
    }
  }
  static async segment_customers(req, res) {
    try {
      const { customers, options } = req.body || {};
      if (!Array.isArray(customers) || customers.length === 0) {
        return res.status(400).json(fail({
          code: 'INVALID_INPUT',
          message: 'Thiếu "customers" (array) trong body',
        }));
      }

      const result = await aiClient.segment_customers(customers, options || {});
      return res.status(200).json(ok(result));
    } catch (err) {
      console.error('[AI] segment_customers failed:', err);
      return res.status(500).json(
        fail(asAppError(err, {
          status: 500,
          code: 'AI_SEGMENT_FAILED',
          message: 'Không thể phân nhóm khách hàng.',
        }))
      );
    }
  }
    static async recommend_products(req, res) {
    try {
      const { customer_id, context, options } = req.body || {};
      if (!customer_id) {
        return res.status(400).json(fail({
          code: 'INVALID_INPUT',
          message: 'Thiếu "customer_id" trong body',
        }));
      }

      // Lấy customer + products (tuỳ bạn)
      const customer = await custommerService.getById(customer_id);
      const products = await productService.getAll();

      const product_data = (Array.isArray(products) ? products : [])
        .filter(p => String(p.status || '').toUpperCase() === 'AVAILABLE')
        .map(p => ({
          product_id: String(p.product_id || p.id || '').trim(),
          name: String(p.name || '').trim(),
          brand: p.brand || null,
          category: p.category || null,
          price_current: Number(p.price_current) || 0,
          discount_percent: Number(p.discount_percent) || 0,
          rating: Number(p.rating) || 0,
          inventory_qty: Number(p.inventory_qty) || 0,
        }))
        .filter(p => p.product_id && p.name);

      const result = await aiClient.recommend_products(
        customer,
        product_data,
        context || {},
        options || {}
      );

      return res.status(200).json(ok(result));
    } catch (err) {
      console.error('[AI] recommend_products failed:', err);
      return res.status(500).json(
        fail(asAppError(err, {
          status: 500,
          code: 'AI_RECOMMEND_FAILED',
          message: 'Không thể gợi ý sản phẩm.',
        }))
      );
    }
  }
   static async predict_churn_by_customer_id(req, res) {
    try {
      const { customer_id, options } = req.body || {};
      if (!customer_id) {
        return res.status(400).json(fail({
          code: 'INVALID_INPUT',
          message: 'Thiếu "customer_id" trong body',
        }));
      }
      const features = await custommerService.getCustomerChurnFeatures(customer_id);
      if (!features) {
        return res.status(404).json(fail({
          code: 'NOT_FOUND',
          message: 'Không tìm thấy dữ liệu feature cho customer_id',
        }));
      }

      const result = await aiClient.predict_churn(features, options || {});
      return res.status(200).json(ok({ customer_id, ...result }));
    } catch (err) {
      console.error('[AI] predict_churn_by_customer_id failed:', err);
      return res.status(500).json(
        fail(asAppError(err, {
          status: 500,
          code: 'AI_CHURN_BY_ID_FAILED',
          message: 'Không thể dự đoán churn theo customer_id.',
        }))
      );
    }
  }
}

module.exports = AIController;
