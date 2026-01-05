import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app import config

# ---------- Optional Gemini ----------
import os
try:
    import google.generativeai as genai
    _GEMINI_AVAILABLE = True
except Exception:
    genai = None
    _GEMINI_AVAILABLE = False
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ==============================
# Heuristic (Rule-based)
# ==============================
class HeuristicAnalyzer:
    """Rule-based scoring 0..100 cho lead."""

    def score_lead(self, lead: Dict[str, Any]) -> Tuple[int, str]:
        score = 0
        reasons: List[str] = []

        source = (lead.get("source") or "").lower()
        if source in ("referral", "partner"):
            score += 25
            reasons.append(f"source={source}+25")
        elif source in ("ads", "website"):
            score += 10
            reasons.append(f"source={source}+10")

        status = (lead.get("status") or "").lower()
        if status == "engaged":
            score += 20
            reasons.append("status=engaged+20")
        elif status == "new":
            score += 5
            reasons.append("status=new+5")

        if lead.get("email"):
            score += 10
            reasons.append("email+10")
        if lead.get("phone"):
            score += 10
            reasons.append("phone+10")

        interactions = lead.get("interactions") or []
        page_views = sum(1 for it in interactions if it.get("type") == "page_view")
        email_clicks = sum(1 for it in interactions if it.get("type") == "email_click")
        if page_views:
            add = min(page_views * 2, 10)
            score += add
            reasons.append(f"page_views*2={add}")
        if email_clicks:
            add = min(email_clicks * 5, 20)
            score += add
            reasons.append(f"email_clicks*5={add}")

        score = max(0, min(score, 100))
        return score, "; ".join(reasons) if reasons else "baseline"


# ==============================
# Hybrid Scorer (LLM + Fallback)
# ==============================
class HybridLeadScorer:
    """
    Gọi LLM để chấm lead (fit_score + intent score + dự báo) theo schema chuẩn.
    Fallback về HeuristicAnalyzer nếu LLM tắt hoặc trả kết quả không hợp lệ.
    """

    def __init__(self, llm_service: "LLMService", heuristic: Optional[HeuristicAnalyzer] = None):
        self.llm = llm_service
        self.heur = heuristic or HeuristicAnalyzer()

    async def score(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trả về dict:
        { fit_score, score, priority_suggestion, predicted_prob,
          predicted_value, predicted_value_currency, reason, confidence,
          features_used, next_best_action }
        """
        # ---- LLM mode ----
        if getattr(self.llm, "enabled", False):
            prompt = self._build_prompt(lead)
            raw = await self.llm._generate(prompt, model=self.llm.model_scoring)
            data = _parse_json_only(raw)
            if data is not None:
                return self._coerce_schema(data, lead)
            # nếu LLM trả không hợp lệ -> fallback

        # ---- Fallback Heuristic ----
        score, reason = self.heur.score_lead(lead)
        fit_score = 70 if (lead.get("source") or "").lower() in ("referral", "partner") else 45
        predicted_prob = round(min(0.8, max(0.05, 0.4 * score / 100 + 0.6 * fit_score / 100)), 3)
        return {
            "fit_score": int(max(0, min(100, fit_score))),
            "score": int(score),
            "priority_suggestion": self._priority_from_score(score),
            "predicted_prob": float(predicted_prob),
            "predicted_value": 0.0,
            "predicted_value_currency": "VND",
            "reason": reason or "baseline",
            "confidence": 0.5,
            "features_used": {},
            "next_best_action": "follow_up",
        }

    # ---------- helpers ----------
    def _priority_from_score(self, s: float) -> str:
        s = float(s or 0)
        if s >= 80:
            return "urgent"
        if s >= 60:
            return "high"
        if s >= 30:
            return "medium"
        return "low"

    def _coerce_schema(self, d: Dict[str, Any], lead: Dict[str, Any]) -> Dict[str, Any]:
        def num(x, fb=0.0):
            try:
                return float(x)
            except Exception:
                return fb

        out = {
            "fit_score": int(max(0, min(100, num(d.get("fit_score"), 0)))),
            "score": int(max(0, min(100, num(d.get("score"), 0)))),
            "priority_suggestion": (d.get("priority_suggestion") or "").lower() or "medium",
            "predicted_prob": float(max(0.0, min(1.0, num(d.get("predicted_prob"), 0.2)))),
            "predicted_value": float(max(0.0, num(d.get("predicted_value"), 0.0))),
            "predicted_value_currency": d.get("predicted_value_currency") or "VND",
            "reason": d.get("reason") or "",
            "confidence": float(max(0.0, min(1.0, num(d.get("confidence"), 0.6)))),
            "features_used": d.get("features_used")
            or {
                "source": (lead.get("source") or "").lower(),
                "email_domain": ((lead.get("email") or "").split("@")[-1] if lead.get("email") else None),
            },
            "next_best_action": d.get("next_best_action") or None,
        }
        if out["priority_suggestion"] not in ("low", "medium", "high", "urgent"):
            out["priority_suggestion"] = self._priority_from_score(out["score"])
        return out

    def _build_prompt(self, lead: Dict[str, Any]) -> str:
        schema = {
            "fit_score": 70,
            "score": 55,
            "priority_suggestion": "high",
            "predicted_prob": 0.35,
            "predicted_value": 500000,
            "predicted_value_currency": "VND",
            "reason": "nguồn referral, có email/phone, đã click email",
            "confidence": 0.7,
            "features_used": {"source": (lead.get("source") or "").lower()},
            "next_best_action": "call_back",
        }
        parts: List[str] = []
        parts.append(
            "Bạn là hệ thống chấm điểm lead cho CRM mỹ phẩm. "
            "Hãy phân tích lead và trả về MỘT đối tượng JSON **hợp lệ** theo schema sau (không thêm chữ nào ngoài JSON)."
        )
        parts.append("Lead JSON:")
        parts.append(json.dumps(lead, ensure_ascii=False, indent=2))
        parts.append("Schema mẫu (giá trị minh họa, hãy thay bằng kết quả của bạn):")
        parts.append(json.dumps(schema, ensure_ascii=False, indent=2))
        parts.append(
            "YÊU CẦU:\n"
            "- fit_score và score ∈ [0,100]\n"
            "- predicted_prob ∈ [0,1]\n"
            "- priority_suggestion ∈ {'low','medium','high','urgent'}\n"
            "- Chỉ trả về JSON hợp lệ, không markdown, không giải thích."
        )
        return "\n\n".join(parts)


# ==============================
# LLM Service (public API)
# ==============================
class LLMService:
    def __init__(self):
        self.enabled = bool(getattr(config, "GEMINI_API_KEY", None) and _GEMINI_AVAILABLE)
        self.model_scoring = getattr(
            config, "GEMINI_MODEL_SCORING", getattr(config, "GEMINI_MODEL_GENERIC", "gemini-1.5-flash")
        )

        if self.enabled:
            print("[LLM] ✅ Gemini enabled with model:", self.model_scoring)
            genai.configure(api_key=config.GEMINI_API_KEY)  # type: ignore
        else:
            print("[LLM] ⚠️ Gemini disabled (missing API key or SDK).")

        self.scorer = HybridLeadScorer(self)

    async def score_lead(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        """Điểm vào chính để Node gọi: trả về schema thống nhất."""
        return await self.scorer.score(lead)

    # ----------------- Generate Email -----------------
    async def generate_email_content(
        self,
        context: Dict[str, Any],
        purpose: str = "promotion",
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        """Sinh nội dung email gồm {subject, body} dựa trên ngữ cảnh action."""
        if not self.enabled:
            return {
                "subject": f"[{context.get('campaign', 'Thông báo')}] {context.get('product', 'Sản phẩm mới')} của bạn",
                "body": (
                    f"Xin chào {context.get('name', 'bạn')},\n\n"
                    f"Chúng tôi xin giới thiệu {context.get('product', 'sản phẩm mới')}."
                    f" Hãy ghé cửa hàng để nhận ưu đãi {context.get('offer', 'đặc biệt')}!\n\n"
                    "Thân mến,\nĐội ngũ chăm sóc khách hàng."
                ),
            }

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

        raw = await self._generate(prompt, model=getattr(config, "GEMINI_MODEL_GENERIC", self.model_scoring))
        data = _parse_json_only(raw)
        if isinstance(data, dict) and "subject" in data and "body" in data:
            return data

        subj = f"Khuyến mãi: {context.get('product', 'Sản phẩm mới')} đang giảm giá!"
        return {"subject": subj, "body": (raw or "").strip()[:1000]}

    # ----------------- Campaign Suggestion -----------------
    async def suggest_marketing_campaign(
        self,
        customer_data: List[Dict[str, Any]],
        product_data: Optional[List[Dict[str, Any]]] ,
        topic: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Đề xuất 1 chiến dịch marketing chi tiết (JSON hợp lệ).
        Trả về dict có các trường: name, channel, budget, start_date, end_date,
        expected_kpi {leads, cpl}, note, summary_report, recommended_products[].
        """
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
        date_from = options.get("date_from")
        date_to = options.get("date_to")
        preferred_channels = options.get("preferred_channels")

        constraints: List[str] = []
        if budget_min is not None:
            constraints.append(f"- Ngân sách tối thiểu: {int(budget_min)} VND.")
        if budget_max is not None:
            constraints.append(f"- Ngân sách tối đa: {int(budget_max)} VND.")
        if date_from and date_to:
            constraints.append(f"- Thời gian triển khai trong khoảng: {date_from} → {date_to}.")
        if preferred_channels:
            constraints.append(f"- Ưu tiên kênh: {', '.join(preferred_channels)}.")

        prompt_parts: List[str] = []
        prompt_parts.append(
            "Bạn là chuyên gia marketing cho thương hiệu mỹ phẩm B2C.\n"
            "Hãy đề xuất **một** chiến dịch marketing chi tiết dựa trên dữ liệu dưới đây."
        )
        if topic:
            prompt_parts.append(f" Chủ đề chiến dịch: {topic}")
            prompt_parts.append("Dữ liệu khách hàng:")
            prompt_parts.append(json.dumps(customer_data, ensure_ascii=False, indent=2))
        if product_data:
            prompt_parts.append("Dữ liệu sản phẩm:")
            prompt_parts.append(json.dumps(product_data, ensure_ascii=False, indent=2))
        if constraints:
            prompt_parts.append("Ràng buộc:")
            prompt_parts.extend(constraints)
        schema_example = {
            "name": "<tên chiến dịch>",
            "channel": "<facebook|tiktok|instagram|email|zalo|google_ads>",
            "budget": 15000000,
            "start_date": "2025-10-01",
            "end_date": "2025-10-31",
            "expected_kpi": {"leads": 2000, "cpl": 15000},
            "note": "<ghi chú ngắn gọn>",
            "summary_report": "<tóm tắt 2-4 câu>",
            "recommended_products": [
                {
                    "product_id": "<ID trong product_data>",  
                    "name": "<tên đúng trong product_data>", 
                    "category": "<loại đúng trong product_data>",  
                    "price_current": 249000,
                    "reason": "<lý do ngắn>",
                }
            ],
            "target_filter": {
                "gender": "female",
                 "age": {
                "max": 40,
                "min": 18},
                "interests": ["serum", "dưỡng ẩm"],
                "note": "…",
            },
            "data_source": "Products",
        }

        prompt_parts.append(
            "QUY TẮC RẤT QUAN TRỌNG:\n"
            "- recommended_products CHỈ được lấy từ danh sách product_data cung cấp.\n"
            "- Phải điền đúng product_id và name khớp trong product_data. Nếu không chắc, bỏ qua.\n"
            "- Không phát minh tên sản phẩm mới, không tự tạo gói quà tặng.\n"
        )
        prompt_parts.append(
            "YÊU CẦU XUẤT RA:\n"
            "- Trả về **DUY NHẤT MỘT** đối tượng JSON **hợp lệ** theo cấu trúc **chính xác** sau.\n"
            "- Không thêm bất kỳ văn bản nào ngoài JSON."
        )
        prompt_parts.append(json.dumps(schema_example, ensure_ascii=False, indent=2))
        prompt_parts.append("⚠️ Chỉ trả về JSON hợp lệ. Không thêm bất cứ thứ gì khác ngoài JSON.")
        prompt = "\n\n".join(prompt_parts)

        # ---- LLM call & parse ----
        raw = await self._generate(prompt, model=getattr(config, "GEMINI_MODEL_GENERIC", self.model_scoring))
        data: Dict[str, Any] = _parse_json_only(raw) or {}

        # ---- Validate & normalize ----
        # Chuẩn hoá trường cơ bản
        data["name"] = data.get("name") or "Chiến dịch tự động"
        data["channel"] = (data.get("channel") or "facebook").lower().strip()
        data["budget"] = int(data.get("budget") or (budget_min or 10_000_000))
        data["start_date"] = data.get("start_date") or (date_from or "2025-10-01")
        data["end_date"] = data.get("end_date") or (date_to or "2025-10-31")
        data["expected_kpi"] = data.get("expected_kpi") or {"leads": 1000, "cpl": 10000}
        data["note"] = data.get("note") or ""
        data["summary_report"] = data.get("summary_report") or (raw or "")[:300]
        data["data_source"] = data.get("data_source") or "Products"
        if "target_filter" not in data or not isinstance(data["target_filter"], dict):
            data["target_filter"] = {"note": topic or "Chưa xác định"}

        recommended = data.get("recommended_products")
        if product_data and isinstance(recommended, list):
            id_map = {str(p.get("product_id")): p for p in product_data if p.get("product_id")}
            name_map = {str(p.get("name", "")).strip().lower(): p for p in product_data if p.get("name")}
            validated: List[Dict[str, Any]] = []
            seen_ids: set = set()

            for rp in recommended:
                if not isinstance(rp, dict):
                    continue

                pid = rp.get("product_id")
                pname_norm = str(rp.get("name", "")).strip().lower()

                src = id_map.get(str(pid)) if pid is not None else None
                if src is None and pname_norm:
                    src = name_map.get(pname_norm)
                if not src:
                    continue  
                fixed = {
                    "product_id": src.get("product_id"),
                    "name": src.get("name"),
                    "category": src.get("category"),
                    "price_current": rp.get("price_current") or src.get("price_current"),
                    "reason": rp.get("reason") or "Được chọn từ catalog do phù hợp campaign.",
                }

                if fixed["product_id"] in seen_ids:
                    continue
                seen_ids.add(fixed["product_id"])
                validated.append(fixed)
            data["recommended_products"] = validated
        if product_data and not data.get("recommended_products"):
            def score(p: Dict[str, Any]) -> tuple:
                disc = float(p.get("discount_percent") or 0)
                rating = float(p.get("rating") or 0)
                return (disc, rating, -(float(p.get("price_current") or 0)))
            top_n = sorted(product_data, key=score, reverse=True)[:3]
            data["recommended_products"] = [
                {
                    "product_id": p.get("product_id"),
                    "name": p.get("name"),
                    "category": p.get("category"),
                    "price_current": p.get("price_current"),
                    "reason": "Chọn từ catalog theo ưu đãi/đánh giá cao.",
                }
                for p in top_n
            ]
        return self._normalize_campaign_response(data, topic)

    def _normalize_campaign_response(self, data: Dict[str, Any], topic: Optional[str]) -> Dict[str, Any]:
        """Chuẩn hoá dữ liệu output của AI để khớp schema Pydantic."""
        # 1. KPI
        kpi = data.get("expected_kpi")
        if not isinstance(kpi, dict):
            kpi = {"leads": 1000, "cpl": 10000}
        
        # Ensure correct types for KPI
        def safe_int(x, default=0):
            try: return int(x)
            except: return default
            
        data["expected_kpi"] = {
            "leads": safe_int(kpi.get("leads"), 1000),
            "cpl": safe_int(kpi.get("cpl"), 10000)
        }

        # 2. Target Filter
        tf = data.get("target_filter")
        if not isinstance(tf, dict):
            # Nếu AI quên target_filter, tạo mặc định
            tf = {"note": topic or "Chưa xác định"}
        
        # Normalize Age: "18-25" -> {min: 18, max: 25}
        age = tf.get("age")
        if isinstance(age, str):
            # Simple heuristics for "18-25" or "18 - 25"
            try:
                parts = age.replace(" ", "").split("-")
                if len(parts) == 2:
                    tf["age"] = {"min": int(parts[0]), "max": int(parts[1])}
                else:
                    tf["age"] = None # Invalid string format
            except:
                tf["age"] = None
        elif not isinstance(age, dict):
            tf["age"] = None
            
        # Normalize Gender
        if "gender" in tf and tf["gender"] and not isinstance(tf["gender"], (str, list)):
            tf["gender"] = str(tf["gender"]) # Fallback to string

        data["target_filter"] = tf

        return data

    # ----------------- Expected Value -----------------
    async def predict_lead_expected_value(
        self,
        lead: Dict[str, Any],
        interested_products: List[Dict[str, Any]],
        interactions: Optional[List[Dict[str, Any]]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Dự đoán tổng giá trị kỳ vọng (EV) mà lead sẽ mang lại dựa trên sản phẩm quan tâm."""
        options = options or {}
        currency = options.get("currency", "VND")
        horizon_days = int(options.get("horizon_days", 30))
        repeat_rate = float(options.get("repeat_rate", 0.10))
        min_interest_score = float(options.get("min_interest_score", 0.0))
        optimize_for = options.get("optimize_for", "revenue")

        # --------- FALLBACK (Rule-based) ---------
        if not self.enabled:
            return _rule_based_ev(
                lead=lead,
                interested_products=interested_products,
                interactions=interactions,
                currency=currency,
                horizon_days=horizon_days,
                repeat_rate=repeat_rate,
                min_interest_score=min_interest_score,
                optimize_for=optimize_for,
            )

        # --------- LLM MODE ----------
        constraints = [
            f"- Tiền tệ: {currency}",
            f"- Horizon dự báo (ngày): {horizon_days}",
            f"- Repeat rate: {repeat_rate}",
            f"- Lọc sản phẩm có interest_score >= {min_interest_score}",
            f"- Tối ưu theo: {optimize_for}",
        ]

        prompt_parts: List[str] = []
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
                "optimize_for": "revenue",
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
                    "reason": "<ngắn gọn>",
                }
            ],
            "expected_total_value": 1200000.0,
            "expected_total_margin": 520000.0,
            "generated_at": "2025-10-25T02:20:00Z",
            "note": "EV = price * adjusted_prob * (1 + repeat_rate)",
        }

        prompt_parts.append(
            "YÊU CẦU XUẤT RA:\n"
            "- Chỉ trả về MỘT đối tượng JSON hợp lệ theo cấu trúc mẫu dưới đây (có thể thay số liệu).\n"
            "- Không thêm text ngoài JSON, không markdown."
        )
        prompt_parts.append(json.dumps(schema_example, ensure_ascii=False, indent=2))
        prompt = "\n\n".join(prompt_parts)

        raw = await self._generate(prompt, model=getattr(config, "GEMINI_MODEL_GENERIC", self.model_scoring))
        data = _parse_json_only(raw)
        if isinstance(data, dict):
            return data

        # Fallback cuối cùng -> quay về rule-based
        self.enabled = False
        return await self.predict_lead_expected_value(lead, interested_products, interactions, options)

    # ----------------- Core Gemini Call -----------------
    async def _generate(self, prompt: str, model: str) -> str:
        """
        Gọi tới API Gemini để sinh nội dung.
        Trả về chuỗi (có thể là JSON hoặc có lẫn text).
        """
        if not self.enabled:
            return ""

        def _call() -> str:
            gen_model = genai.GenerativeModel(model)  # type: ignore
            response = gen_model.generate_content(prompt)
            if hasattr(response, "text") and response.text:
                return str(response.text).strip()
            if hasattr(response, "candidates") and response.candidates:
                part0 = response.candidates[0].content.parts[0]
                return getattr(part0, "text", "") or ""
            return ""

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call)


# ==============================
# Helpers
# ==============================
def _parse_json_only(raw: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Cố gắng parse JSON hợp lệ từ chuỗi raw (có thể lẫn text).
    Chỉ trả về dict nếu parse thành công, ngược lại trả None.
    """
    if not raw:
        return None
    raw = raw.strip()
    # Thử parse trực tiếp
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    # Thử tách phần {...}
    try:
        import re

        m = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if m:
            data = json.loads(m.group(0))
            if isinstance(data, dict):
                return data
    except Exception:
        pass
    return None


def _rule_based_ev(
    lead: Dict[str, Any],
    interested_products: List[Dict[str, Any]],
    interactions: Optional[List[Dict[str, Any]]],
    currency: str,
    horizon_days: int,
    repeat_rate: float,
    min_interest_score: float,
    optimize_for: str,
) -> Dict[str, Any]:
    """Fallback EV rule-based, tách riêng cho gọn."""
    lead_conv = float(lead.get("conversion_prob") or 0.12)

    # Hiệu chỉnh từ lead_score: +1% xác suất cho mỗi 10 điểm, capped ±30%
    lead_score = float(lead.get("lead_score") or 0)
    score_factor = max(0.7, min(1.3, 1.0 + (lead_score - 50.0) / 500.0))

    # Hiệu chỉnh tương tác gần đây
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

    breakdown: List[Dict[str, Any]] = []
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

        breakdown.append(
            {
                "product_id": p.get("product_id"),
                "name": p.get("name"),
                "price": int(price),
                "base_prob": round(base_prob, 3),
                "adjusted_prob": round(adjusted_prob, 3),
                "expected_orders": round(expected_orders, 3),
                "expected_value": round(expected_value, 2),
                "expected_margin": round(expected_margin, 2),
                "reason": f"interest={interest}, cat_factor={cat_factor}",
            }
        )

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
            "optimize_for": optimize_for,
        },
        "breakdown": breakdown,
        "expected_total_value": round(total_ev, 2),
        "generated_at": datetime.utcnow().replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "EV = price * adjusted_prob * (1 + repeat_rate)",
    }
    if optimize_for == "margin":
        result["expected_total_margin"] = round(total_margin, 2)
    return result
