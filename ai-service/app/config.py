import os

# Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Model mặc định (Gemini 1.5 Pro hoặc 1.5 Flash)
GEMINI_MODEL_SUMMARY = os.getenv("GEMINI_MODEL_SUMMARY", "gemini-1.5-flash")
GEMINI_MODEL_CLASSIFY = os.getenv("GEMINI_MODEL_CLASSIFY", "gemini-1.5-flash")
GEMINI_MODEL_GENERIC  = os.getenv("GEMINI_MODEL_GENERIC", "gemini-1.5-flash")

# hard limits
MAX_SUMMARY_LEN = int(os.getenv("MAX_SUMMARY_LEN", "1024"))
TIMEOUT_SECS = int(os.getenv("AI_TIMEOUT_SECS", "20"))
