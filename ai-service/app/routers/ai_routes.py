# app/routers/ai_routes.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Body, UploadFile, File, Form
from pydantic import BaseModel, Field, conlist
from typing import Any, Dict, Optional

import pandas as pd

from app.services.llm_service import LLMService
from app.services.ml_service import MLService
from app.schema.marketing import SuggestCampaignResponse

router = APIRouter(prefix="/v1", tags=["ai"])


# ---------- Shared Schemas ----------
class LeadPayload(BaseModel):
    lead: Dict[str, Any] = Field(default_factory=dict)
    options: Optional[Dict[str, Any]] = None


class SummarizeIn(BaseModel):
    text: str
    options: Optional[Dict[str, Any]] = None


class SummarizeOut(BaseModel):
    summary: str


class ClassifyIn(BaseModel):
    text: str
    labels: conlist(str, min_length=1)
    options: Optional[Dict[str, Any]] = None


class ClassifyOut(BaseModel):
    label: str
    scores: Dict[str, float]


class ExtractIn(BaseModel):
    text: str
    schema: Dict[str, Any] = Field(default_factory=dict)
    options: Optional[Dict[str, Any]] = None


class ExtractOut(BaseModel):
    entities: Dict[str, Any]


class GenEmailIn(BaseModel):
    input: Dict[str, Any] = Field(default_factory=dict)
    options: Optional[Dict[str, Any]] = None


class GenEmailOut(BaseModel):
    subject: str
    body: str


class ProbResponse(BaseModel):
    probability: float
    reason: Optional[str] = None


# ---------- Lead scoring responses ----------
class LeadLLMScoreResponse(BaseModel):
    fit_score: int
    score: int
    priority_suggestion: str
    predicted_prob: float
    predicted_value: float
    predicted_value_currency: str
    reason: str
    confidence: float
    features_used: Dict[str, Any]
    next_best_action: Optional[str] = None


class LeadMLScoreResponse(BaseModel):
    predicted_prob: float
    raw_score: float
    predicted_value: float
    predicted_value_currency: str = "VND"
    models: Dict[str, Any]


class LeadHybridResponse(BaseModel):
    predicted_prob: float
    predicted_value: float
    predicted_value_currency: str = "VND"
    reason: Optional[str] = None
    next_best_action: Optional[str] = None
    confidence: Optional[float] = None
    models: Dict[str, Any]


# =========================
# CUSTOMER INPUTS (match Streamlit)
# =========================
class SegmentPredictIn(BaseModel):
    segmentation_json: Dict[str, Any] = Field(default_factory=dict)
    segment_map_json: Optional[Dict[str, str]] = None  # {"0":"...","1":"...","2":"..."}
    debug: bool = True


class CLVPredictIn(BaseModel):
    horizon: str = "12m"  # "1m"|"3m"|"6m"|"12m"
    clv_json: Dict[str, Any] = Field(default_factory=dict)


class RevenueDailyOneIn(BaseModel):
    target: str = "order"  # "order"|"line"
    features: Dict[str, Any] = Field(default_factory=dict)
    transform_mode: str = "raw"
    transform_scale: float = 1.0
    clip_negative_to_zero: bool = True


# ---------- Services ----------
llm = LLMService()
ml = MLService()


# ---------- Helpers ----------
def _unwrap_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    return payload.get("data") if isinstance(payload, dict) and isinstance(payload.get("data"), dict) else payload


def _extract_lead(payload: Dict[str, Any]) -> Dict[str, Any]:
    inner = _unwrap_data(payload)
    lead = inner.get("lead") if isinstance(inner, dict) else None
    return lead if isinstance(lead, dict) else {}


# ---------- Routes ----------
@router.post("/leads/score", response_model=LeadLLMScoreResponse)
async def score_lead_llm(payload: Dict[str, Any] = Body(...)):
    """
    LLM scoring: chấp nhận {lead:{...}} hoặc {data:{lead:{...}}}
    """
    try:
        lead = _extract_lead(payload)
        result = await llm.score_lead(lead)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {e}")


@router.post("/score")
async def score_demo(_: dict):
    return {"score": 0.8, "reason": "Demo score"}


@router.post("/text/summarize", response_model=SummarizeOut)
async def summarize(inp: SummarizeIn):
    try:
        text = (inp.text or "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="text is required")
        summary = await llm.summarize(text, options=inp.options or {})
        return {"summary": summary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text/classify", response_model=ClassifyOut)
async def classify(inp: ClassifyIn):
    try:
        result = await llm.classify(inp.text, inp.labels, options=inp.options or {})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text/extract", response_model=ExtractOut)
async def extract(inp: ExtractIn):
    try:
        entities = await llm.extract(inp.text, schema=inp.schema, options=inp.options or {})
        return {"entities": entities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generation/email", response_model=GenEmailOut)
async def generate_email(inp: GenEmailIn):
    try:
        options = inp.options or {}
        purpose = (options.get("purpose") or "promotion") if isinstance(options, dict) else "promotion"

        result = await llm.generate_email_content(
            context=inp.input,
            purpose=purpose,
            options=options,
        )
        result = result if isinstance(result, dict) else {}
        return {"subject": result.get("subject", ""), "body": result.get("body", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/marketing/suggest_campaign", response_model=SuggestCampaignResponse)
async def suggest_marketing_campaign(payload: Dict[str, Any] = Body(...)):
    """
    Client gửi: { data: { topic, customer_data, product_data/Product_data, options } }
    """
    try:
        data = _unwrap_data(payload)

        topic = data.get("topic") if isinstance(data, dict) else None
        customer_data = (data.get("customer_data", []) if isinstance(data, dict) else []) or []

        product_data = []
        if isinstance(data, dict):
            product_data = data.get("Product_data")
            if product_data is None:
                product_data = data.get("product_data")
        product_data = product_data or []

        options = (data.get("options") if isinstance(data, dict) else None) or {}

        campaign = await llm.suggest_marketing_campaign(
            customer_data,
            product_data,
            topic=topic,
            options=options,
        )
        return {"ok": True, "campaign": campaign}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/leads/conversion_prob", response_model=ProbResponse)
async def estimate_conversion_prob(payload: LeadPayload):
    try:
        if not payload.lead:
            raise HTTPException(status_code=400, detail="lead is required")
        res = await llm.estimate_conversion_prob(payload.lead, options=payload.options or {})
        res = res if isinstance(res, dict) else {}
        return {"probability": float(res.get("probability", 0.0)), "reason": res.get("reason")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/leads/score_ml", response_model=LeadMLScoreResponse)
async def score_lead_ml(payload: LeadPayload):
    """
    ML scoring: model_cls_onehot + model_reg_onehot + feature_columns_onehot
    """
    try:
        if not payload.lead:
            raise HTTPException(status_code=400, detail="lead is required")

        res = ml.predict_lead(
            payload.lead,
            cls_model_name="lead_cls_onehot",
            reg_model_name="lead_reg_onehot",
            feature_cols_name="lead_feature_columns_onehot",
        )

        return {
            "predicted_prob": float(res["conversion_prob"]),
            "raw_score": float(res["raw_score"]),
            "predicted_value": float(res["predicted_value"]),
            "predicted_value_currency": str(res.get("currency", "VND")),
            "models": res["models"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML service error: {e}")


@router.post("/leads/score_hybrid", response_model=LeadHybridResponse)
async def score_lead_hybrid(payload: LeadPayload):
    """
    Hybrid: ML lấy số; LLM trả reason/next action.
    """
    try:
        if not payload.lead:
            raise HTTPException(status_code=400, detail="lead is required")

        ml_res = ml.predict_lead(
            payload.lead,
            cls_model_name="lead_cls_onehot",
            reg_model_name="lead_reg_onehot",
            feature_cols_name="lead_feature_columns_onehot",
        )

        llm_res = await llm.score_lead(payload.lead)
        llm_res = llm_res if isinstance(llm_res, dict) else {}

        return {
            "predicted_prob": float(ml_res["conversion_prob"]),
            "predicted_value": float(ml_res["predicted_value"]),
            "predicted_value_currency": str(ml_res.get("currency", "VND")),
            "reason": llm_res.get("reason"),
            "next_best_action": llm_res.get("next_best_action"),
            "confidence": llm_res.get("confidence"),
            "models": ml_res["models"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================================
# CUSTOMER ROUTES — STRICT đúng theo input Streamlit (app.py)
# ==========================================================

@router.post("/customers/churn")
async def predict_customer_churn(churn_json: Dict[str, Any] = Body(...)):
    """
    Input đúng Streamlit:
      Body = Churn JSON (dict) (không bọc data/features)
    """
    try:
        if not isinstance(churn_json, dict) or not churn_json:
            raise HTTPException(status_code=400, detail="Churn JSON body is required")
        return ml.predict_churn(churn_json)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML service error: {e}")


@router.post("/customers/segment")
async def predict_customer_segment(inp: SegmentPredictIn):
    """
    Input đúng Streamlit:
      {
        "segmentation_json": {...},
        "segment_map_json": {"0":"...","1":"...","2":"..."},
        "debug": true
      }
    """
    try:
        if not inp.segmentation_json:
            raise HTTPException(status_code=400, detail="segmentation_json is required")

        seg_map_int: Optional[Dict[int, str]] = None
        if isinstance(inp.segment_map_json, dict):
            seg_map_int = {}
            for k, v in inp.segment_map_json.items():
                try:
                    seg_map_int[int(k)] = str(v)
                except Exception:
                    continue

        return ml.predict_segment(inp.segmentation_json, segment_map=seg_map_int, debug=bool(inp.debug))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML service error: {e}")


@router.post("/customers/clv")
async def predict_customer_clv(inp: CLVPredictIn):
    """
    Input đúng Streamlit:
      { "horizon": "6m", "clv_json": {...} }
    """
    try:
        if not inp.clv_json:
            raise HTTPException(status_code=400, detail="clv_json is required")
        return ml.predict_clv(inp.clv_json, horizon=inp.horizon)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML service error: {e}")


@router.post("/forecast/revenue_daily_one")
async def predict_revenue_daily_one(inp: RevenueDailyOneIn):
    """
    Debug nhanh 1 ngày như Streamlit (transform/scale)
    """
    try:
        if not inp.features:
            raise HTTPException(status_code=400, detail="features is required")
        return ml.predict_daily_revenue(
            inp.features,
            target=inp.target,
            transform_mode=inp.transform_mode,
            transform_scale=float(inp.transform_scale),
            clip_negative_to_zero=bool(inp.clip_negative_to_zero),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML service error: {e}")


@router.post("/forecast/daily_csv")
async def forecast_from_daily_csv(
    file: UploadFile = File(...),
    mode: str = Form("ALL"),  # "ALL" or "ONE"
    target: str = Form("daily_revenue_order"),  # nếu mode="ONE"
    horizon: int = Form(30),
    hist_days: int = Form(365),
    start_date: Optional[str] = Form(None),  # yyyy-mm-dd hoặc None
    holiday_mmdd: str = Form("01-01,02-14,03-08,04-30,05-01,09-02,10-20,11-11,12-12,12-25"),
    holiday_window_days: int = Form(3),
    clip_negative_to_zero: bool = Form(True),

    order_transform_mode: str = Form("raw"),
    order_transform_scale: float = Form(1.0),
    line_transform_mode: str = Form("raw"),
    line_transform_scale: float = Form(1.0),
    append_transformed_to_history: bool = Form(True),
):
    """
    Input đúng Streamlit:
    - upload CSV
    - horizon/hist_days/start_date/holiday...
    - transform mode/scale cho order/line
    """
    try:
        content = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(content))

        mmdd_list = [x.strip() for x in (holiday_mmdd or "").split(",") if x.strip()]

        if str(mode).upper() == "ONE":
            res = ml.forecast_one_target(
                df=df,
                target=target,
                horizon=horizon,
                start_date=start_date,
                holiday_mmdd=mmdd_list,
                holiday_window_days=holiday_window_days,
                hist_days=hist_days,
                clip_negative_to_zero=clip_negative_to_zero,
                transform_mode=(order_transform_mode if target == "daily_revenue_order" else line_transform_mode),
                transform_scale=(order_transform_scale if target == "daily_revenue_order" else line_transform_scale),
                append_transformed_to_history=append_transformed_to_history,
            )
            return res

        res = ml.forecast_all_targets(
            df=df,
            horizon=horizon,
            start_date=start_date,
            holiday_mmdd=mmdd_list,
            holiday_window_days=holiday_window_days,
            hist_days=hist_days,
            clip_negative_to_zero=clip_negative_to_zero,
            order_transform_mode=order_transform_mode,
            order_transform_scale=float(order_transform_scale),
            line_transform_mode=line_transform_mode,
            line_transform_scale=float(line_transform_scale),
            append_transformed_to_history=append_transformed_to_history,
        )
        return res

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {e}")
