import asyncio
import json
from typing import Any, Dict, List, Optional
from app import config
from datetime import datetime, timezone
try:
    import google.generativeai as genai
    _GEMINI_AVAILABLE = True
except Exception as e:
    print("[LLM] ⚠️ Google GenerativeAI SDK not found:", e)
    genai = None
    _GEMINI_AVAILABLE = False


class LLMService:
    def __init__(self):
        self.enabled = bool(config.GEMINI_API_KEY and _GEMINI_AVAILABLE)
        if self.enabled:
            print("[LLM] ✅ Gemini enabled with model:", config.GEMINI_MODEL_GENERIC)
            genai.configure(api_key=config.GEMINI_API_KEY)
        else:
            print("[LLM] ⚠️ Gemini disabled (missing API key or SDK).")

    # ----------------- Generate Email -----------------
    async def generate_email_content(
        self,
        context: Dict[str, Any],
        purpose: str = "promotion",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Sinh nội dung email gồm {subject, body} dựa trên ngữ cảnh action.
        context có thể gồm: name, product, campaign, tone, language, offer,...
        """
        if not self.enabled:
            return {
                "subject": f"[{context.get('campaign','Thông báo')}] {context.get('product','Sản phẩm mới')} của bạn",
                "body": (
                    f"Xin chào {context.get('name','bạn')},\n\n"
                    f"Chúng tôi xin giới thiệu {context.get('product','sản phẩm mới')}."
                    f" Hãy ghé cửa hàng để nhận ưu đãi {context.get('offer','đặc biệt')}!\n\n"
                    "Thân mến,\nĐội ngũ chăm sóc khách hàng."
                )
            }

        # prompt chính thức
        prompt = (
            "Bạn là chuyên gia marketing trong lĩnh vực mỹ phẩm. "
            "Hãy soạn **email** bằng tiếng Việt phù hợp với mục đích dưới đây.\n\n"
            f"- Mục đích: {purpose}\n"
            "- Yêu cầu:\n"
            "  • Viết ngắn gọn, tự nhiên, phù hợp khách hàng B2C.\n"
            "  • Trả về **JSON hợp lệ** dạng:\n"
            '    {"subject": "<tiêu đề>", "body": "<nội dung email>"}.\n'
            "  • Không viết ngoài JSON.\n\n"
            f"Ngữ cảnh action:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
        )

        raw = await self._generate(prompt, model=config.GEMINI_MODEL_GENERIC)

        try:
            return json.loads(raw)
        except Exception:
            subj = f"Khuyến mãi: {context.get('product','Sản phẩm mới')} đang giảm giá!"
            return {"subject": subj, "body": raw.strip()[:1000]}
    async def suggest_marketing_campaign(
        self,
        customer_data: List[Dict[str, Any]],
        product_data: Optional[List[Dict[str, Any]]] = None,
        topic: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Đề xuất 1 chiến dịch marketing chi tiết (JSON hợp lệ).
        Trả về dict có các trường: name, channel, budget, start_date, end_date,
        expected_kpi {leads, cpl}, note, summary_report.
        """
        # Fallback khi Gemini chưa sẵn sàng
        if not self.enabled:
            return {
                "name": "Chiến dịch tháng 10 - Facebook Ads",
                "channel": "facebook",
                "budget": 15_000_000,
                "start_date": "2025-10-01",
                "end_date": "2025-10-31",
                "expected_kpi": {"leads": 2000, "cpl": 15000},
                "note": "Tập trung remarketing nhóm khách hàng nữ yêu thích serum dưỡng trắng.",
                "summary_report": "Chiến dịch nhằm tăng 25% đơn hàng Serum Vitamin C qua Facebook Ads + ưu đãi -20%.",
            }

        options = options or {}
        budget_min = options.get("budget_min")
        budget_max = options.get("budget_max")
        date_from  = options.get("date_from")   # "YYYY-MM-DD"
        date_to    = options.get("date_to")     # "YYYY-MM-DD"
        preferred_channels = options.get("preferred_channels")  # e.g. ["facebook","tiktok","email"]

        constraints = []
        if budget_min is not None:
            constraints.append(f"- Ngân sách tối thiểu: {int(budget_min)} VND.")
        if budget_max is not None:
            constraints.append(f"- Ngân sách tối đa: {int(budget_max)} VND.")
        if date_from and date_to:
            constraints.append(f"- Thời gian triển khai trong khoảng: {date_from} → {date_to}.")
        if preferred_channels:
            constraints.append(f"- Ưu tiên kênh: {', '.join(preferred_channels)}.")

        # Xây prompt chặt chẽ
        prompt_parts = []
        prompt_parts.append(
            "Bạn là chuyên gia marketing cho thương hiệu mỹ phẩm B2C.\n"
            "Hãy đề xuất **một** chiến dịch marketing chi tiết dựa trên dữ liệu dưới đây. Dự đoán kênh sẽ được quan tâm nhất và dựa trên các xu hướng hiện tại trên thị trường"
        )
        if topic:
            prompt_parts.append(f"🎯 Chủ đề chiến dịch: {topic}")

        prompt_parts.append("📊 Dữ liệu khách hàng:")
        prompt_parts.append(json.dumps(customer_data, ensure_ascii=False, indent=2))

        if product_data:
            prompt_parts.append("🛍️ Dữ liệu sản phẩm:")
            prompt_parts.append(json.dumps(product_data, ensure_ascii=False, indent=2))

        if constraints:
            prompt_parts.append("Ràng buộc:")
            prompt_parts.extend(constraints)

        prompt_parts.append(
            "YÊU CẦU XUẤT RA:\n"
            "- Trả về **DUY NHẤT MỘT** đối tượng JSON **hợp lệ** theo cấu trúc **chính xác** sau.\n"
            "- Không thêm bất kỳ văn bản nào ngoài JSON (không preface, không giải thích, không Markdown).\n"
            "- Dùng dấu ngoặc kép đôi cho tất cả khóa/chuỗi; ngày theo định dạng ISO (YYYY-MM-DD);\n"
            "  các trường số tiền (budget, cpl) là số nguyên VND (không dấu phẩy, không ký tự)."
        )

        schema_example = {
            "name": "<tên chiến dịch>",
            "channel": "<kênh quảng cáo: facebook | tiktok | instagram | email | zalo | google_ads>",
            "budget": 15000000,
            "start_date": "2025-10-01",
            "end_date": "2025-10-31",
            "expected_kpi": {"leads": 2000, "cpl": 15000},
            "note": "<ghi chú ngắn gọn, 1-2 câu>",
            "summary_report": "<tóm tắt 2-4 câu về mục tiêu & cách triển khai và liệt kê các sản phẩm nên được chạy trong chiến dịch>",
            "recommended_products": [
                    {
                        "name": "<tên sản phẩm>",
                        "category": "<loại sản phẩm>",
                        "reason": "<lý do được chọn>"
                    }
        ]
        }
        prompt_parts.append("Cấu trúc JSON bắt buộc (chỉ là ví dụ cấu trúc, không cần lặp lại văn bản này):")
        prompt_parts.append(json.dumps(schema_example, ensure_ascii=False, indent=2))

        prompt_parts.append("⚠️ Chỉ trả về JSON hợp lệ. Không thêm bất cứ thứ gì khác ngoài JSON.")

        prompt = "\n\n".join(prompt_parts)

        raw = await self._generate(prompt, model=config.GEMINI_MODEL_GENERIC)

        # Parse JSON an toàn
        try:
            return json.loads(raw)
        except Exception:
            # Thử tách JSON nếu model lỡ kèm text (phòng hờ)
            import re
            m = re.search(r"\{.*\}", raw, flags=re.DOTALL)
            if m:
                try:
                    return json.loads(m.group(0))
                except Exception:
                    pass
            # Fallback cuối
            return {
                "name": "Chiến dịch tự động",
                "channel": (preferred_channels[0] if isinstance(preferred_channels, list) and preferred_channels else "facebook"),
                "budget": int(budget_min) if isinstance(budget_min, (int, float)) else 10_000_000,
                "start_date": date_from or "2025-10-01",
                "end_date": date_to or "2025-10-31",
                "expected_kpi": {"leads": 1000, "cpl": 10000},
                "note": "AI trả về text không hợp lệ, dùng fallback theo ràng buộc.",
                "summary_report": (raw or "")[:300]
            }
    async def predict_lead_expected_value(
        self,
        lead: Dict[str, Any],
        interested_products: List[Dict[str, Any]],
        interactions: Optional[List[Dict[str, Any]]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dự đoán tổng giá trị kỳ vọng (EV) mà lead sẽ mang lại dựa trên sản phẩm quan tâm.
        """
        options = options or {}
        currency = options.get("currency", "VND")
        horizon_days = int(options.get("horizon_days", 30))
        repeat_rate = float(options.get("repeat_rate", 0.10))
        min_interest_score = float(options.get("min_interest_score", 0.0))
        optimize_for = options.get("optimize_for", "revenue")  # hoặc "margin"

        # --------- FALLBACK (Rule-based) ---------
        if not self.enabled:
            lead_conv = float(lead.get("conversion_prob") or 0.12)

            # Hiệu chỉnh từ lead_score (nếu có): +1% xác suất cho mỗi 10 điểm, capped ±30%
            lead_score = float(lead.get("lead_score") or 0)
            score_factor = max(0.7, min(1.3, 1.0 + (lead_score - 50.0) / 500.0))

            # Hiệu chỉnh tương tác gần đây (nếu có)
            recency_factor = 1.0
            if interactions:
                latest_ts = None
                for it in interactions:
                    t = it.get("occurred_at")
                    if isinstance(t, str):
                        try:
                            t = datetime.fromisoformat(t.replace("Z", "+00:00"))
                        except Exception:
                            t = None
                    if isinstance(t, datetime):
                        latest_ts = max(latest_ts or t, t)
                if latest_ts:
                    days = (datetime.now(timezone.utc) - latest_ts.astimezone(timezone.utc)).days
                    if days <= 7:
                        recency_factor = 1.10
                    elif days <= 14:
                        recency_factor = 1.05

            base_prob = max(0.01, min(0.8, lead_conv * score_factor * recency_factor))

            breakdown = []
            total_ev = 0.0
            total_margin = 0.0

            for p in (interested_products or []):
                price = float(p.get("price") or 0)
                if price <= 0:
                    continue
                interest = float(p.get("interest_score") or 0.5)
                if interest < min_interest_score:
                    continue

                category = (p.get("category") or "").lower()
                cat_factor = 1.0
                if category in {"serum", "treatment"}:
                    cat_factor = 1.05
                elif category in {"makeup"}:
                    cat_factor = 0.95

                adjusted_prob = max(0.01, min(0.95, base_prob * (0.6 + 0.8 * interest) * cat_factor))

                expected_orders = 1.0 * adjusted_prob * (1.0 + repeat_rate)

                expected_value = price * expected_orders
                margin_rate = float(p.get("margin_rate")) if p.get("margin_rate") is not None else 0.4
                expected_margin = expected_value * margin_rate

                breakdown.append({
                    "product_id": p.get("product_id"),
                    "name": p.get("name"),
                    "price": int(price),
                    "base_prob": round(base_prob, 3),
                    "adjusted_prob": round(adjusted_prob, 3),
                    "expected_orders": round(expected_orders, 3),
                    "expected_value": round(expected_value, 2),
                    "expected_margin": round(expected_margin, 2),
                    "reason": f"interest={interest}, cat_factor={cat_factor}"
                })

                total_ev += expected_value
                total_margin += expected_margin

            result: Dict[str, Any] = {
                "lead_id": lead.get("lead_id"),
                "currency": currency,
                "horizon_days": horizon_days,
                "assumptions": {
                    "base_conversion_prob": round(base_prob, 3),
                    "repeat_rate": repeat_rate,
                    "min_interest_score": min_interest_score,
                    "optimize_for": optimize_for
                },
                "breakdown": breakdown,
                "expected_total_value": round(total_ev, 2),
                "generated_at": datetime.utcnow().replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "note": "EV = price * adjusted_prob * (1 + repeat_rate)"
            }
            if optimize_for == "margin":
                result["expected_total_margin"] = round(total_margin, 2)
            return result

        # --------- LLM MODE (self.enabled=True) ----------
        constraints = [
            f'- Tiền tệ: {currency}',
            f'- Horizon dự báo (ngày): {horizon_days}',
            f'- Repeat rate: {repeat_rate}',
            f'- Lọc sản phẩm có interest_score >= {min_interest_score}',
            f'- Tối ưu theo: {optimize_for}',
        ]

        prompt_parts = []
        prompt_parts.append(
            "Bạn là chuyên gia phân tích doanh thu. Hãy ước tính **giá trị kỳ vọng** (expected value) một lead mang lại "
            "trong khoảng thời gian chỉ định, dựa trên sản phẩm mà lead quan tâm. Chỉ trả về JSON hợp lệ."
        )
        prompt_parts.append("📇 Lead:")
        prompt_parts.append(json.dumps(lead, ensure_ascii=False, indent=2))
        if interactions:
            prompt_parts.append("🗒️ Interactions gần đây:")
            prompt_parts.append(json.dumps(interactions, ensure_ascii=False, indent=2))
        prompt_parts.append("🛍️ Sản phẩm quan tâm:")
        prompt_parts.append(json.dumps(interested_products, ensure_ascii=False, indent=2))
        prompt_parts.append("Ràng buộc & tham số:")
        prompt_parts.extend(constraints)

        schema_example = {
            "lead_id": "<uuid>",
            "currency": "VND",
            "horizon_days": 30,
            "assumptions": {
                "base_conversion_prob": 0.18,
                "repeat_rate": 0.15,
                "min_interest_score": 0.2,
                "optimize_for": "revenue"
            },
            "breakdown": [
                {
                    "product_id": "<id>",
                    "name": "<tên>",
                    "price": 390000,
                    "base_prob": 0.15,
                    "adjusted_prob": 0.21,
                    "expected_orders": 1.1,
                    "expected_value": 429000.0,
                    "expected_margin": 171600.0,
                    "reason": "<ngắn gọn>"
                }
            ],
            "expected_total_value": 1200000.0,
            "expected_total_margin": 520000.0,
            "generated_at": "2025-10-25T02:20:00Z",
            "note": "EV = price * adjusted_prob * (1 + repeat_rate)"
        }

        prompt_parts.append(
            "YÊU CẦU XUẤT RA:\n"
            "- Chỉ trả về MỘT đối tượng JSON hợp lệ theo cấu trúc mẫu dưới đây (có thể thay số liệu).\n"
            "- Không thêm text ngoài JSON, không markdown."
        )
        prompt_parts.append(json.dumps(schema_example, ensure_ascii=False, indent=2))
        prompt = "\n\n".join(prompt_parts)

        raw = await self._generate(prompt, model=getattr(config, "GEMINI_MODEL_GENERIC", "gemini-1.5-flash"))

        try:
            return json.loads(raw)
        except Exception:
            import re
            m = re.search(r"\{.*\}", raw or "", flags=re.DOTALL)
            if m:
                try:
                    return json.loads(m.group(0))
                except Exception:
                    pass
            # Fallback cuối (nếu LLM trả về không hợp lệ): gọi lại chính nhánh rule-based
            self.enabled = False
            return await self.predict_lead_expected_value(
                lead, interested_products, interactions, options
            )

        # --------- LLM MODE (self.enabled=True) ----------
        constraints = []
        constraints.append(f'- Tiền tệ: {currency}')
        constraints.append(f'- Horizon dự báo (ngày): {horizon_days}')
        constraints.append(f'- Repeat rate: {repeat_rate}')
        constraints.append(f'- Lọc sản phẩm có interest_score >= {min_interest_score}')
        constraints.append(f'- Tối ưu theo: {optimize_for}')

        prompt_parts = []
        prompt_parts.append(
            "Bạn là chuyên gia phân tích doanh thu. Hãy ước tính **giá trị kỳ vọng** (expected value) một lead mang lại "
            "trong khoảng thời gian chỉ định, dựa trên sản phẩm mà lead quan tâm. Chỉ trả về JSON hợp lệ."
        )
        prompt_parts.append("📇 Lead:")
        prompt_parts.append(json.dumps(lead, ensure_ascii=False, indent=2))
        if interactions:
            prompt_parts.append("🗒️ Interactions gần đây:")
            prompt_parts.append(json.dumps(interactions, ensure_ascii=False, indent=2))
        prompt_parts.append("🛍️ Sản phẩm quan tâm:")
        prompt_parts.append(json.dumps(interested_products, ensure_ascii=False, indent=2))
        prompt_parts.append("Ràng buộc & tham số:")
        prompt_parts.extend(constraints)

        schema_example = {
            "lead_id": "<uuid>",
            "currency": "VND",
            "horizon_days": 30,
            "assumptions": {
                "base_conversion_prob": 0.18,
                "repeat_rate": 0.15,
                "min_interest_score": 0.2,
                "optimize_for": "revenue"
            },
            "breakdown": [
                {
                    "product_id": "<id>",
                    "name": "<tên>",
                    "price": 390000,
                    "base_prob": 0.15,
                    "adjusted_prob": 0.21,
                    "expected_orders": 1.1,
                    "expected_value": 429000.0,
                    "expected_margin": 171600.0,
                    "reason": "<ngắn gọn>"
                }
            ],
            "expected_total_value": 1200000.0,
            "expected_total_margin": 520000.0,
            "generated_at": "2025-10-25T02:20:00Z",
            "note": "EV = price * adjusted_prob * (1 + repeat_rate)"
        }

        prompt_parts.append(
            "YÊU CẦU XUẤT RA:\n"
            "- Chỉ trả về MỘT đối tượng JSON hợp lệ theo cấu trúc mẫu dưới đây (có thể thay số liệu).\n"
            "- Không thêm text ngoài JSON, không markdown."
        )
        prompt_parts.append(json.dumps(schema_example, ensure_ascii=False, indent=2))
        prompt = "\n\n".join(prompt_parts)

        raw = await self._generate(prompt, model="your-generic-llm-id")

        try:
            return json.loads(raw)
        except Exception:
            import re
            m = re.search(r"\{.*\}", raw, flags=re.DOTALL)
            if m:
                try:
                    return json.loads(m.group(0))
                except Exception:
                    pass
            # Fallback cuối (nếu LLM trả về không hợp lệ): gọi lại chính nhánh rule-based
            self.enabled = False
            return await self.predict_lead_expected_value(
                lead, interested_products, interactions, options
            )
        
    # ----------------- Core Gemini Call -----------------
    async def _generate(self, prompt: str, model: str) -> str:
        """
        Gọi tới API Gemini để sinh nội dung.
        """
        if not self.enabled:
            return ""

        def _call():
            gen_model = genai.GenerativeModel(model)
            response = gen_model.generate_content(prompt)
            if hasattr(response, "text") and response.text:
                return response.text.strip()
            elif hasattr(response, "candidates") and response.candidates:
                return response.candidates[0].content.parts[0].text
            else:
                return ""
        return await asyncio.get_event_loop().run_in_executor(None, _call)
