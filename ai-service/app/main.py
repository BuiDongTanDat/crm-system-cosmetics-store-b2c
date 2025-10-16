from fastapi import FastAPI
from app.routers.ai_routes import router as ai_router

app = FastAPI(title="CRM AI Service", version="1.0.0")
app.include_router(ai_router)

@app.get("/health")
def health():
    return {"status": "ok"}
