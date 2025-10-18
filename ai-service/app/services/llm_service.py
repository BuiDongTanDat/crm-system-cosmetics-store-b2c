import asyncio
import json
from typing import Any, Dict, List, Optional
from app import config

try:
    import google.generativeai as genai  # pip install google-generativeai
    _GEMINI_AVAILABLE = True
except Exception:
    _GEMINI_AVAILABLE = False


class LLMService:
    def __init__(self):
        self.enabled = bool(config.GEMINI_API_KEY and _GEMINI_AVAILABLE)
        if self.enabled:
            genai.configure(api_key=config.GEMINI_API_KEY)

    # ----------------- Summary -----------------
    async def summarize(self, text: str, options: Dict[str, Any]) -> str:
        if not self.enabled:
            return (text[: config.MAX_SUMMARY_LEN] + "...") if len(text) > config.MAX_SUMMARY_LEN else text

        prompt = f"Tóm tắt ngắn gọn (3-5 câu) bằng tiếng Việt nội dung sau:\n\n{text}"
        return await self._generate(prompt, model=config.GEMINI_MODEL_SUMMARY)

    # ----------------- Classification -----------------
    async def classify(self, text: str, labels: List[str], options: Dict[str, Any]) -> Dict[str, Any]:
        if not self.enabled:
            return {"label": labels[0], "scores": {labels[0]: 1.0, **{l: 0.0 for l in labels[1:]}}}

        prompt = (
            f"Phân loại văn bản sau vào 1 trong các nhãn: {labels}.\n"
            f"Trả về JSON {{label, scores}} với scores là giá trị từ 0 đến 1.\n\n"
            f"Văn bản:\n{text}"
        )
        raw = await self._generate(prompt, model=config.GEMINI_MODEL_CLASSIFY)

        try:
            return json.loads(raw)
        except Exception:
            picked = labels[0]
            for lb in labels:
                if lb.lower() in raw.lower():
                    picked = lb
                    break
            return {"label": picked, "scores": {picked: 1.0}}

    # ----------------- Entity Extraction -----------------
    async def extract(self, text: str, schema: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
        if not self.enabled:
            return {}

        prompt = (
            "Trích xuất thông tin theo schema JSON từ văn bản sau. "
            "Trả về JSON hợp lệ.\n"
            f"Schema keys: {list(schema.keys()) if schema else 'tự suy luận'}\n"
            f"Văn bản:\n{text}"
        )
        raw = await self._generate(prompt, model=config.GEMINI_MODEL_GENERIC)
        try:
            return json.loads(raw)
        except Exception:
            return {"raw": raw}

    # ----------------- Lead Score Refinement -----------------
    async def refine_score(self, lead: Dict[str, Any], base_score: int, base_reason: Optional[str]) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        prompt = (
            "Bạn là chuyên gia sales. Dựa trên dữ liệu lead và điểm cơ sở, "
            "hãy trả về JSON {score (0-100), reason}.\n"
            f"Lead: {json.dumps(lead, ensure_ascii=False)}\n"
            f"Base score: {base_score}, Base reason: {base_reason}\n"
            "Nếu không thể cải thiện, trả về cùng score và reason."
        )
        raw = await self._generate(prompt, model=config.GEMINI_MODEL_GENERIC)
        try:
            return json.loads(raw)
        except Exception:
            return None
    async def estimate_conversion_prob(self, lead: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Trả về { 'probability': float trong [0,1], 'reason': str }
        """
        # Fallback khi không có API key/SDK
        if not self.enabled:
            # heuristic rất đơn giản để không chết luồng
            base = 0.2
            if (lead.get("email")): base += 0.1
            if (lead.get("phone")): base += 0.1
            if (lead.get("status", "").lower() == "engaged"): base += 0.2
            return {"probability": max(0.0, min(base, 1.0)), "reason": "heuristic fallback"}

        prompt = (
            "Bạn là chuyên gia phân tích tăng trưởng (growth analyst) và dữ liệu khách hàng (CRM data).\n"
            "Nhiệm vụ của bạn là ước lượng xác suất một lead sẽ chuyển đổi thành khách hàng trả tiền.\n\n"
            "Yêu cầu:\n"
            "- Trả về **JSON hợp lệ** có dạng:\n"
            "  {\"probability\": <float từ 0 đến 1>, \"reason\": <chuỗi ngắn gọn mô tả lý do>}.\n"
            "- Không trả văn bản tự do ngoài JSON.\n"
            "- Hãy dựa trên các yếu tố như: nguồn lead (source), ngành nghề (industry), mức độ tương tác (engagement), "
            "trạng thái hiện tại (status), thông tin liên hệ (email, phone), ngân sách (budget), và lịch sử tương tác (history).\n\n"
            f"Dữ liệu lead:\n{json.dumps(lead, ensure_ascii=False, indent=2)}\n\n"
            "Hãy suy luận hợp lý, đánh giá tổng thể, và chỉ xuất JSON kết quả cuối cùng."
)
        raw = await self._generate(prompt, model=config.GEMINI_MODEL_GENERIC)

        # Parse JSON an toàn
        try:
            data = json.loads(raw)
            prob = float(data.get("probability", 0.0))
            prob = max(0.0, min(prob, 1.0))
            return {"probability": prob, "reason": data.get("reason")}
        except Exception:
            # nếu model trả text tự do, cố gắng trích số 0..1
            import re
            m = re.search(r"([01](?:\.\d+)?)", raw)
            prob = float(m.group(1)) if m else 0.0
            prob = max(0.0, min(prob, 1.0))
            return {"probability": prob, "reason": raw[:200].strip() or "model-free-text"}
    # ----------------- Core Gemini Call -----------------
    async def _generate(self, prompt: str, model: str) -> str:
        def _call():
            gen_model = genai.GenerativeModel(model)
            response = gen_model.generate_content(prompt)
            return response.text.strip() if response.text else ""
        return await asyncio.get_event_loop().run_in_executor(None, _call)
    