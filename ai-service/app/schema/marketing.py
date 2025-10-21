from typing import List, Optional
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

class CampaignSuggestion(BaseModel):
    name: str
    channel: str
    budget: int = Field(..., ge=0)
    start_date: date
    end_date: date
    expected_kpi: ExpectedKPI
    note: Optional[str] = None
    summary_report: Optional[str] = None
    # 🆕 danh sách sản phẩm nên chạy trong chiến dịch
    recommended_products: List[RecommendedProduct] = Field(default_factory=list)

class SuggestFromCustomersRequest(BaseModel):
    topic: Optional[str] = Field(
        None,
        description="Chủ đề chiến dịch (vd: ra mắt sản phẩm mới, khuyến mãi tháng 10, Giáng Sinh,...)"
    )
    # Cho phép chỉ gửi topic → danh sách mặc định rỗng
    customer_data: List[dict] = Field(default_factory=list)
    product_data: Optional[List[dict]] = None

class SuggestCampaignResponse(BaseModel):
    ok: bool
    campaign: CampaignSuggestion
