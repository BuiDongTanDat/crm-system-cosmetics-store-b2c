from typing import List, Optional, Dict,  Union, Any
from pydantic import BaseModel, Field
from datetime import date

class ExpectedKPI(BaseModel):
    leads: int = Field(..., ge=0)
    cpl: int = Field(..., ge=0)

class RecommendedProduct(BaseModel):
    product_id: Optional[str] = None
    name: str
    category: Optional[str] = None
    price_current: Optional[int] = Field(None, ge=0)
    reason: Optional[str] = None  # vì sao sản phẩm được chọn
class TargetFilter(BaseModel):
    age: Optional[Dict[str, int]] = None       # {"min": 18, "max": 40}
    gender: Optional[Union[List[str], str]] = None  # "female" hoặc ["female","male"]
    locations: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    note: Optional[str] = None
class CampaignSuggestion(BaseModel):
    name: str
    channel: str
    budget: int = Field(..., ge=0)
    start_date: date
    end_date: date
    expected_kpi: ExpectedKPI
    note: Optional[str] = None
    summary_report: Optional[str] = None
    recommended_products: List[RecommendedProduct] = Field(default_factory=list)
    target_filter: Optional[TargetFilter] = None
    data_source: Optional[str] = Field(
        default=None,
        description='Ví dụ: "Products", "AI_GENERATED", "MANUAL"'
    )

class SuggestFromCustomersRequest(BaseModel):
    topic: Optional[str] = Field(
        None,
        description="Chủ đề chiến dịch (vd: ra mắt sản phẩm mới, khuyến mãi tháng 10, Giáng Sinh, ...)"
    )
    customer_data: List[dict] = Field(default_factory=list)
    product_data: List[dict] = Field(default_factory=list)
class SuggestCampaignResponse(BaseModel):
    ok: bool
    campaign: CampaignSuggestion
