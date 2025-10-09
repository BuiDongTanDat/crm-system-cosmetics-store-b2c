from dotenv import load_dotenv
import os

load_dotenv()

GGAI_API_KEY = os.getenv("GGAI_API_KEY")
PORT = os.getenv("PORT", 8000)
