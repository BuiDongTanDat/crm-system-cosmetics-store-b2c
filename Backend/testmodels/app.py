# app.py
import os
import re
import json
from datetime import datetime, timezone

import streamlit as st
import pandas as pd
import numpy as np
import joblib

# Optional: show versions
try:
    import sklearn
except Exception:
    sklearn = None
try:
    import xgboost
except Exception:
    xgboost = None


# ==============================
# 1) STREAMLIT CONFIG
# ==============================
st.set_page_config(page_title="Lead + Customer + Forecast Intelligence", layout="wide")
st.title("📊 Lead + Customer + Forecast Intelligence")
st.write("Test trực tiếp các model trong thư mục /models.")

MODELS_DIR = "models"


# ==============================
# 2) DIAGNOSTICS + SAFE LOAD
# ==============================
def _p(fn: str) -> str:
    return os.path.join(MODELS_DIR, fn)


def safe_load(path: str):
    try:
        return joblib.load(path), None
    except Exception as e:
        return None, e


def _safe_float(x, default=0.0) -> float:
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        return default


@st.cache_resource
def load_models_safe():
    """
    Load từng model; model nào lỗi vẫn cho app chạy và báo rõ lỗi.
    """
    files = {
        # Lead
        "lead_cls": "model_cls_onehot.pkl",
        "lead_reg": "model_reg_onehot.pkl",
        "lead_feature_columns": "feature_columns_onehot.pkl",
        # Customer
        "churn_model": "churn_model.pkl",
        "kmeans_seg": "kmeans_customer_segmentation.joblib",
        # Customer - CLV bundles (multi-horizon)
        "clv_bundle_1m": "clv_model_bundle_1m.joblib",
        "clv_bundle_3m": "clv_model_bundle_3m.joblib",
        "clv_bundle_6m": "clv_model_bundle_6m.joblib",
        # Prefer explicit 12m; fallback to legacy name if you keep it
        "clv_bundle_12m": "clv_model_bundle.joblib",
        "clv_bundle_12m_legacy": "clv_model_bundle.joblib",
        # Forecast
        "xgb_order": "xgb_daily_revenue_order.joblib",
        "xgb_line": "xgb_daily_revenue_line.joblib",
    }

    out = {}
    for key, fn in files.items():
        path = _p(fn)
        if not os.path.exists(path):
            out[key] = {
                "file": fn,
                "path": path,
                "ok": False,
                "obj": None,
                "err": "File not found",
                "type": None,
            }
            continue

        obj, err = safe_load(path)
        out[key] = {
            "file": fn,
            "path": path,
            "ok": err is None,
            "obj": obj,
            "err": str(err) if err else None,
            "type": str(type(obj)) if obj is not None else None,
        }
    return out


MODEL_INFO = load_models_safe()


def get_model(key: str):
    info = MODEL_INFO.get(key, {})
    return info.get("obj") if info.get("ok") else None


# Sidebar status
with st.sidebar:
    st.header("🔧 Environment")
    st.write(f"Python: `{os.sys.version.split()[0]}`")
    st.write(f"NumPy: `{np.__version__}`")
    st.write(f"joblib: `{joblib.__version__}`")
    if sklearn is not None:
        st.write(f"scikit-learn: `{sklearn.__version__}`")
    if xgboost is not None:
        st.write(f"xgboost: `{xgboost.__version__}`")

    st.divider()
    st.header("📦 Model loading status")
    for k, v in MODEL_INFO.items():
        # Legacy 12m bundle: show as info if explicit 12m exists
        if k == "clv_bundle_12m_legacy":
            if MODEL_INFO.get("clv_bundle_12m", {}).get("ok"):
                st.info(f"(optional) {v['file']}: legacy (ignored because clv_model_bundle_12m.joblib exists)")
                continue

        if v["ok"]:
            st.success(v["file"])
        else:
            st.error(v["file"])
            st.caption(v["err"])

    st.caption("Nếu gặp lỗi MT19937 khi load → thử pin numpy==1.23.5 (giống môi trường Colab).")


# ==============================
# 3) COMMON HELPERS: schema + alignment
# ==============================
def get_expected_columns(obj):
    cols = getattr(obj, "feature_names_in_", None)
    return list(cols) if cols is not None else None


def align_to_model_features(model, df: pd.DataFrame) -> pd.DataFrame:
    cols = get_expected_columns(model)
    if cols is None:
        return df
    return df.reindex(columns=cols, fill_value=0)


def make_template_json(cols):
    if not cols:
        return {}
    out = {}
    for c in cols:
        lc = str(c).lower()
        if any(k in lc for k in ["channel", "source", "type", "category", "brand", "segment"]):
            out[str(c)] = "unknown"
        else:
            out[str(c)] = 0
    return out


def predict_prob(model, X: pd.DataFrame) -> float:
    if hasattr(model, "predict_proba"):
        return float(model.predict_proba(X)[:, 1][0])
    y = float(model.predict(X)[0])
    if y in (0.0, 1.0):
        return y
    return float(1.0 / (1.0 + np.exp(-y)))


def cluster_profile_table(kmeans_model):
    cols = get_expected_columns(kmeans_model)
    if cols is None or not hasattr(kmeans_model, "cluster_centers_"):
        return None
    centers = pd.DataFrame(kmeans_model.cluster_centers_, columns=cols)
    centers.insert(0, "segment_id", range(len(centers)))
    return centers


def _kmeans_distances(kmeans_model, X_arr: np.ndarray):
    """
    Compute distances to cluster centers (debug).
    X_arr: shape (1, n_features)
    """
    if not hasattr(kmeans_model, "cluster_centers_"):
        return None
    centers = kmeans_model.cluster_centers_
    if X_arr.ndim != 2 or X_arr.shape[0] != 1:
        return None
    dists = np.linalg.norm(centers - X_arr, axis=1)
    return [float(x) for x in dists]


# ==============================
# 4) LEAD: feature builder (onehot like your Streamlit)
# ==============================
model_cls = get_model("lead_cls")
model_reg = get_model("lead_reg")
feature_columns = get_model("lead_feature_columns")
feature_columns = list(feature_columns) if feature_columns is not None else None

tag_feature_cols = [c for c in (feature_columns or []) if str(c).startswith("tag_")]
available_tags = sorted([str(c).replace("tag_", "") for c in tag_feature_cols])

categorical_cols = [
    "source",
    "status_at_snapshot",
    "priority",
    "campaign_id",
    "product_interest",
    "assigned_to",
    "last_interaction_type",
    "product_brand",
    "product_category",
    "price_bucket",
]


def sanitize_col(col: str) -> str:
    col = str(col)
    col = re.sub(r"[^0-9a-zA-Z_]+", "_", col)
    return col


def build_features_from_payload(payload: dict) -> pd.DataFrame:
    if feature_columns is None:
        raise RuntimeError("feature_columns_onehot.pkl chưa load được.")

    row = {
        "source": payload.get("source", "InBound"),
        "status_at_snapshot": payload.get("status", "new"),
        "lead_score": payload.get("lead_score", 50),
        "priority": payload.get("priority", "medium"),
        "campaign_id": payload.get("campaign_id", "none"),
        "product_interest": payload.get("product_interest", "UnknownProduct"),
        "assigned_to": payload.get("assigned_to", "none"),
        "days_since_created": payload.get("days_since_created", 0),
        "total_interactions": payload.get("total_interactions", 0),
        "last_interaction_type": payload.get("last_interaction_type", "form"),
        "product_brand": payload.get("product_brand", "UnknownBrand"),
        "product_category": payload.get("product_category", "UnknownCategory"),
        "product_price": payload.get("product_price", 150000),
        "product_discount": payload.get("product_discount", 0),
        "product_rating": payload.get("product_rating", 4.5),
        "product_n_ratings": payload.get("product_n_ratings", 0),
        "product_stock": payload.get("product_stock", 0),
        "price_bucket": payload.get("price_bucket", "medium"),
        "is_discounted": payload.get("is_discounted", 0),
    }

    tags = payload.get("tags", []) or []
    if not isinstance(tags, list):
        tags = [tags]
    tags = [str(t) for t in tags]

    for tcol in tag_feature_cols:
        tag_name = str(tcol).replace("tag_", "")
        row[tcol] = 1 if tag_name in tags else 0

    df_row = pd.DataFrame([row])

    # ensure objects to str
    obj_cols = df_row.select_dtypes(include="object").columns
    for c in obj_cols:
        df_row[c] = df_row[c].astype(str)

    df_row_dum = pd.get_dummies(df_row, columns=categorical_cols)
    df_row_dum.columns = [sanitize_col(c) for c in df_row_dum.columns]
    df_row_dum = df_row_dum.reindex(columns=feature_columns, fill_value=0)
    return df_row_dum


# ==============================
# 5) CUSTOMER MODELS
# ==============================
def get_churn_expected_cols(churn_model):
    """
    churn_model: sklearn Pipeline(prep -> clf)
    Return: list expected raw input columns (before preprocess)
    """
    if churn_model is None:
        return None

    try:
        if hasattr(churn_model, "named_steps") and "prep" in churn_model.named_steps:
            prep = churn_model.named_steps["prep"]
            cols = getattr(prep, "feature_names_in_", None)
            if cols is not None:
                return list(cols)
    except Exception:
        pass

    try:
        cols = getattr(churn_model, "feature_names_in_", None)
        if cols is not None:
            return list(cols)
    except Exception:
        pass

    return None


def predict_churn(req: dict) -> dict:
    churn_model = get_model("churn_model")
    if churn_model is None:
        raise RuntimeError("churn_model.pkl chưa load được (xem sidebar).")

    expected_cols = get_churn_expected_cols(churn_model)

    X = pd.DataFrame([req])

    if expected_cols:
        X = X.reindex(columns=expected_cols)

    for c in X.columns:
        if X[c].dtype == "object":
            X[c] = X[c].fillna("unknown").astype(str)
        else:
            X[c] = pd.to_numeric(X[c], errors="coerce").fillna(0)

    if hasattr(churn_model, "predict_proba"):
        p = float(churn_model.predict_proba(X)[:, 1][0])
    else:
        y = float(churn_model.predict(X)[0])
        p = y if y in (0.0, 1.0) else float(1.0 / (1.0 + np.exp(-y)))

    risk = "HIGH" if p >= 0.7 else ("MEDIUM" if p >= 0.4 else "LOW")

    return {
        "churn_prob": p,
        "risk_level": risk,
        "expected_cols": expected_cols
    }


def _sanitize_seg_map(seg_map: dict | None, kmeans_model) -> dict | None:
    if not seg_map or not isinstance(seg_map, dict):
        return seg_map

    k = getattr(kmeans_model, "n_clusters", None)
    if k is None and hasattr(kmeans_model, "cluster_centers_"):
        k = len(kmeans_model.cluster_centers_)

    if not isinstance(k, int) or k <= 0:
        return seg_map

    allowed = {str(i) for i in range(k)}
    cleaned = {}
    for kk, vv in seg_map.items():
        sk = str(kk)
        if sk in allowed:
            cleaned[sk] = vv
    return cleaned


def predict_segment(req: dict, seg_map: dict | None = None, debug: bool = True) -> dict:
    kmeans = get_model("kmeans_seg")
    if kmeans is None:
        raise RuntimeError("kmeans_customer_segmentation.joblib chưa load được.")

    seg_map = _sanitize_seg_map(seg_map, kmeans)

    cat_map = {"low": 1, "medium": 2, "high": 3}
    req_fixed = req.copy()

    if "Category_Breadth" in req_fixed:
        v = req_fixed["Category_Breadth"]
        if isinstance(v, str):
            req_fixed["Category_Breadth"] = cat_map.get(v.lower(), 0)

    for k in ["Recency", "Frequency", "Monetary", "Discount_Sensitivity", "Category_Breadth"]:
        if k in req_fixed:
            if k != "Category_Breadth":
                req_fixed[k] = _safe_float(req_fixed.get(k), 0.0)
            else:
                req_fixed[k] = int(_safe_float(req_fixed.get(k), 0.0))

    X_raw = pd.DataFrame([req_fixed])
    X_raw_aligned = align_to_model_features(kmeans, X_raw)
    X_for_kmeans_arr = X_raw_aligned.values.astype(float)

    seg_id = int(kmeans.predict(X_for_kmeans_arr)[0])

    segment_name = f"Segment_{seg_id}"
    if seg_map:
        segment_name = seg_map.get(str(seg_id), segment_name)

    out = {
        "segment_id": seg_id,
        "segment_name": segment_name,
        "used_preprocess": None,
    }
    if debug:
        out["distances_to_centers"] = _kmeans_distances(kmeans, X_for_kmeans_arr)
    return out


# ------------------------------
# CLV: multi-horizon bundles
# ------------------------------
def _resolve_clv_components(bundle_obj):
    meta = {"bundle_type": str(type(bundle_obj))}

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
    if "horizon" in bundle_obj:
        meta["horizon"] = bundle_obj.get("horizon")

    return pipe, expected_cols, target_is_log, meta


def get_clv_bundle_by_horizon(h: str):
    if h == "12m":
        b = get_model("clv_bundle_12m")
        if b is not None:
            return b
        return get_model("clv_bundle_12m_legacy")

    key_map = {"1m": "clv_bundle_1m", "3m": "clv_bundle_3m", "6m": "clv_bundle_6m"}
    return get_model(key_map.get(h, "clv_bundle_12m"))


def get_clv_expected_cols(bundle_obj):
    pipe, expected_cols, target_is_log, meta = _resolve_clv_components(bundle_obj)

    if expected_cols is None and pipe is not None:
        try:
            prep = getattr(pipe, "named_steps", {}).get("prep")
            if prep is not None and getattr(prep, "feature_names_in_", None) is not None:
                expected_cols = list(prep.feature_names_in_)
        except Exception:
            pass
    return pipe, expected_cols, target_is_log, meta


def make_clv_template(expected_cols):
    if not expected_cols:
        return {}

    tpl = {}
    for c in expected_cols:
        lc = str(c).lower()
        if lc == "acquisition_channel":
            tpl[str(c)] = "Meta"
        elif lc == "campaign_type":
            tpl[str(c)] = "Prospecting"
        elif "rate" in lc:
            tpl[str(c)] = 0.0
        elif any(k in lc for k in ["count", "frequency", "recency", "dayofweek", "year", "month", "diversity"]):
            tpl[str(c)] = 0
        elif lc.startswith("log_"):
            tpl[str(c)] = 0.0
        else:
            tpl[str(c)] = 0
    return tpl


def _clv_fillna_by_rule(df: pd.DataFrame) -> pd.DataFrame:
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


def predict_clv_multi(req: dict, horizon: str) -> dict:
    bundle_obj = get_clv_bundle_by_horizon(horizon)
    if bundle_obj is None:
        raise RuntimeError(f"CLV bundle for {horizon} chưa load được (xem sidebar).")

    pipe, expected_cols, target_is_log, meta = get_clv_expected_cols(bundle_obj)
    if pipe is None:
        raise ValueError("CLV bundle không có 'pipeline' hợp lệ.")

    X = pd.DataFrame([req])
    if expected_cols:
        X = X.reindex(columns=list(expected_cols))

    X = _clv_fillna_by_rule(X)

    pred_log_or_raw = pipe.predict(X)
    pred = np.expm1(pred_log_or_raw) if target_is_log else pred_log_or_raw
    pred_val = float(np.maximum(pred, 0.0)[0])

    return {"CLV_pred": pred_val, "horizon": horizon, "debug": meta}


# ==============================
# 6) FORECAST (FIXED): build EXACT features + ALL targets
# ==============================
def _get_xgb_expected_features(model):
    """
    Prefer booster feature names (most reliable for XGBRegressor).
    Fallback to sklearn feature_names_in_.
    """
    try:
        booster = model.get_booster()
        names = booster.feature_names
        if names:
            return list(names)
    except Exception:
        pass

    cols = get_expected_columns(model)
    return cols if cols else None


def _coerce_season_cols_int(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for c in ["season_autumn", "season_spring", "season_summer", "season_winter"]:
        if c in out.columns:
            # handle True/False -> 1/0, strings -> numeric
            out[c] = pd.to_numeric(out[c].astype(int) if out[c].dtype == bool else out[c], errors="coerce").fillna(0).astype(int)
    return out


def _season_onehot(month: int):
    spring = 1 if month in (3, 4, 5) else 0
    summer = 1 if month in (6, 7, 8) else 0
    autumn = 1 if month in (9, 10, 11) else 0
    winter = 1 if month in (12, 1, 2) else 0
    return spring, summer, autumn, winter


def _build_holiday_flag(d: pd.Timestamp, holiday_mmdd: list[str], window_days: int) -> int:
    if not holiday_mmdd:
        return 0

    holiday_set = set(holiday_mmdd)

    # exact day
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


def _ensure_base_time_cols(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure dataset has:
    weekday, month, year, is_weekend, season_*.
    If they exist but are wrong type, coerce.
    """
    out = df.copy()
    if "date" not in out.columns:
        raise ValueError("CSV phải có cột `date`.")

    out["date"] = pd.to_datetime(out["date"], errors="coerce")
    out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

    # create base time cols if missing
    if "weekday" not in out.columns:
        out["weekday"] = out["date"].dt.weekday
    if "month" not in out.columns:
        out["month"] = out["date"].dt.month
    if "year" not in out.columns:
        out["year"] = out["date"].dt.year
    if "is_weekend" not in out.columns:
        out["is_weekend"] = (out["weekday"] >= 5).astype(int)

    # season one-hot if missing
    need_any_season = any(c not in out.columns for c in ["season_spring", "season_summer", "season_autumn", "season_winter"])
    if need_any_season:
        mo = out["date"].dt.month
        out["season_spring"] = mo.isin([3, 4, 5]).astype(int)
        out["season_summer"] = mo.isin([6, 7, 8]).astype(int)
        out["season_autumn"] = mo.isin([9, 10, 11]).astype(int)
        out["season_winter"] = mo.isin([12, 1, 2]).astype(int)

    out = _coerce_season_cols_int(out)

    # booleans to ints
    for c in ["is_weekend", "is_holiday_window"]:
        if c in out.columns:
            if out[c].dtype == bool:
                out[c] = out[c].astype(int)

    # numeric coercion for base cols
    for c in ["weekday", "month", "year", "is_weekend"]:
        if c in out.columns:
            out[c] = pd.to_numeric(out[c], errors="coerce").fillna(0).astype(int)

    return out


def _make_feature_row(expected: list[str], hist_series: pd.Series, future_date: pd.Timestamp, holiday_mmdd: list[str], holiday_window_days: int):
    """
    Build ONE row with EXACT expected feature names.
    Uses standard names from your training:
    - lag_1, lag_7, lag_14
    - roll_mean_7, roll_mean_28
    - weekday/month/year/is_weekend/is_holiday_window
    - season_*
    Any unknown expected cols -> 0
    """
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
        row["is_holiday_window"] = int(_build_holiday_flag(future_date, holiday_mmdd, holiday_window_days))

    spring, summer, autumn, winter = _season_onehot(mo)
    if "season_spring" in row:
        row["season_spring"] = spring
    if "season_summer" in row:
        row["season_summer"] = summer
    if "season_autumn" in row:
        row["season_autumn"] = autumn
    if "season_winter" in row:
        row["season_winter"] = winter

    # Lags
    if "lag_1" in row:
        row["lag_1"] = float(hist_series.iloc[-1])
    if "lag_7" in row:
        row["lag_7"] = float(hist_series.iloc[-7]) if len(hist_series) >= 7 else float(hist_series.iloc[0])
    if "lag_14" in row:
        row["lag_14"] = float(hist_series.iloc[-14]) if len(hist_series) >= 14 else float(hist_series.iloc[0])

    # Rolling means (history is up to d-1)
    if "roll_mean_7" in row:
        row["roll_mean_7"] = float(hist_series.tail(7).mean()) if len(hist_series) >= 7 else float(hist_series.mean())
    if "roll_mean_28" in row:
        row["roll_mean_28"] = float(hist_series.tail(28).mean()) if len(hist_series) >= 28 else float(hist_series.mean())

    return row


# ------------------------------
# NEW: prediction transform utilities + backtest calibrator
# ------------------------------
def _transform_pred(pred_raw: float, mode: str, scale: float) -> float:
    """
    mode:
      - raw
      - expm1
      - raw_scale
      - expm1_scale
    """
    if mode == "raw":
        return float(pred_raw)
    if mode == "expm1":
        return float(np.expm1(pred_raw))
    if mode == "raw_scale":
        return float(pred_raw * float(scale))
    if mode == "expm1_scale":
        return float(np.expm1(pred_raw) * float(scale))
    return float(pred_raw)


def _safe_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.maximum(np.abs(y_true), 1e-9)
    return float(np.mean(np.abs(y_true - y_pred) / denom))


def backtest_one_step(
    df_daily: pd.DataFrame,
    model,
    target_col: str,
    start_date: str,
    end_date: str,
    holiday_mmdd: list[str],
    holiday_window_days: int,
    min_hist: int = 28,
):
    df = _ensure_base_time_cols(df_daily).copy()
    if target_col not in df.columns:
        raise ValueError(f"CSV thiếu cột `{target_col}`.")

    df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    df = df.dropna(subset=["date", target_col]).sort_values("date").reset_index(drop=True)

    expected = _get_xgb_expected_features(model)
    if not expected:
        raise ValueError("Không lấy được expected features từ model.")

    start_date = pd.to_datetime(start_date)
    end_date = pd.to_datetime(end_date)

    # actual series
    s = pd.Series(df[target_col].values, index=pd.to_datetime(df["date"])).sort_index()

    # test dates within range
    test_dates = s[(s.index >= start_date) & (s.index <= end_date)].index.tolist()
    if len(test_dates) == 0:
        raise ValueError("Khoảng backtest không có dữ liệu.")

    rows = []
    for d in test_dates:
        hist = s[s.index < d]
        if len(hist) < int(min_hist):
            continue

        feat = _make_feature_row(expected, hist, d, holiday_mmdd, holiday_window_days)
        X = pd.DataFrame([feat], columns=expected)

        pred_raw = float(model.predict(X)[0])
        actual = float(s.loc[d])

        ratio = (actual / pred_raw) if pred_raw != 0 else np.nan
        rows.append({"date": d, "actual": actual, "pred_raw": pred_raw, "ratio_actual_over_pred": ratio})

    out = pd.DataFrame(rows).dropna()
    if out.empty:
        raise ValueError("Backtest rỗng (thiếu lịch sử hoặc dữ liệu).")
    return out


def eval_transform_candidates(bt: pd.DataFrame):
    """
    Evaluate candidate transforms and return a sorted table by MAPE.
    """
    median_ratio = float(bt["ratio_actual_over_pred"].median()) if "ratio_actual_over_pred" in bt.columns else 1.0
    median_ratio = median_ratio if np.isfinite(median_ratio) and median_ratio > 0 else 1.0

    candidates = [
        {"mode": "raw", "scale": 1.0},
        {"mode": "expm1", "scale": 1.0},
        {"mode": "raw_scale", "scale": 3.0},
        {"mode": "raw_scale", "scale": median_ratio},
        {"mode": "expm1_scale", "scale": 3.0},
        {"mode": "expm1_scale", "scale": median_ratio},
    ]

    y_true = bt["actual"].values.astype(float)
    pred_raw = bt["pred_raw"].values.astype(float)

    rows = []
    for c in candidates:
        y_pred = np.array([_transform_pred(p, c["mode"], c["scale"]) for p in pred_raw], dtype=float)
        mae = float(np.mean(np.abs(y_true - y_pred)))
        mape = _safe_mape(y_true, y_pred)
        rows.append({"mode": c["mode"], "scale": float(c["scale"]), "MAE": mae, "MAPE": mape})

    res = pd.DataFrame(rows).sort_values("MAPE").reset_index(drop=True)
    return res, median_ratio


def forecast_recursive(
    df_daily: pd.DataFrame,
    model,
    target_col: str,
    horizon_days: int,
    start_date: pd.Timestamp | None,
    holiday_mmdd: list[str],
    holiday_window_days: int,
    hist_days: int = 365,
    clip_negative_to_zero: bool = True,
    # NEW:
    transform_mode: str = "raw",
    transform_scale: float = 1.0,
    append_transformed_to_history: bool = True,
):
    """
    Recursive multi-step forecast after start_date.
    - start_date default: day after last date in df
    - expected features read from model.get_booster().feature_names (robust)
    - FIX: season_* coerced to int (avoid all-zeros due to dtype mismatch)

    NEW:
    - transform_mode / transform_scale: để inverse/log/scale đúng
    - append_transformed_to_history: nếu True thì lag/rolling dùng đúng scale output
    """
    df = _ensure_base_time_cols(df_daily)

    if target_col not in df.columns:
        raise ValueError(f"CSV thiếu cột `{target_col}`.")

    df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    df = df.dropna(subset=[target_col])

    if df.empty:
        raise ValueError("Dataset rỗng sau khi parse/clean target.")

    expected = _get_xgb_expected_features(model)
    if not expected:
        raise ValueError("Không lấy được danh sách expected features từ model.")

    last_date = pd.to_datetime(df["date"]).max()
    start_date = pd.to_datetime(start_date) if start_date is not None else (last_date + pd.Timedelta(days=1))

    # history strictly before start_date
    hist_df = df[pd.to_datetime(df["date"]) < start_date].copy()
    if hist_df.empty:
        raise ValueError("Không có history trước start_date. Hãy chọn start_date > ngày đầu dữ liệu.")

    hist_df = hist_df.tail(int(hist_days)).copy()
    hist_series = pd.Series(hist_df[target_col].astype(float).values, index=pd.to_datetime(hist_df["date"]))
    hist_series = hist_series.sort_index()

    if len(hist_series) < 8:
        raise ValueError("History quá ngắn (<8 ngày). Cần đủ để tạo lag/rolling.")

    future_dates = pd.date_range(start_date, periods=int(horizon_days), freq="D")

    preds = []
    hist_ext = hist_series.copy()

    for d in future_dates:
        feat = _make_feature_row(expected, hist_ext, d, holiday_mmdd, holiday_window_days)
        X = pd.DataFrame([feat], columns=expected)

        pred_raw = float(model.predict(X)[0])
        pred = _transform_pred(pred_raw, transform_mode, transform_scale)

        if clip_negative_to_zero and pred < 0:
            pred_out = 0.0
        else:
            pred_out = pred

        preds.append(
            {
                "date": d,
                "prediction_raw": pred_raw,
                "prediction": pred_out,
                "transform_mode": transform_mode,
                "transform_scale": float(transform_scale),
            }
        )

        # IMPORTANT: append what?
        # - If append_transformed_to_history=True: append pred_out (đúng đơn vị) để lag/rolling match.
        # - Else: giữ hành vi cũ (append raw)
        hist_ext.loc[d] = pred_out if append_transformed_to_history else pred_raw

    return pd.DataFrame(preds), expected, last_date, start_date


def forecast_all_targets(
    df_daily: pd.DataFrame,
    model_order,
    model_line,
    horizon_days: int,
    start_date: pd.Timestamp | None,
    holiday_mmdd: list[str],
    holiday_window_days: int,
    hist_days: int = 365,
    clip_negative_to_zero: bool = True,
    # NEW:
    order_transform_mode: str = "raw",
    order_transform_scale: float = 1.0,
    line_transform_mode: str = "raw",
    line_transform_scale: float = 1.0,
    append_transformed_to_history: bool = True,
):
    pred_order, exp_order, last_date, used_start = forecast_recursive(
        df_daily=df_daily,
        model=model_order,
        target_col="daily_revenue_order",
        horizon_days=horizon_days,
        start_date=start_date,
        holiday_mmdd=holiday_mmdd,
        holiday_window_days=holiday_window_days,
        hist_days=hist_days,
        clip_negative_to_zero=clip_negative_to_zero,
        transform_mode=order_transform_mode,
        transform_scale=order_transform_scale,
        append_transformed_to_history=append_transformed_to_history,
    )
    pred_line, exp_line, _, _ = forecast_recursive(
        df_daily=df_daily,
        model=model_line,
        target_col="daily_revenue_line",
        horizon_days=horizon_days,
        start_date=used_start,
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
    return out, debug


# ==============================
# 7) UI TABS
# ==============================
tab_lead, tab_customer, tab_forecast = st.tabs([
    "🧲 Lead Scoring",
    "👤 Customer Intelligence",
    "📈 Forecast (Daily Revenue)",
])


# ==============================
# TAB 1: LEAD
# ==============================
with tab_lead:
    st.subheader("🧲 Lead Scoring (model_cls_onehot + model_reg_onehot)")

    if model_cls is None or model_reg is None or feature_columns is None:
        st.error("Lead models hoặc feature_columns chưa load được. Xem sidebar để biết file nào lỗi.")
    else:
        with st.form("lead_form"):
            name = st.text_input("Họ và tên", "")
            email = st.text_input("Email", "email@example.com")
            phone = st.text_input("SĐT", "0123456789")
            product_interest = st.text_input("Sản phẩm quan tâm", "Son dưỡng ...")
            total_interactions_input = st.number_input("Số lượt tương tác", 0, 100, 0, 1)

            col1, col2 = st.columns(2)
            with col1:
                source = st.selectbox(
                    "Nguồn (source)",
                    ["InBound", "FacebookAds", "TiktokAds", "Referral", "Website", "Other"],
                    0
                )
            with col2:
                priority = st.selectbox("Độ ưu tiên", ["low", "medium", "high", "urgent"], 1)

            selected_tags = st.multiselect("Tags", options=available_tags, default=[])

            submitted = st.form_submit_button("Predict Lead")

        if submitted:
            payload = {
                "source": source,
                "status": "new",
                "lead_score": 50,
                "priority": priority,
                "campaign_id": None,
                "product_interest": product_interest,
                "assigned_to": None,
                "days_since_created": 0,
                "total_interactions": int(total_interactions_input),
                "last_interaction_type": "form",
                "tags": selected_tags,
                "name": name,
                "email": email,
                "phone": phone,
            }

            X_row = build_features_from_payload(payload)
            prob = predict_prob(model_cls, X_row)
            value = float(model_reg.predict(X_row)[0])

            now = datetime.now(timezone.utc).isoformat()
            st.metric("Xác suất chuyển đổi", f"{prob:.2%}")
            st.metric("Doanh thu dự kiến", f"{value:,.0f} VND")

            st.subheader("Debug features (non-zero, top 50)")
            nz = X_row.loc[0, X_row.loc[0] != 0]
            st.write(nz.sort_values(ascending=False).head(50))

            st.subheader("Output JSON")
            st.json({
                "lead": payload,
                "predicted_prob": prob,
                "predicted_value": value,
                "predicted_value_currency": "VND",
                "last_predicted_at": now,
            })


# ==============================
# TAB 2: CUSTOMER
# ==============================
with tab_customer:
    st.subheader("👤 Customer Intelligence (churn_model + kmeans + clv bundles)")

    churn_model = get_model("churn_model")
    kmeans_model = get_model("kmeans_seg")

    # -------- 1) CHURN --------
    st.markdown("### 1) Churn")
    if churn_model is None:
        st.error("churn_model.pkl chưa load được (xem sidebar).")
    else:
        churn_cols = get_expected_columns(churn_model)
        with st.expander("Xem schema churn_model đang cần", expanded=False):
            st.write(churn_cols if churn_cols else "Không có feature_names_in_. Bạn cần dùng schema đúng lúc train churn.")

        default_churn = make_template_json(churn_cols) if churn_cols else {
            "recency_days": 45,
            "orders_90d": 2,
            "revenue_365d": 5400000,
        }

        churn_txt = st.text_area(
            "Churn JSON",
            value=json.dumps(default_churn, indent=2),
            height=220,
            key="churn_json"
        )

        if st.button("Predict Churn"):
            try:
                req = json.loads(churn_txt)
                st.json(predict_churn(req))
            except Exception as e:
                st.exception(e)

    st.divider()

    # -------- 2) SEGMENTATION --------
    st.markdown("### 2) Segmentation (KMeans)")
    if kmeans_model is None:
        st.error("kmeans_customer_segmentation.joblib chưa load được (xem sidebar).")
    else:
        seg_cols = get_expected_columns(kmeans_model)
        with st.expander("Xem schema kmeans đang cần", expanded=False):
            st.write(seg_cols if seg_cols else "Không có feature_names_in_. Có thể bạn đã train KMeans trên numpy array sau preprocess.")

        default_seg = {
            "Recency": 18,
            "Frequency": 6,
            "Monetary": 4200000,
            "Discount_Sensitivity": 0.25,
            "Category_Breadth": 2
        }

        seg_txt = st.text_area(
            "Segmentation JSON",
            value=json.dumps(default_seg, indent=2),
            height=220,
            key="seg_json"
        )

        st.caption("Đặt tên segment theo business: nhập JSON map id->name.")
        seg_map_txt = st.text_area(
            "SEGMENT_MAP JSON",
            value=json.dumps(
                {
                    "0": "Regular / Low Engagement",
                    "1": "Lost / Inactive",
                    "2": "High-Value – Waiting-for-sale",
                },
                indent=2
            ),
            height=140,
            key="seg_map_json"
        )

        debug_seg = st.checkbox("Show debug distances_to_centers", value=True)

        if st.button("Predict Segment"):
            try:
                req = json.loads(seg_txt)
                seg_map = json.loads(seg_map_txt)
                res = predict_segment(req, seg_map=seg_map, debug=debug_seg)
                st.json(res)
            except Exception as e:
                st.exception(e)

        centers = cluster_profile_table(kmeans_model)
        if centers is not None:
            with st.expander("📌 Cluster centers (để hiểu Segment là gì)", expanded=True):
                st.dataframe(centers, use_container_width=True)

    st.divider()

    # -------- 3) CLV (multi-horizon) --------
    st.markdown("### 3) CLV (1m / 3m / 6m / 12m)")

    available_h = []
    for h, key in [("1m", "clv_bundle_1m"), ("3m", "clv_bundle_3m"), ("6m", "clv_bundle_6m")]:
        if MODEL_INFO.get(key, {}).get("ok"):
            available_h.append(h)

    if MODEL_INFO.get("clv_bundle_12m", {}).get("ok") or MODEL_INFO.get("clv_bundle_12m_legacy", {}).get("ok"):
        available_h.append("12m")

    if not available_h:
        st.error("Không có CLV bundle nào load được. Hãy copy clv_model_bundle_{1m,3m,6m,12m}.joblib vào /models.")
    else:
        default_idx = available_h.index("12m") if "12m" in available_h else 0
        h_selected = st.selectbox("Chọn horizon", options=available_h, index=default_idx)

        bundle_obj = get_clv_bundle_by_horizon(h_selected)

        with st.expander("Bundle keys / type (debug)", expanded=False):
            st.write("Selected horizon:", h_selected)
            st.write("Type:", str(type(bundle_obj)))
            if isinstance(bundle_obj, dict):
                st.write("Keys:", list(bundle_obj.keys()))

        pipe, expected_cols, target_is_log, meta = get_clv_expected_cols(bundle_obj)

        with st.expander("Schema (expected_cols) của horizon đang chọn", expanded=False):
            st.write(expected_cols if expected_cols else "Không có expected_cols. Hãy export bundle kèm expected_cols.")

        default_clv = make_clv_template(expected_cols)

        if "recency" in default_clv: default_clv["recency"] = 30
        if "frequency_90d" in default_clv: default_clv["frequency_90d"] = 3
        if "product_diversity" in default_clv: default_clv["product_diversity"] = 2
        if "return_rate" in default_clv: default_clv["return_rate"] = 0.05
        if "email_open_rate" in default_clv: default_clv["email_open_rate"] = 0.35
        if "support_ticket_count" in default_clv: default_clv["support_ticket_count"] = 0
        if "first_purchase_year" in default_clv: default_clv["first_purchase_year"] = 2025
        if "first_purchase_purchase_month" in default_clv: default_clv["first_purchase_purchase_month"] = 11
        if "first_purchase_dayofweek" in default_clv: default_clv["first_purchase_dayofweek"] = 2
        if "acquisition_cost" in default_clv: default_clv["acquisition_cost"] = 15.5
        if "log_monetary_90d" in default_clv: default_clv["log_monetary_90d"] = 14.0
        if "log_avg_order_value" in default_clv: default_clv["log_avg_order_value"] = 12.9

        clv_txt = st.text_area(
            f"CLV JSON ({h_selected})",
            value=json.dumps(default_clv, indent=2),
            height=240,
            key=f"clv_json_{h_selected}"
        )

        if st.button(f"Predict CLV ({h_selected})"):
            try:
                req = json.loads(clv_txt)
                st.json(predict_clv_multi(req, h_selected))
            except Exception as e:
                st.exception(e)


# ==============================
# TAB 3: FORECAST (FIXED + ALL)
# ==============================
with tab_forecast:
    st.subheader("📈 Forecast Daily Revenue (Fixed: correct features, ALL targets, no all-zeros)")
    st.caption("Upload daily_dataset_for_forecasting.csv (hoặc dataset daily tương tự). App sẽ dự đoán N ngày SAU ngày cuối file hoặc theo start_date bạn chọn.")

    model_order = get_model("xgb_order")
    model_line = get_model("xgb_line")

    if model_order is None or model_line is None:
        st.error("Thiếu xgb_daily_revenue_order.joblib hoặc xgb_daily_revenue_line.joblib trong /models.")
    else:
        up = st.file_uploader("Upload daily CSV", type=["csv"], key="upload_forecast_ds")
        if up is None:
            st.info("Upload dataset để forecast.")
        else:
            df = pd.read_csv(up)

            if "date" not in df.columns:
                st.error("CSV phải có cột `date`.")
            else:
                # Make sure we have a clean frame + base cols
                try:
                    df_clean = _ensure_base_time_cols(df)
                except Exception as e:
                    st.exception(e)
                    st.stop()

                last_date = pd.to_datetime(df_clean["date"]).max()
                st.write(f"📌 Last date in file: **{last_date.date()}**")

                mode = st.selectbox(
                    "Chế độ dự đoán",
                    ["ALL (order + line)", "Chọn 1 target"],
                    index=0
                )

                horizon = int(st.number_input("Forecast bao nhiêu ngày?", min_value=1, max_value=365, value=30, step=1))
                hist_days = int(st.number_input("Dùng bao nhiêu ngày lịch sử để tính lag/rolling?", min_value=60, max_value=2000, value=365, step=10))

                start_mode = st.selectbox(
                    "Start date",
                    ["Tự động = ngày sau last_date", "Chọn bằng date picker"],
                    index=0
                )
                if start_mode == "Chọn bằng date picker":
                    start_date = st.date_input("Chọn start_date", value=(last_date + pd.Timedelta(days=1)).date())
                    start_date = pd.Timestamp(start_date)
                else:
                    start_date = None  # auto = last_date + 1 day

                default_holidays = ["01-01", "02-14", "03-08", "04-30", "05-01", "09-02", "10-20", "11-11", "12-12", "12-25"]
                holiday_mmdd = st.text_input("Holiday mm-dd (phân tách bằng dấu phẩy)", ",".join(default_holidays))
                holiday_mmdd = [x.strip() for x in holiday_mmdd.split(",") if x.strip()]
                holiday_window_days = int(st.number_input("Holiday window days (+/-)", min_value=0, max_value=30, value=3, step=1))

                clip_negative_to_zero = st.checkbox("Clip dự đoán âm về 0 (hiển thị)", value=True)

                # NEW: transform controls + calibrator
                st.markdown("### 🔁 Output Transform / Scale (Fix lệch ~3x / log / đơn vị)")
                st.caption("Nếu dự đoán thấp hơn thực tế ~hằng số (vd ~3 lần), thường là thiếu inverse transform (log) hoặc scale. Bạn có thể auto-calibrate bằng backtest one-step.")

                append_transformed_to_history = st.checkbox(
                    "Append giá trị đã transform vào history (khuyến nghị để lag/rolling đúng đơn vị)",
                    value=True
                )

                colT1, colT2, colT3, colT4 = st.columns(4)
                with colT1:
                    transform_mode_ui = st.selectbox(
                        "Transform mode (manual)",
                        ["raw", "expm1", "raw_scale", "expm1_scale"],
                        index=0
                    )
                with colT2:
                    transform_scale_ui = float(st.number_input("Scale (manual)", min_value=0.000001, max_value=1e12, value=1.0, step=1.0, format="%.6f"))
                with colT3:
                    bt_days = int(st.number_input("Backtest window days", min_value=7, max_value=365, value=60, step=1))
                with colT4:
                    min_hist_bt = int(st.number_input("Min history days (backtest)", min_value=7, max_value=120, value=28, step=1))

                # store recommended transform in session_state
                if "forecast_reco" not in st.session_state:
                    st.session_state["forecast_reco"] = {
                        "order": {"mode": "raw", "scale": 1.0},
                        "line": {"mode": "raw", "scale": 1.0},
                        "last_bt_table": None,
                    }

                if st.button("Auto-calibrate transform (one-step backtest)"):
                    try:
                        end_bt = pd.to_datetime(last_date)
                        start_bt = end_bt - pd.Timedelta(days=int(bt_days))
                        start_bt_str = str(start_bt.date())
                        end_bt_str = str(end_bt.date())

                        st.write(f"Backtest range: {start_bt_str} → {end_bt_str}")

                        # order
                        bt_order = backtest_one_step(
                            df_daily=df_clean,
                            model=model_order,
                            target_col="daily_revenue_order",
                            start_date=start_bt_str,
                            end_date=end_bt_str,
                            holiday_mmdd=holiday_mmdd,
                            holiday_window_days=holiday_window_days,
                            min_hist=min_hist_bt,
                        )
                        eval_order, med_ratio_order = eval_transform_candidates(bt_order)

                        # line
                        bt_line = backtest_one_step(
                            df_daily=df_clean,
                            model=model_line,
                            target_col="daily_revenue_line",
                            start_date=start_bt_str,
                            end_date=end_bt_str,
                            holiday_mmdd=holiday_mmdd,
                            holiday_window_days=holiday_window_days,
                            min_hist=min_hist_bt,
                        )
                        eval_line, med_ratio_line = eval_transform_candidates(bt_line)

                        best_order = eval_order.iloc[0].to_dict()
                        best_line = eval_line.iloc[0].to_dict()

                        st.session_state["forecast_reco"] = {
                            "order": {"mode": str(best_order["mode"]), "scale": float(best_order["scale"])},
                            "line": {"mode": str(best_line["mode"]), "scale": float(best_line["scale"])},
                            "last_bt_table": {
                                "order": eval_order,
                                "line": eval_line,
                                "median_ratio_order": float(med_ratio_order),
                                "median_ratio_line": float(med_ratio_line),
                            }
                        }

                        st.success("✅ Auto-calibrate xong. Xem bảng bên dưới và chọn Apply.")
                    except Exception as e:
                        st.exception(e)

                if st.session_state.get("forecast_reco", {}).get("last_bt_table") is not None:
                    with st.expander("📌 Backtest transform evaluation (order/line)", expanded=True):
                        tb = st.session_state["forecast_reco"]["last_bt_table"]
                        st.write("Median ratio (actual/pred_raw) order:", tb.get("median_ratio_order"))
                        st.dataframe(tb["order"], use_container_width=True)
                        st.write("Median ratio (actual/pred_raw) line:", tb.get("median_ratio_line"))
                        st.dataframe(tb["line"], use_container_width=True)

                apply_reco = st.checkbox("Apply recommended transform (from auto-calibrate)", value=False)

                # Effective transform for each model
                if apply_reco and st.session_state.get("forecast_reco"):
                    order_mode_eff = st.session_state["forecast_reco"]["order"]["mode"]
                    order_scale_eff = float(st.session_state["forecast_reco"]["order"]["scale"])
                    line_mode_eff = st.session_state["forecast_reco"]["line"]["mode"]
                    line_scale_eff = float(st.session_state["forecast_reco"]["line"]["scale"])
                else:
                    order_mode_eff = transform_mode_ui
                    order_scale_eff = transform_scale_ui
                    line_mode_eff = transform_mode_ui
                    line_scale_eff = transform_scale_ui

                st.caption(
                    f"Effective transform: order=({order_mode_eff}, scale={order_scale_eff:g}) | "
                    f"line=({line_mode_eff}, scale={line_scale_eff:g})"
                )

                if mode == "Chọn 1 target":
                    target = st.selectbox("Chọn target", ["daily_revenue_order", "daily_revenue_line"], index=0)
                    model = model_order if target == "daily_revenue_order" else model_line

                    # choose effective transform for selected target
                    if target == "daily_revenue_order":
                        tmode = order_mode_eff
                        tscale = order_scale_eff
                    else:
                        tmode = line_mode_eff
                        tscale = line_scale_eff

                    with st.expander("Debug: expected features (model expects)", expanded=False):
                        st.write(_get_xgb_expected_features(model))

                    if st.button("Run Forecast", key="run_forecast_btn_one"):
                        try:
                            pred_df, expected, last_date2, used_start = forecast_recursive(
                                df_daily=df_clean,
                                model=model,
                                target_col=target,
                                horizon_days=horizon,
                                start_date=start_date,
                                holiday_mmdd=holiday_mmdd,
                                holiday_window_days=holiday_window_days,
                                hist_days=hist_days,
                                clip_negative_to_zero=clip_negative_to_zero,
                                transform_mode=tmode,
                                transform_scale=tscale,
                                append_transformed_to_history=append_transformed_to_history,
                            )

                            st.success(f"✅ Start date used: {pd.to_datetime(used_start).date()}")

                            st.subheader("Forecast output (future days)")
                            st.dataframe(pred_df, use_container_width=True)

                            st.subheader("Chart: history vs forecast")
                            hist_plot = df_clean[["date", target]].dropna().tail(180).copy()
                            hist_plot = hist_plot.rename(columns={target: "value"})
                            hist_plot["type"] = "history"

                            fc_plot = pred_df[["date", "prediction"]].copy()
                            fc_plot = fc_plot.rename(columns={"prediction": "value"})
                            fc_plot["type"] = "forecast"

                            chart_df = pd.concat([hist_plot[["date", "value", "type"]], fc_plot[["date", "value", "type"]]], ignore_index=True)
                            st.line_chart(chart_df, x="date", y="value", color="type")

                            st.download_button(
                                "Download forecast CSV",
                                data=pred_df.to_csv(index=False).encode("utf-8"),
                                file_name=f"forecast_future_{target}_{horizon}d.csv",
                                mime="text/csv"
                            )

                        except Exception as e:
                            st.exception(e)

                else:
                    with st.expander("Debug: expected features (order/line)", expanded=False):
                        st.write("Order expected:", _get_xgb_expected_features(model_order))
                        st.write("Line expected :", _get_xgb_expected_features(model_line))

                    if st.button("Run Forecast (ALL)", key="run_forecast_btn_all"):
                        try:
                            out_df, debug = forecast_all_targets(
                                df_daily=df_clean,
                                model_order=model_order,
                                model_line=model_line,
                                horizon_days=horizon,
                                start_date=start_date,
                                holiday_mmdd=holiday_mmdd,
                                holiday_window_days=holiday_window_days,
                                hist_days=hist_days,
                                clip_negative_to_zero=clip_negative_to_zero,
                                order_transform_mode=order_mode_eff,
                                order_transform_scale=order_scale_eff,
                                line_transform_mode=line_mode_eff,
                                line_transform_scale=line_scale_eff,
                                append_transformed_to_history=append_transformed_to_history,
                            )

                            st.subheader("Debug")
                            st.json(debug)

                            st.subheader("Forecast output (ALL)")
                            st.dataframe(out_df, use_container_width=True)

                            # Chart (two targets)
                            st.subheader("Chart: history vs forecast (order)")
                            hist_order = df_clean[["date", "daily_revenue_order"]].dropna().tail(180).copy()
                            hist_order = hist_order.rename(columns={"daily_revenue_order": "value"})
                            hist_order["type"] = "history"

                            fc_order = out_df[["date", "pred_order"]].copy().rename(columns={"pred_order": "value"})
                            fc_order["type"] = "forecast"
                            chart_order = pd.concat([hist_order, fc_order], ignore_index=True)
                            st.line_chart(chart_order, x="date", y="value", color="type")

                            st.subheader("Chart: history vs forecast (line)")
                            hist_line = df_clean[["date", "daily_revenue_line"]].dropna().tail(180).copy()
                            hist_line = hist_line.rename(columns={"daily_revenue_line": "value"})
                            hist_line["type"] = "history"

                            fc_line = out_df[["date", "pred_line"]].copy().rename(columns={"pred_line": "value"})
                            fc_line["type"] = "forecast"
                            chart_line = pd.concat([hist_line, fc_line], ignore_index=True)
                            st.line_chart(chart_line, x="date", y="value", color="type")

                            st.download_button(
                                "Download forecast CSV (ALL)",
                                data=out_df.to_csv(index=False).encode("utf-8"),
                                file_name=f"forecast_future_ALL_{horizon}d.csv",
                                mime="text/csv"
                            )

                        except Exception as e:
                            st.exception(e)
