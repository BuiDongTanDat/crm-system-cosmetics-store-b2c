# app/config.py
from __future__ import annotations

import os
from pathlib import Path

# app/ nằm trong ai-service/app
APP_DIR = Path(__file__).resolve().parent          # .../ai-service/app
ROOT_DIR = APP_DIR.parent                          # .../ai-service

# Thư mục chứa các file model đã train (.pkl, .joblib)
MODEL_DIR = ROOT_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Model mặc định (Gemini 1.5 Pro hoặc 1.5 Flash)
GEMINI_MODEL_SUMMARY = os.getenv("GEMINI_MODEL_SUMMARY", "")
GEMINI_MODEL_CLASSIFY = os.getenv("GEMINI_MODEL_CLASSIFY", "")
GEMINI_MODEL_GENERIC = os.getenv("GEMINI_MODEL_GENERIC", "")

# hard limits
MAX_SUMMARY_LEN = int(os.getenv("MAX_SUMMARY_LEN", "1024"))
TIMEOUT_SECS = int(os.getenv("AI_TIMEOUT_SECS", "20"))
