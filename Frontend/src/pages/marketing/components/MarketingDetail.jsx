// src/pages/marketing/components/MarketingDetail.jsx
import React, { useState } from "react";
import { Calendar, DollarSign, Target, Tag, PackageSearch, CheckCircle, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/helper";
import { approveCampaign } from "@/services/campaign";
import SuccessDialog from "@/components/dialogs/SuccessDialog"; // <— dùng component bạn có

const formatPercent = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    const percent = n <= 1 && n >= 0 ? n * 100 : n;
    return `${percent.toFixed(1)}%`;
};

const KPI_LABELS = { leads: "Leads", cpl: "CPL", reach: "Tiếp cận", revenue: "Doanh thu", open_rate: "Open rate", click_rate: "Click rate", roi: "ROI" };
const KPI_FORMATTER = (key, val) => {
    if (key === "cpl" || key === "revenue") return formatCurrency(val);
    if (key === "open_rate" || key === "click_rate" || key === "roi") return formatPercent(val);
    const n = Number(val);
    return Number.isNaN(n) ? String(val) : n.toLocaleString("vi-VN");
};
const toArr = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
const mapStatus = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "running") return "Running";
    if (v === "completed") return "Completed";
    if (v === "paused") return "Paused";
    if (v === "draft") return "Draft";
    return "Draft";
};

export default function MarketingDetail({ data: c, onDelete, onEdit }) {
    if (!c) return null;

    const [localStatus, setLocalStatus] = useState(mapStatus(c.status));
    const [isApproving, setIsApproving] = useState(false);
    const [approveError, setApproveError] = useState("");

    // SuccessDialog state
    const [successOpen, setSuccessOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("Thao tác thành công.");

    const canApprove = localStatus === "Draft" || localStatus === "Paused";

    const handleApprove = async () => {
        try {
            setIsApproving(true);
            setApproveError("");

            const { ok, status, message } = await approveCampaign(c.campaign_id);
            if (!ok) throw new Error(message || "Không thể duyệt chiến dịch");

            setLocalStatus(mapStatus(status));
            setSuccessMessage(message || `${c.name || "Chiến dịch"} đã chuyển sang ${mapStatus(status)}`);
            setSuccessOpen(true);
        } catch (e) {
            setApproveError(e?.message || "Không thể duyệt chiến dịch");
        } finally {
            setIsApproving(false);
        }
    };

    const tf = c.target_filter || c.targetFilter || {};
    const ageMin = tf.age?.min ?? "";
    const ageMax = tf.age?.max ?? "";
    const genders = toArr(tf.gender).join(", ");
    const locations = toArr(tf.locations).join(", ");
    const interests = toArr(tf.interests).join(", ");

    const kpi = c.expected_kpi || c.expectedKPI || {};
    const hasKPI = Object.keys(kpi).length > 0;

    const banner = c.banner || "https://rubicmarketing.com/wp-content/uploads/2021/08/thiet-ke-banner-my-pham-1.jpg";

    return (
        <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-4">
            {/* Banner */}
            <div className="relative -mx-6 -mt-6">
                <img
                    src={banner}
                    alt="Campaign banner"
                    className="w-full h-90 object-cover rounded-t-xl"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <a href={banner} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-md hover:bg-black/80 transition">
                    Xem ảnh
                </a>
            </div>

            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold">{c.name}</h2>
                <div className="mt-1 flex gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">{c.channel}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">{localStatus}</span>
                    {c.data_source && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">{c.data_source}</span>
                    )}
                </div>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <DollarSign className="w-4 h-4 mt-0.5 text-emerald-600" />
                    <div>
                        <p className="text-xs text-gray-500">Ngân sách</p>
                        <p className="font-medium">{formatCurrency(c.budget)}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <Calendar className="w-4 h-4 mt-0.5 text-blue-600" />
                    <div>
                        <p className="text-xs text-gray-500">Thời gian</p>
                        <p className="font-medium">
                            {formatDate(c.start_date || c.startDate)} - {formatDate(c.end_date || c.endDate)}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <Tag className="w-4 h-4 mt-0.5 text-indigo-600" />
                    <div>
                        <p className="text-xs text-gray-500">Nguồn dữ liệu</p>
                        <p className="font-medium">{c.data_source || c.dataSource || "—"}</p>
                    </div>
                </div>
            </div>

            {/* Target filter */}
            <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-rose-600" />
                    <h3 className="font-semibold">Đối tượng mục tiêu</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-gray-500">Độ tuổi:</span> {ageMin || "—"} - {ageMax || "—"}</div>
                    <div><span className="text-gray-500">Giới tính:</span> {genders || "—"}</div>
                    <div><span className="text-gray-500">Khu vực:</span> {locations || "—"}</div>
                    <div><span className="text-gray-500">Sở thích:</span> {interests || "—"}</div>
                    {tf.note && (<div className="md:col-span-2 text-gray-700"><span className="text-gray-500">Ghi chú:</span> {tf.note}</div>)}
                </div>
            </div>

            {/* KPI */}
            <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">KPI kỳ vọng</h3>
                {hasKPI ? (
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(kpi).map(([k, v]) => (
                            <span key={k} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                {KPI_LABELS[k] || k}: <strong>{KPI_FORMATTER(k, v)}</strong>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">—</p>
                )}
            </div>

            {/* Products */}
            <div className="border rounded-lg">
                <div className="flex items-center gap-2 p-4">
                    <PackageSearch className="w-4 h-4 text-amber-600" />
                    <h3 className="font-semibold">Sản phẩm gợi ý / liên quan</h3>
                </div>

                {Array.isArray(c.products || []) && (c.products || []).length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {(c.products || []).slice().sort((a, b) => (a?.name || "").localeCompare(b?.name || "")).map((p, i) => (
                            <li key={i} className="p-3 grid grid-cols-[1fr,120px] gap-4 items-start hover:bg-gray-50 transition rounded-lg">
                                {/* LEFT */}
                                <div className="space-y-1 min-h-[88px]">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-gray-900">{p.name || "—"}</span>
                                        {p.category && (
                                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                {p.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                                        {p.product_id && <span className="font-mono">#{p.product_id}</span>}
                                        {p.variant_id && <span className="font-mono">· v:{p.variant_id}</span>}
                                        {typeof p.discount === "number" && <span className="text-green-600">· -{p.discount}%</span>}
                                        {typeof p.quantity === "number" && <span>· SL: {p.quantity.toLocaleString("vi-VN")}</span>}
                                    </div>
                                    {p.reason && <p className="text-xs text-gray-600 leading-relaxed">{p.reason}</p>}
                                </div>

                                {/* RIGHT (PRICE) */}
                                <div className="text-right">
                                    <div className="text-sm font-semibold">
                                        {p.price_current != null ? formatCurrency(p.price_current) : "—"}
                                    </div>
                                    {typeof p.discount === "number" && (
                                        <div className="text-[11px] text-green-600 mt-0.5">Tiết kiệm {p.discount}%</div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 px-4 pb-4">Chưa có sản phẩm.</p>
                )}
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                    className={`px-3 py-2 rounded-lg text-sm text-white ${canApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 cursor-not-allowed"} flex items-center gap-2`}
                    onClick={handleApprove}
                    disabled={!canApprove || isApproving}
                    title={canApprove ? "Duyệt chiến dịch (chuyển sang Running)" : "Chỉ duyệt khi đang Draft/Paused"}
                >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Duyệt
                </button>

                <button className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50" onClick={() => onEdit?.(c)}>
                    Chỉnh sửa
                </button>
                <button className="px-3 py-2 rounded-lg border border-red-300 text-sm text-red-600 hover:bg-red-50" onClick={() => onDelete?.(c.id || c.campaign_id)}>
                    Xóa
                </button>
            </div>

            {approveError && <div className="text-xs text-red-600">{approveError}</div>}

            {/* Timestamps */}
            <div className="text-xs text-gray-400">
                {c.created_at && <>Tạo: {new Date(c.created_at).toLocaleString("vi-VN")} · </>}
                {c.updated_at && <>Cập nhật: {new Date(c.updated_at).toLocaleString("vi-VN")}</>}
            </div>

            {/* Success Dialog */}
            <SuccessDialog
                open={successOpen}
                onClose={() => setSuccessOpen(false)}
                title="Thành công"
                message={successMessage}
            />
        </div>
    );
}
