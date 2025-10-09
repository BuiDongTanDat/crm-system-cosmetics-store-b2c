from fastapi import APIRouter
from app.services.recommender import recommend_products
# from app.services.analyzer import analyze_customer

router = APIRouter()

@router.post("/recommend")
def recommend(customer: dict):
    return recommend_products(customer)

# @router.post("/analyze")
# def analyze(data: dict):
#     return analyze_customer(data)
