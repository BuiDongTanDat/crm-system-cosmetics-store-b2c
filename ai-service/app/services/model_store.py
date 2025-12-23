# app/services/model_store.py
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib
from app import config


class ModelStore:
    """
    Quản lý load/cached các model ML từ thư mục MODEL_DIR.
    - Hỗ trợ cả .joblib và .pkl (joblib.load thường load được cả sklearn pickle)
    - Hỗ trợ alias: tên logic -> tên file thực tế
    - Hỗ trợ version: __{version} trước đuôi file
    """

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is not None:
            self.base_dir: Path = Path(base_dir)
        else:
            model_dir = getattr(config, "MODEL_DIR", None)
            self.base_dir = Path(model_dir) if model_dir is not None else Path("models").resolve()

        self._cache: Dict[str, Any] = {}

        # Alias map: key dùng trong code -> filename thực tế trong /models
        self.alias: Dict[str, str] = {
            # Lead
            "lead_cls_onehot": "model_cls_onehot.pkl",
            "lead_reg_onehot": "model_reg_onehot.pkl",
            "lead_feature_columns_onehot": "feature_columns_onehot.pkl",
            # Churn
            "churn_model": "churn_model.pkl",
            # Segmentation
            "kmeans_customer_segmentation": "kmeans_customer_segmentation.joblib",
            # CLV bundles (multi-horizon)
            "clv_model_bundle_1m": "clv_model_bundle_1m.joblib",
            "clv_model_bundle_3m": "clv_model_bundle_3m.joblib",
            "clv_model_bundle_6m": "clv_model_bundle_6m.joblib",
            "clv_model_bundle_12m": "clv_model_bundle.joblib",
            # Legacy fallback
            "clv_model_bundle": "clv_model_bundle.joblib",
            # Forecast
            "xgb_daily_revenue_order": "xgb_daily_revenue_order.joblib",
            "xgb_daily_revenue_line": "xgb_daily_revenue_line.joblib",
        }

    def _with_version(self, path: Path, version: Optional[str]) -> Path:
        if not version:
            return path
        return path.with_name(f"{path.stem}__{version}{path.suffix}")

    def _resolve_filename(self, name: str, version: Optional[str] = None) -> Path:
        # 1) alias
        if name in self.alias:
            base = self.base_dir / self.alias[name]
            pv = self._with_version(base, version)
            if pv.exists():
                return pv
            if base.exists():
                return base

        # 2) convention fallback
        candidates = []
        if version:
            candidates.extend([
                self.base_dir / f"{name}__{version}.joblib",
                self.base_dir / f"{name}__{version}.pkl",
            ])
        candidates.extend([
            self.base_dir / f"{name}.joblib",
            self.base_dir / f"{name}.pkl",
        ])

        for c in candidates:
            if c.exists():
                return c

        tried = ", ".join(str(x) for x in candidates)
        raise FileNotFoundError(f"Model file not found for name='{name}', version='{version}'. Tried: {tried}")

    def safe_get(self, name: str, version: Optional[str] = None) -> Tuple[Optional[Any], Optional[str]]:
        """
        Load an toàn: trả (obj, err_string). Không raise.
        """
        try:
            obj = self.get(name, version=version)
            return obj, None
        except Exception as e:
            return None, str(e)

    def get(self, name: str, version: Optional[str] = None) -> Any:
        """
        Lấy model từ cache, nếu chưa có thì load từ file.
        Cache key theo (name, version).
        """
        key = f"{name}:{version or 'default'}"
        if key in self._cache:
            return self._cache[key]

        path = self._resolve_filename(name, version)
        obj = joblib.load(path)
        self._cache[key] = obj
        return obj

    def clear_cache(self, name: Optional[str] = None) -> None:
        """
        Xóa cache 1 model hoặc toàn bộ cache.
        """
        if name is None:
            self._cache.clear()
            return
        keys_to_del = [k for k in list(self._cache.keys()) if k.startswith(name + ":")]
        for k in keys_to_del:
            self._cache.pop(k, None)


_model_store: ModelStore | None = None


def get_model_store() -> ModelStore:
    global _model_store
    if _model_store is None:
        _model_store = ModelStore()
    return _model_store


model_store = get_model_store()
