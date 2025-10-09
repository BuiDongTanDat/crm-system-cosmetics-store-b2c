from fastapi import FastAPI
from app.routers.ai_routes import router as ai_router

app = FastAPI(title="AI Service")

app.include_router(ai_router, prefix="/ai")

@app.get("/")
def root():
    return {"message": "AI Service is running!"}
