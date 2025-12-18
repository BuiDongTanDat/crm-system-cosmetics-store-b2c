import streamlit as st
import pandas as pd
import numpy as np
import joblib
import re
from datetime import datetime, timezone

# ==============================
# 1. CONFIG STREAMLIT
# ==============================
st.set_page_config(page_title="Lead Scoring App", layout="wide")

st.title("📊 Lead Scoring & Revenue Prediction")
st.write("Điền thông tin liên hệ, hệ thống sẽ dự đoán xác suất chuyển đổi và doanh thu dự kiến.")

# ==============================
# 2. LOAD MODELS & FEATURE COLUMNS
# ==============================

@st.cache_resource
def load_models():
    model_cls = joblib.load("models/model_cls_onehot.pkl")
    model_reg = joblib.load("models/model_reg_onehot.pkl")
    feature_columns = joblib.load("models/feature_columns_onehot.pkl")
    return model_cls, model_reg, feature_columns

model_cls, model_reg, feature_columns = load_models()

# Suy ra các cột tag_* từ feature_columns (tag_vip, tag_quan-tam-son, ...)
tag_feature_cols = [c for c in feature_columns if c.startswith("tag_")]
available_tags = sorted([c.replace("tag_", "") for c in tag_feature_cols])

# ==============================
# 3. CẤU HÌNH FEATURE + HÀM TIỀN XỬ LÝ
# ==============================

# Cột categorical giống lúc training
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
    col = re.sub(r'[^0-9a-zA-Z_]+', '_', col)
    return col

def build_features_from_payload(payload: dict) -> pd.DataFrame:
    """
    Nhận payload high-level (source, status, product_interest, tags, total_interactions, ...),
    build 1 dòng DataFrame theo đúng format lúc training.
    """

    # Các default giống lúc training
    row = {
        # base lead fields
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

        # product fields - form không có nên set default
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

    # ====== xử lý TAGS -> các cột tag_* giống khi training ======
    tags = payload.get("tags", []) or []
    if not isinstance(tags, list):
        tags = [tags]
    tags = [str(t) for t in tags]

    for tcol in tag_feature_cols:
        tag_name = tcol.replace("tag_", "")
        row[tcol] = 1 if tag_name in tags else 0
    # ============================================================

    df_row = pd.DataFrame([row])

    # ép object -> str
    obj_cols = df_row.select_dtypes(include="object").columns
    for c in obj_cols:
        df_row[c] = df_row[c].astype(str)

    # one-hot
    df_row_dum = pd.get_dummies(df_row, columns=categorical_cols)

    # sanitize tên cột
    df_row_dum.columns = [sanitize_col(c) for c in df_row_dum.columns]

    # align với feature_columns
    df_row_dum = df_row_dum.reindex(columns=feature_columns, fill_value=0)

    return df_row_dum

def is_valid_email(email: str) -> bool:
    if not email:
        return False
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return re.match(pattern, email) is not None

def is_valid_phone(phone: str) -> bool:
    if not phone:
        return False
    digits = re.sub(r"\D", "", phone)
    return len(digits) >= 9  # ví dụ: >= 9 số coi là tạm hợp lệ

def build_ai_reason(payload: dict, prob: float) -> str:
    reasons = []
    source = payload.get("source", "InBound")
    product_interest = payload.get("product_interest", "")
    email = payload.get("email", "")
    phone = payload.get("phone", "")
    tags = payload.get("tags", []) or []
    total_interactions = payload.get("total_interactions", 0)

    # Nguồn
    if source in ["InBound", "Referral", "Partner"]:
        reasons.append(f"Nguồn {source} thường có chất lượng lead tốt.")
    else:
        reasons.append(f"Nguồn {source} có thể cần thêm thời gian nuôi dưỡng.")

    # Sản phẩm
    if product_interest:
        reasons.append("Lead có quan tâm sản phẩm cụ thể.")
    else:
        reasons.append("Lead chưa nêu rõ sản phẩm quan tâm.")

    # Tags
    if "vip" in tags:
        reasons.append("Lead được gắn tag VIP, nên ưu tiên xử lý.")
    if "quan-tam-son" in tags:
        reasons.append("Lead có tag quan-tam-son, phù hợp các chiến dịch về son môi.")
    if tags and "vip" not in tags and "quan-tam-son" not in tags:
        reasons.append(f"Lead có các tag: {', '.join(tags)}.")

    # Email / Phone
    if is_valid_email(email):
        reasons.append("Email hợp lệ, có thể liên hệ qua kênh email.")
    else:
        reasons.append("Email chưa hợp lệ hoặc bị để trống.")

    if not is_valid_phone(phone):
        reasons.append("Số điện thoại không đầy đủ/hợp lệ, gây khó khăn cho việc liên hệ trực tiếp.")
    else:
        reasons.append("Số điện thoại có vẻ hợp lệ, dễ dàng liên hệ trực tiếp.")

    # Total interactions
    if total_interactions >= 3:
        reasons.append("Lead đã có nhiều lượt tương tác, thể hiện sự quan tâm.")
    elif total_interactions == 0:
        reasons.append("Lead chưa có tương tác, cần bước chăm sóc ban đầu.")

    # Based on prob
    if prob >= 0.7:
        reasons.append("Mô hình đánh giá xác suất chuyển đổi cao, nên ưu tiên chăm sóc lead này.")
    elif prob >= 0.4:
        reasons.append("Mô hình đánh giá xác suất chuyển đổi trung bình, nên tiếp tục nuôi dưỡng.")
    else:
        reasons.append("Mô hình đánh giá xác suất chuyển đổi thấp, có thể xếp ưu tiên thấp hơn.")

    return " ".join(reasons)

# ==============================
# 4. GIAO DIỆN FORM THÔNG TIN LIÊN HỆ
# ==============================

st.subheader("📨 Thông Tin Liên Hệ")
st.write("Điền thông tin để chúng tôi liên hệ với bạn.")

with st.form("contact_form"):
    name = st.text_input("Họ và tên *", "")
    email = st.text_input("Email *", "email@example.com")
    phone = st.text_input("SĐT *", "0123456")
    product_interest = st.text_input(
        "Sản phẩm quan tâm",
        value="Son Tint Lì Mastige Blur Lâu Trôi Màu B5 Đỏ Gạch 3.8g",
    )
    note = st.text_area(
        "Ghi chú",
        value="Quan tâm sản phẩm: Son Tint Lì Mastige Blur Lâu Trôi Màu B5 Đỏ Gạch 3.8g"
    )

    total_interactions_input = st.number_input(
        "Số lượt tương tác với khách này",
        min_value=0,
        max_value=100,
        value=0,
        step=1,
    )

    # Chọn tags từ các tag_* đã có trong model
    selected_tags = st.multiselect(
        "Tags (gắn nhãn lead)",
        options=available_tags,
        default=[],
        help="Ví dụ: vip, quan-tam-son,... nếu các tag này đã được dùng khi training",
    )

    # cho phép chỉnh source/priority nếu muốn
    col_conf1, col_conf2 = st.columns(2)
    with col_conf1:
        source = st.selectbox(
            "Nguồn (source)",
            options=["InBound", "FacebookAds", "TiktokAds", "Referral", "Website", "Other"],
            index=0,
        )
    with col_conf2:
        priority = st.selectbox(
            "Độ ưu tiên",
            options=["low", "medium", "high", "urgent"],
            index=1,
        )

    submitted = st.form_submit_button("🚀 Gửi Thông Tin & Dự đoán")

# ==============================
# 5. PREDICT & XÂY DỰNG OUTPUT
# ==============================

if submitted:
    # build payload cho model
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
        # thêm info để ai_reason sử dụng
        "name": name,
        "email": email,
        "phone": phone,
        "note": note,
    }

    X_row = build_features_from_payload(payload)

    prob = float(model_cls.predict(X_row)[0])
    value = float(model_reg.predict(X_row)[0])
    converted = int(prob >= 0.5)

    # build ai_reason giống style bạn muốn
    ai_reason = build_ai_reason(payload, prob)

    # build output object giống format bạn đưa
    now = datetime.now(timezone.utc).isoformat()

    output_obj = {
        "customer_id": None,
        "name": name or None,
        "phone": phone or None,
        "email": email or None,
        "source": source,
        "status": "new",
        "campaign_id": payload.get("campaign_id"),
        "tags": selected_tags,
        "lead_score": payload.get("lead_score", 50),
        "conversion_prob": prob,
        "assigned_to": payload.get("assigned_to"),
        "created_at": now,
        "priority": priority,
        "product_interest": product_interest or None,
        "deal_name": None,
        "predicted_prob": prob,
        "predicted_value": value,
        "predicted_value_currency": "VND",
        "last_predicted_at": now,
        "note": note or None,
        "ai_reason": ai_reason,
    }

    # Hiển thị kết quả
    st.subheader("🔮 Kết quả dự đoán")

    col_a, col_b, col_c = st.columns(3)
    with col_a:
        st.metric("Xác suất chuyển đổi", f"{prob:.2%}")
    with col_b:
        st.metric("Dự đoán có chuyển đổi?", "Có" if converted == 1 else "Không")
    with col_c:
        st.metric("Doanh thu dự kiến (30 ngày)", f"{value:,.0f} VND")

    st.write("---")
    st.subheader("🧾 Output object (JSON)")
    st.json(output_obj)

    st.write("🧠 AI reasoning:")
    st.write(ai_reason)
