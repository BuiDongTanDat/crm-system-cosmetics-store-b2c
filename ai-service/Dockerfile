FROM python:3.11-slim

WORKDIR /app

# ===============================
# FIX CHÍNH: cài OpenMP runtime
# ===============================
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ===============================
# Python deps
# ===============================
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ===============================
# App source
# ===============================
COPY . .

# đảm bảo app là package
RUN touch app/__init__.py

EXPOSE 8000

# DEV mode (hot reload hoạt động khi có volumes)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app"]
