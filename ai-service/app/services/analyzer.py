# app/services/analyzer.py
from typing import Any, Dict, Tuple

class HeuristicAnalyzer:
    """
    Rule-based scoring 0..100 cho lead.
    """
    def score_lead(self, lead: Dict[str, Any]) -> Tuple[int, str]:
        score = 0
        reasons = []

        source = (lead.get("source") or "").lower()
        if source in ("referral", "partner"):
            score += 25; reasons.append(f"source={source}+25")
        elif source in ("ads", "website"):
            score += 10; reasons.append(f"source={source}+10")

        status = (lead.get("status") or "").lower()
        if status == "engaged":
            score += 20; reasons.append("status=engaged+20")
        elif status == "new":
            score += 5; reasons.append("status=new+5")

        if lead.get("email"):
            score += 10; reasons.append("email+10")
        if lead.get("phone"):
            score += 10; reasons.append("phone+10")

        interactions = lead.get("interactions") or []
        page_views = sum(1 for i in interactions if i.get("type") == "page_view")
        email_clicks = sum(1 for i in interactions if i.get("type") == "email_click")
        score += min(page_views * 2, 10)
        if page_views: reasons.append(f"page_views*2={min(page_views*2,10)}")
        score += min(email_clicks * 5, 20)
        if email_clicks: reasons.append(f"email_clicks*5={min(email_clicks*5,20)}")

        score = max(0, min(score, 100))
        return score, "; ".join(reasons) if reasons else "baseline"
