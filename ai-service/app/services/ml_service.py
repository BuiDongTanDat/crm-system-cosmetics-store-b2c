# app/services/ml_service.py
from __future__ import annotations
from typing import Any, Dict, List, Optional

import numpy as np

from app.services.model_store import model_store


class MLService:
    """
    Service chứa các hàm dùng model ML cổ điển (sklearn/xgboost/...) để predict.
    Ví dụ: lead conversion, churn, CLV, forecast...
    """

    def __init__(self):
        # Nếu cần preload model thì gọi ở đây
        # model_store.get("lead_conversion_xgb")
        pass

    # ---------- Lead Conversion / Lead Score ----------
    def _build_lead_feature_vector(self, lead: Dict[str, Any]) -> List[float]:
        """
        Chuyển dict lead -> vector features theo đúng thứ tự đã dùng khi train model.
        Bạn CẦN align đúng với code training bên Python (offline).
        Ví dụ đơn giản demo:
        """
        source = (lead.get("source") or "").lower()
        status = (lead.get("status") or "").lower()
        score = float(lead.get("lead_score") or 0)
        interactions = int(lead.get("interactions_count") or 0)

        # one-hot nguồn lead (ví dụ)
        src_referral = 1.0 if source in ("referral", "partner") else 0.0
        src_ads = 1.0 if source in ("ads", "facebook_ads", "google_ads") else 0.0
        src_website = 1.0 if source in ("website", "landing_page") else 0.0

        status_new = 1.0 if status == "new" else 0.0
        status_engaged = 1.0 if status == "engaged" else 0.0

        return [
            score,
            interactions,
            src_referral,
            src_ads,
            src_website,
            status_new,
            status_engaged,
        ]

    def predict_lead_conversion(
        self,
        lead: Dict[str, Any],
        *,
        model_name: str = "lead_conversion_xgb",
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dùng model ML để dự đoán xác suất lead trở thành khách.
        Return: { probability, raw_score, model_name, model_version }
        """
        model = model_store.get(model_name, model_version)
        x = self._build_lead_feature_vector(lead)
        X = np.array([x], dtype=float)

        # Nếu dùng sklearn/xgboost:
        if hasattr(model, "predict_proba"):
            proba = float(model.predict_proba(X)[0, 1])
            raw_score = float(model.predict(X)[0])
        else:
            # Tuỳ loại model, fallback:
            raw_score = float(model.predict(X)[0])
            proba = 1.0 / (1.0 + np.exp(-raw_score))  # logistic

        proba = max(0.0, min(1.0, proba))

        return {
            "probability": proba,
            "raw_score": raw_score,
            "model_name": model_name,
            "model_version": model_version or "default",
        }
