# app/services/model_store.py
from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
from app import config


class ModelStore:
    """
    Đơn giản: quản lý load/cached các model ML từ thư mục MODEL_DIR.
    Dùng chung cho nhiều loại model: lead_conversion, churn, clv, forecast...
    """

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir: Path = base_dir or config.MODEL_DIR
        self._cache: Dict[str, Any] = {}

    def _build_filename(self, name: str, version: Optional[str] = None) -> Path:
        """
        Quy ước tên file:
        - Không có version: <name>.joblib, vd: lead_conversion.joblib
        - Có version: <name>__<version>.joblib, vd: lead_conversion__v1.joblib
        """
        if version:
            fname = f"{name}__{version}.joblib"
        else:
            fname = f"{name}.joblib"
        return self.base_dir / fname

    def get(self, name: str, version: Optional[str] = None) -> Any:
        """
        Lấy model từ cache, nếu chưa có thì load từ file.
        """
        key = f"{name}:{version or 'default'}"
        if key in self._cache:
            return self._cache[key]

        path = self._build_filename(name, version)
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")

        model = joblib.load(path)
        self._cache[key] = model
        return model

    def clear_cache(self, name: Optional[str] = None):
        """
        Xóa cache 1 model hoặc toàn bộ cache (khi deploy model mới).
        """
        if name is None:
            self._cache.clear()
            return
        keys_to_del = [k for k in self._cache if k.startswith(name + ":")]
        for k in keys_to_del:
            self._cache.pop(k, None)


# Singleton global
model_store = ModelStore()
