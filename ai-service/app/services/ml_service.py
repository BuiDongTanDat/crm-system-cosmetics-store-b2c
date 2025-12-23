# app/services/ml_service.py
from __future__ import annotations

from typing import Any, Dict, Optional, Tuple, List

import numpy as np
import pandas as pd

from app.services.model_store import model_store


class MLService:
    """
    Service gọi các model ML (sklearn/xgboost/...) để predict:
    lead (prob/value), churn, segmentation, clv (multi-horizon), forecast (daily revenue)...
    """

    # ---------------------------
    # Basic helpers
    # ---------------------------
    def _safe_float(self, v: Any, default: float = 0.0) -> float:
        try:
            if v is None:
                return default
            return float(v)
        except Exception:
            return default

    def _safe_int(self, v: Any, default: int = 0) -> int:
        try:
            if v is None:
                return default
            return int(float(v))
        except Exception:
            return default

    def _predict_prob_and_score(self, model: Any, X: pd.DataFrame | np.ndarray) -> Tuple[float, float]:
        if hasattr(model, "predict_proba"):
            proba = float(model.predict_proba(X)[0, 1])
            raw = float(model.predict(X)[0])
        else:
            raw = float(model.predict(X)[0])
            proba = 1.0 / (1.0 + np.exp(-raw))
        proba = max(0.0, min(1.0, proba))
        return proba, raw

    def _get_expected_columns(self, obj: Any) -> Optional[List[str]]:
        cols = getattr(obj, "feature_names_in_", None)
        return list(cols) if cols is not None else None

    def _align_to_expected(self, model: Any, df: pd.DataFrame) -> pd.DataFrame:
        cols = self._get_expected_columns(model)
        if not cols:
            return df
        return df.reindex(columns=cols, fill_value=0)

    def _kmeans_distances(self, kmeans_model: Any, X_arr: np.ndarray) -> Optional[List[float]]:
        if not hasattr(kmeans_model, "cluster_centers_"):
            return None
        centers = kmeans_model.cluster_centers_
        if X_arr.ndim != 2 or X_arr.shape[0] != 1:
            return None
        dists = np.linalg.norm(centers - X_arr, axis=1)
        return [float(x) for x in dists]

    # ---------------------------
    # LEAD (giữ như bạn đang dùng)
    # ---------------------------
    def _onehot_frame_from_payload(
        self,
        payload: Dict[str, Any],
        feature_columns: List[str],
        *,
        categorical_fields: Tuple[str, ...] = (
            "source",
            "status",
            "priority",
            "campaign_type",
            "acquisition_channel",
            "product_interest",
        ),
    ) -> pd.DataFrame:
        X = pd.DataFrame([[0.0] * len(feature_columns)], columns=feature_columns)

        for col in feature_columns:
            if col in payload:
                X.at[0, col] = self._safe_float(payload.get(col), 0.0)

        for field in categorical_fields:
            val = payload.get(field)
            if val is None:
                continue
            val_str = str(val).strip()
            if not val_str:
                continue
            candidates = [f"{field}_{val_str}", f"{field}_{val_str.lower()}"]
            for c in candidates:
                if c in X.columns:
                    X.at[0, c] = 1.0

        return X

    def predict_lead(
        self,
        lead: Dict[str, Any],
        *,
        cls_model_name: str = "lead_cls_onehot",
        reg_model_name: str = "lead_reg_onehot",
        feature_cols_name: str = "lead_feature_columns_onehot",
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        cls_model = model_store.get(cls_model_name, model_version)
        reg_model = model_store.get(reg_model_name, model_version)
        feature_columns = model_store.get(feature_cols_name, model_version)

        feature_columns = list(feature_columns)
        X = self._onehot_frame_from_payload(lead, feature_columns)

        prob, raw_score = self._predict_prob_and_score(cls_model, X)
        predicted_value = float(reg_model.predict(X)[0])

        return {
            "conversion_prob": prob,
            "raw_score": raw_score,
            "predicted_value": predicted_value,
            "currency": lead.get("predicted_value_currency") or "VND",
            "models": {
                "cls": cls_model_name,
                "reg": reg_model_name,
                "feature_columns": feature_cols_name,
                "version": model_version or "default",
            },
        }

    # ---------------------------
    # CHURN (pipeline hoặc model)
    # ---------------------------
    def predict_churn(
        self,
        customer_features: Dict[str, Any],
        *,
        model_name: str = "churn_model",
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        model = model_store.get(model_name, model_version)
        X = pd.DataFrame([customer_features])
        prob, raw_score = self._predict_prob_and_score(model, X)
        return {
            "churn_prob": float(prob),
            "raw_score": float(raw_score),
            "model": model_name,
            "version": model_version or "default",
        }

    # ---------------------------
    # SEGMENTATION (KMeans) — FIX: không tự bịa 5 nhãn
    # ---------------------------
    def _sanitize_segment_map(self, seg_map: Optional[Dict[int, str]], kmeans_model: Any) -> Optional[Dict[int, str]]:
        if not seg_map or not isinstance(seg_map, dict):
            return seg_map

        k = getattr(kmeans_model, "n_clusters", None)
        if k is None and hasattr(kmeans_model, "cluster_centers_"):
            k = len(kmeans_model.cluster_centers_)

        if not isinstance(k, int) or k <= 0:
            return seg_map

        allowed = set(range(k))
        cleaned: Dict[int, str] = {}
        for kk, vv in seg_map.items():
            try:
                ik = int(kk)
            except Exception:
                continue
            if ik in allowed:
                cleaned[ik] = str(vv)
        return cleaned

    def predict_segment(
        self,
        features: Dict[str, Any],
        *,
        model_name: str = "kmeans_customer_segmentation",
        model_version: Optional[str] = None,
        segment_map: Optional[Dict[int, str]] = None,
        debug: bool = True,
    ) -> Dict[str, Any]:
        kmeans = model_store.get(model_name, model_version)

        segment_map = self._sanitize_segment_map(segment_map, kmeans)

        # Nếu không truyền map -> không bịa label business, chỉ Segment_{id}
        k = getattr(kmeans, "n_clusters", None)
        if k is None and hasattr(kmeans, "cluster_centers_"):
            k = len(kmeans.cluster_centers_)
        if isinstance(k, int) and k > 0:
            default_map = {i: f"Segment_{i}" for i in range(k)}
        else:
            default_map = {}

        if segment_map is None:
            segment_map = default_map

        req = dict(features)
        for key in ["Recency", "Frequency", "Monetary", "Discount_Sensitivity", "Category_Breadth"]:
            if key in req:
                if key == "Category_Breadth":
                    req[key] = self._safe_int(req.get(key), 0)
                else:
                    req[key] = self._safe_float(req.get(key), 0.0)

        X_raw = pd.DataFrame([req])
        X_aligned = self._align_to_expected(kmeans, X_raw)
        X_arr = X_aligned.values.astype(float)

        seg_id = int(kmeans.predict(X_arr)[0])
        seg_name = segment_map.get(seg_id, f"Segment_{seg_id}")

        out: Dict[str, Any] = {
            "segment_id": seg_id,
            "segment_name": seg_name,
            "used_preprocess": None,
            "model": model_name,
            "version": model_version or "default",
        }
        if debug:
            out["distances_to_centers"] = self._kmeans_distances(kmeans, X_arr)
        return out

    # ---------------------------
    # CLV (multi-horizon bundles) — FIX: giống app.py
    # ---------------------------
    def _get_clv_bundle_name(self, horizon: str) -> str:
        h = str(horizon).lower().strip()
        if h in ("1m", "3m", "6m", "12m"):
            return f"clv_model_bundle_{h}"
        # fallback legacy
        return "clv_model_bundle"

    def _resolve_clv_components(self, bundle_obj: Any) -> Tuple[Any, Optional[List[str]], bool, Dict[str, Any]]:
        """
        Hỗ trợ kiểu bundle giống app.py:
          - dict: {pipeline/pipe/model, expected_cols, target_is_log}
          - hoặc pipeline/model thuần
        """
        meta: Dict[str, Any] = {"bundle_type": str(type(bundle_obj))}

        if not isinstance(bundle_obj, dict):
            meta["mode"] = "model_only"
            return bundle_obj, None, True, meta

        meta["mode"] = "dict_bundle"
        meta["keys"] = list(bundle_obj.keys())

        pipe = bundle_obj.get("pipeline") or bundle_obj.get("pipe") or bundle_obj.get("model")
        expected_cols = bundle_obj.get("expected_cols")
        target_is_log = bool(bundle_obj.get("target_is_log", True))

        meta["pipe_key"] = (
            "pipeline" if "pipeline" in bundle_obj
            else ("pipe" if "pipe" in bundle_obj else ("model" if "model" in bundle_obj else None))
        )
        meta["has_expected_cols"] = expected_cols is not None
        meta["target_is_log"] = target_is_log
        meta["horizon"] = bundle_obj.get("horizon")
        return pipe, (list(expected_cols) if expected_cols is not None else None), target_is_log, meta

    def _clv_fillna_by_rule(self, df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        for c in out.columns:
            lc = str(c).lower()
            if out[c].isna().any():
                if lc in ("acquisition_channel", "campaign_type"):
                    out[c] = out[c].fillna("unknown")
                elif "rate" in lc:
                    out[c] = out[c].fillna(0.0)
                elif lc.startswith("log_"):
                    out[c] = out[c].fillna(0.0)
                elif any(k in lc for k in ["count", "frequency", "recency", "dayofweek", "year", "month", "diversity"]):
                    out[c] = out[c].fillna(0)
                else:
                    out[c] = out[c].fillna(0)
        return out

    def predict_clv(
        self,
        features: Dict[str, Any],
        *,
        horizon: str = "12m",
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Load bundle theo horizon: clv_model_bundle_{1m,3m,6m,12m}.joblib
        Bundle dạng dict khuyến nghị:
          {"pipeline": pipe, "expected_cols": [...], "target_is_log": True, "horizon": "6m"}
        """
        bundle_name = self._get_clv_bundle_name(horizon)
        bundle_obj = model_store.get(bundle_name, model_version)

        pipe, expected_cols, target_is_log, meta = self._resolve_clv_components(bundle_obj)
        if pipe is None:
            raise ValueError("CLV bundle không có pipeline/model hợp lệ.")

        X = pd.DataFrame([features])
        if expected_cols:
            X = X.reindex(columns=list(expected_cols))
        X = self._clv_fillna_by_rule(X)

        pred_raw = pipe.predict(X)
        pred = np.expm1(pred_raw) if target_is_log else pred_raw
        pred_val = float(np.maximum(pred, 0.0)[0])

        return {
            "CLV_pred": pred_val,
            "horizon": str(horizon),
            "bundle": bundle_name,
            "version": model_version or "default",
            "debug": meta,
        }

    # ---------------------------
    # FORECAST (daily revenue) — port từ app.py
    # ---------------------------
    def _get_xgb_expected_features(self, model: Any) -> Optional[List[str]]:
        try:
            booster = model.get_booster()
            names = booster.feature_names
            if names:
                return list(names)
        except Exception:
            pass
        cols = self._get_expected_columns(model)
        return cols if cols else None

    def _season_onehot(self, month: int) -> Tuple[int, int, int, int]:
        spring = 1 if month in (3, 4, 5) else 0
        summer = 1 if month in (6, 7, 8) else 0
        autumn = 1 if month in (9, 10, 11) else 0
        winter = 1 if month in (12, 1, 2) else 0
        return spring, summer, autumn, winter

    def _build_holiday_flag(self, d: pd.Timestamp, holiday_mmdd: List[str], window_days: int) -> int:
        if not holiday_mmdd:
            return 0
        holiday_set = set(holiday_mmdd)
        if window_days <= 0:
            return 1 if d.strftime("%m-%d") in holiday_set else 0

        yyyy = d.year
        for mmdd in holiday_mmdd:
            try:
                hd = pd.Timestamp(f"{yyyy}-{mmdd}")
            except Exception:
                continue
            if abs((d - hd).days) <= window_days:
                return 1
        return 0

    def _ensure_base_time_cols(self, df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        if "date" not in out.columns:
            raise ValueError("CSV phải có cột `date`.")
        out["date"] = pd.to_datetime(out["date"], errors="coerce")
        out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

        if "weekday" not in out.columns:
            out["weekday"] = out["date"].dt.weekday
        if "month" not in out.columns:
            out["month"] = out["date"].dt.month
        if "year" not in out.columns:
            out["year"] = out["date"].dt.year
        if "is_weekend" not in out.columns:
            out["is_weekend"] = (out["weekday"] >= 5).astype(int)

        need_any_season = any(c not in out.columns for c in ["season_spring", "season_summer", "season_autumn", "season_winter"])
        if need_any_season:
            mo = out["date"].dt.month
            out["season_spring"] = mo.isin([3, 4, 5]).astype(int)
            out["season_summer"] = mo.isin([6, 7, 8]).astype(int)
            out["season_autumn"] = mo.isin([9, 10, 11]).astype(int)
            out["season_winter"] = mo.isin([12, 1, 2]).astype(int)

        for c in ["weekday", "month", "year", "is_weekend", "season_spring", "season_summer", "season_autumn", "season_winter"]:
            if c in out.columns:
                out[c] = pd.to_numeric(out[c], errors="coerce").fillna(0).astype(int)

        if "is_holiday_window" in out.columns:
            out["is_holiday_window"] = pd.to_numeric(out["is_holiday_window"], errors="coerce").fillna(0).astype(int)

        return out

    def _make_feature_row(
        self,
        expected: List[str],
        hist_series: pd.Series,
        future_date: pd.Timestamp,
        holiday_mmdd: List[str],
        holiday_window_days: int,
    ) -> Dict[str, Any]:
        row = {c: 0 for c in expected}

        wd = int(future_date.dayofweek)
        mo = int(future_date.month)
        yr = int(future_date.year)

        if "weekday" in row:
            row["weekday"] = wd
        if "month" in row:
            row["month"] = mo
        if "year" in row:
            row["year"] = yr
        if "is_weekend" in row:
            row["is_weekend"] = 1 if wd >= 5 else 0
        if "is_holiday_window" in row:
            row["is_holiday_window"] = int(self._build_holiday_flag(future_date, holiday_mmdd, holiday_window_days))

        spring, summer, autumn, winter = self._season_onehot(mo)
        if "season_spring" in row:
            row["season_spring"] = spring
        if "season_summer" in row:
            row["season_summer"] = summer
        if "season_autumn" in row:
            row["season_autumn"] = autumn
        if "season_winter" in row:
            row["season_winter"] = winter

        if "lag_1" in row:
            row["lag_1"] = float(hist_series.iloc[-1])
        if "lag_7" in row:
            row["lag_7"] = float(hist_series.iloc[-7]) if len(hist_series) >= 7 else float(hist_series.iloc[0])
        if "lag_14" in row:
            row["lag_14"] = float(hist_series.iloc[-14]) if len(hist_series) >= 14 else float(hist_series.iloc[0])

        if "roll_mean_7" in row:
            row["roll_mean_7"] = float(hist_series.tail(7).mean()) if len(hist_series) >= 7 else float(hist_series.mean())
        if "roll_mean_28" in row:
            row["roll_mean_28"] = float(hist_series.tail(28).mean()) if len(hist_series) >= 28 else float(hist_series.mean())

        return row

    def _transform_pred(self, pred_raw: float, mode: str, scale: float) -> float:
        if mode == "raw":
            return float(pred_raw)
        if mode == "expm1":
            return float(np.expm1(pred_raw))
        if mode == "raw_scale":
            return float(pred_raw * float(scale))
        if mode == "expm1_scale":
            return float(np.expm1(pred_raw) * float(scale))
        return float(pred_raw)

    def forecast_recursive(
        self,
        *,
        df_daily: pd.DataFrame,
        model: Any,
        target_col: str,
        horizon_days: int,
        start_date: Optional[str],
        holiday_mmdd: List[str],
        holiday_window_days: int,
        hist_days: int = 365,
        clip_negative_to_zero: bool = True,
        transform_mode: str = "raw",
        transform_scale: float = 1.0,
        append_transformed_to_history: bool = True,
    ) -> Tuple[pd.DataFrame, List[str], pd.Timestamp, pd.Timestamp]:
        df = self._ensure_base_time_cols(df_daily)

        if target_col not in df.columns:
            raise ValueError(f"CSV thiếu cột `{target_col}`.")

        df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
        df = df.dropna(subset=[target_col])
        if df.empty:
            raise ValueError("Dataset rỗng sau khi clean target.")

        expected = self._get_xgb_expected_features(model)
        if not expected:
            raise ValueError("Không lấy được expected features từ model.")

        last_date = pd.to_datetime(df["date"]).max()
        used_start = pd.to_datetime(start_date) if start_date else (last_date + pd.Timedelta(days=1))

        hist_df = df[pd.to_datetime(df["date"]) < used_start].copy()
        if hist_df.empty:
            raise ValueError("Không có history trước start_date.")

        hist_df = hist_df.tail(int(hist_days)).copy()
        hist_series = pd.Series(hist_df[target_col].astype(float).values, index=pd.to_datetime(hist_df["date"])).sort_index()
        if len(hist_series) < 8:
            raise ValueError("History quá ngắn (<8 ngày).")

        future_dates = pd.date_range(used_start, periods=int(horizon_days), freq="D")

        preds = []
        hist_ext = hist_series.copy()

        for d in future_dates:
            feat = self._make_feature_row(expected, hist_ext, d, holiday_mmdd, holiday_window_days)
            X = pd.DataFrame([feat], columns=expected)

            pred_raw = float(model.predict(X)[0])
            pred = self._transform_pred(pred_raw, transform_mode, transform_scale)

            pred_out = 0.0 if (clip_negative_to_zero and pred < 0) else float(pred)

            preds.append({
                "date": d,
                "prediction_raw": pred_raw,
                "prediction": pred_out,
                "transform_mode": transform_mode,
                "transform_scale": float(transform_scale),
            })

            hist_ext.loc[d] = pred_out if append_transformed_to_history else pred_raw

        return pd.DataFrame(preds), expected, last_date, used_start

    def forecast_all_targets(
        self,
        df: pd.DataFrame,
        *,
        horizon: int,
        start_date: Optional[str],
        holiday_mmdd: List[str],
        holiday_window_days: int,
        hist_days: int = 365,
        clip_negative_to_zero: bool = True,
        order_transform_mode: str = "raw",
        order_transform_scale: float = 1.0,
        line_transform_mode: str = "raw",
        line_transform_scale: float = 1.0,
        append_transformed_to_history: bool = True,
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        model_order = model_store.get("xgb_daily_revenue_order", model_version)
        model_line = model_store.get("xgb_daily_revenue_line", model_version)

        pred_order, exp_order, last_date, used_start = self.forecast_recursive(
            df_daily=df,
            model=model_order,
            target_col="daily_revenue_order",
            horizon_days=horizon,
            start_date=start_date,
            holiday_mmdd=holiday_mmdd,
            holiday_window_days=holiday_window_days,
            hist_days=hist_days,
            clip_negative_to_zero=clip_negative_to_zero,
            transform_mode=order_transform_mode,
            transform_scale=order_transform_scale,
            append_transformed_to_history=append_transformed_to_history,
        )
        pred_line, exp_line, _, _ = self.forecast_recursive(
            df_daily=df,
            model=model_line,
            target_col="daily_revenue_line",
            horizon_days=horizon,
            start_date=str(pd.to_datetime(used_start).date()),
            holiday_mmdd=holiday_mmdd,
            holiday_window_days=holiday_window_days,
            hist_days=hist_days,
            clip_negative_to_zero=clip_negative_to_zero,
            transform_mode=line_transform_mode,
            transform_scale=line_transform_scale,
            append_transformed_to_history=append_transformed_to_history,
        )

        out = pd.DataFrame({"date": pred_order["date"]})
        out["pred_order_raw"] = pred_order["prediction_raw"]
        out["pred_order"] = pred_order["prediction"]
        out["pred_line_raw"] = pred_line["prediction_raw"]
        out["pred_line"] = pred_line["prediction"]

        debug = {
            "last_date_in_file": str(pd.to_datetime(last_date).date()),
            "start_date_used": str(pd.to_datetime(used_start).date()),
            "expected_features_order": exp_order,
            "expected_features_line": exp_line,
            "order_transform_mode": order_transform_mode,
            "order_transform_scale": float(order_transform_scale),
            "line_transform_mode": line_transform_mode,
            "line_transform_scale": float(line_transform_scale),
            "append_transformed_to_history": bool(append_transformed_to_history),
        }

        return {"debug": debug, "forecast": out.to_dict(orient="records")}

    def forecast_one_target(
        self,
        df: pd.DataFrame,
        *,
        target: str,
        horizon: int,
        start_date: Optional[str],
        holiday_mmdd: List[str],
        holiday_window_days: int,
        hist_days: int = 365,
        clip_negative_to_zero: bool = True,
        transform_mode: str = "raw",
        transform_scale: float = 1.0,
        append_transformed_to_history: bool = True,
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        if target not in ("daily_revenue_order", "daily_revenue_line"):
            raise ValueError("target must be daily_revenue_order or daily_revenue_line")

        model_name = "xgb_daily_revenue_order" if target == "daily_revenue_order" else "xgb_daily_revenue_line"
        model = model_store.get(model_name, model_version)

        pred_df, expected, last_date, used_start = self.forecast_recursive(
            df_daily=df,
            model=model,
            target_col=target,
            horizon_days=horizon,
            start_date=start_date,
            holiday_mmdd=holiday_mmdd,
            holiday_window_days=holiday_window_days,
            hist_days=hist_days,
            clip_negative_to_zero=clip_negative_to_zero,
            transform_mode=transform_mode,
            transform_scale=transform_scale,
            append_transformed_to_history=append_transformed_to_history,
        )

        debug = {
            "target": target,
            "model": model_name,
            "last_date_in_file": str(pd.to_datetime(last_date).date()),
            "start_date_used": str(pd.to_datetime(used_start).date()),
            "expected_features": expected,
            "transform_mode": transform_mode,
            "transform_scale": float(transform_scale),
            "append_transformed_to_history": bool(append_transformed_to_history),
        }
        return {"debug": debug, "forecast": pred_df.to_dict(orient="records")}

    # ---------------------------
    # DAILY REVENUE (1 ngày) — để debug nhanh giống Streamlit
    # ---------------------------
    def predict_daily_revenue(
        self,
        features: Dict[str, Any],
        *,
        target: str = "order",  # "order" | "line"
        transform_mode: str = "raw",
        transform_scale: float = 1.0,
        clip_negative_to_zero: bool = True,
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        if target not in ("order", "line"):
            raise ValueError("target must be 'order' or 'line'")

        model_name = "xgb_daily_revenue_order" if target == "order" else "xgb_daily_revenue_line"
        model = model_store.get(model_name, model_version)

        expected = self._get_xgb_expected_features(model)
        X = pd.DataFrame([features])
        if expected:
            X = X.reindex(columns=expected, fill_value=0)

        pred_raw = float(model.predict(X)[0])
        pred = self._transform_pred(pred_raw, transform_mode, transform_scale)
        pred_out = 0.0 if (clip_negative_to_zero and pred < 0) else float(pred)

        return {
            "target": f"daily_revenue_{target}",
            "prediction_raw": pred_raw,
            "prediction": pred_out,
            "transform_mode": transform_mode,
            "transform_scale": float(transform_scale),
            "model": model_name,
            "version": model_version or "default",
        }
