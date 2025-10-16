from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field  # ⬅️ bỏ conlist
from typing import Any, Dict, List, Optional
from app.services.llm_service import LLMService
from app.services.analyzer import HeuristicAnalyzer
# from app.services.recommender import EmailGenerator

router = APIRouter(prefix="/v1", tags=["ai"])

# ---------- Request/Response Schemas ----------
class LeadPayload(BaseModel):
    lead: Dict[str, Any]
    options: Optional[Dict[str, Any]] = None

class ScoreResponse(BaseModel):
    # Pydantic v2: dùng Field(..., ...) khi muốn bắt buộc và kèm ràng buộc
    score: int = Field(..., ge=0, le=100)
    reason: Optional[str] = None

class SummarizeIn(BaseModel):
    text: str
    options: Optional[Dict[str, Any]] = None

class SummarizeOut(BaseModel):
    summary: str

class ClassifyIn(BaseModel):
    text: str
    # Pydantic v2: list[str] + Field(..., min_length=1)
    labels: List[str] = Field(..., min_length=1)
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
    input: Dict[str, Any]
    options: Optional[Dict[str, Any]] = None

class GenEmailOut(BaseModel):
    subject: str
    body: str

class ProbResponse(BaseModel):
    probability: float
    reason: Optional[str] = None

# ---------- Services ----------
llm = LLMService()
analyzer = HeuristicAnalyzer()
# email_gen = EmailGenerator(llm)

# ---------- Routes ----------
@router.post("/leads/score", response_model=ScoreResponse)
async def score_lead(payload: LeadPayload):
    lead = payload.lead or {}
    score, reason = analyzer.score_lead(lead)
    try:
        refined = await llm.refine_score(lead, base_score=score, base_reason=reason)
        if refined:
            score = refined.get("score", score)
            reason = refined.get("reason", reason)
    except Exception:
        pass
    return {"score": max(0, min(int(score), 100)), "reason": reason}
@router.post("/score")
async def score_lead(data: dict):
    return {"score": 0.8, "reason": "Demo score"}

@router.post("/text/summarize", response_model=SummarizeOut)
async def summarize(inp: SummarizeIn):
    try:
        text = inp.text.strip()
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

# @router.post("/generation/email", response_model=GenEmailOut)
# async def generate_email(inp: GenEmailIn):
#     try:
#         subject, body = await email_gen.generate(inp.input, options=inp.options or {})
#         return {"subject": subject, "body": body}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@router.post("/leads/conversion_prob", response_model=ProbResponse)
async def estimate_conversion_prob(payload: LeadPayload):
    try:
        if not payload.lead:
            raise HTTPException(status_code=400, detail="lead is required")
        res = await llm.estimate_conversion_prob(payload.lead, options=payload.options or {})
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
