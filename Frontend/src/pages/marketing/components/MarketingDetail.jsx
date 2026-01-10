// src/pages/marketing/components/MarketingDetail.jsx
import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  Target,
  Tag,
  PackageSearch,
  CheckCircle,
  Loader2,
  TrendingUp,
  Trash2,
  Edit,
  Send,
  ExternalLink,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/helper";
import {
  approveCampaign,
  runCampaign,
  listCampaignChannels,
  submitForApproval,
  rejectCampaign,
  approveProposal,
  getCampaignById,
} from "@/services/campaign";
import SuccessDialog from "@/components/dialogs/SuccessDialog";
import StatusHistory from "./StatusHistory";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formatPercent = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  const percent = n <= 1 && n >= 0 ? n * 100 : n;
  return `${percent.toFixed(1)}%`;
};

const KPI_LABELS = {
  leads: "Leads",
  cpl: "CPL",
  reach: "Tiếp cận",
  revenue: "Doanh thu",
  open_rate: "Open rate",
  click_rate: "Click rate",
  roi: "ROI",
};
const KPI_FORMATTER = (key, val) => {
  if (key === "cpl" || key === "revenue") return formatCurrency(val);
  if (key === "open_rate" || key === "click_rate" || key === "roi")
    return formatPercent(val);
  const n = Number(val);
  return Number.isNaN(n) ? String(val) : n.toLocaleString("vi-VN");
};
const toArr = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
const mapStatus = (s) => {
  const v = String(s || "").toLowerCase();
  const map = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Approved",
    configuring: "Configuring",
    running: "Running",
    paused: "Paused",
    completed: "Completed",
    rejected: "Rejected",
    //active: "Active",
  };
  return map[v] || "Draft";
};

export default function MarketingDetail({
  data: initialData,
  onDelete,
  onEdit,
  onStatusChange, // Thêm prop này
}) {
  const [c, setC] = useState(initialData);
  const [loading, setLoading] = useState(false);
  // Sync prop changes
  useEffect(() => {
    if (initialData) setC(initialData);
  }, [initialData]);

  // Fetch fresh data (history, settings)
  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      if (initialData?.campaign_id) {
        setLoading(true);
        try {
          const fresh = await getCampaignById(initialData.campaign_id);
          if (!ignore) {
            // Merge dữ liệu mới với dữ liệu cũ để tránh mất thông tin
            setC((prev) => ({
              ...initialData,
              ...fresh,
              // Đảm bảo giữ lại các trường quan trọng
              products: fresh.products || initialData.products || [],
              target_filter:
                fresh.target_filter || initialData.target_filter || {},
              expected_kpi:
                fresh.expected_kpi || initialData.expected_kpi || {},
            }));
          }
        } catch (err) {
          if (!ignore) {
            console.error("Fetch error:", err);
            setC(initialData);
          }
        } finally {
          if (!ignore) setLoading(false);
        }
      } else if (initialData) {
        setC(initialData);
        setLoading(false);
      } else {
        setC(null);
        setLoading(false);
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [initialData?.campaign_id]);

  // Sync prop changes - thêm dependency đầy đủ
  useEffect(() => {
    if (initialData && !loading) {
      setC((prevC) => {
        // Chỉ cập nhật nếu dữ liệu thực sự thay đổi
        if (JSON.stringify(prevC) !== JSON.stringify(initialData)) {
          return initialData;
        }
        return prevC;
      });
    }
  }, [initialData, loading]);

  if (!c) return null;

  const [localStatus, setLocalStatus] = useState(mapStatus(c.status));

  // Update localStatus when c.status changes
  useEffect(() => {
    setLocalStatus(mapStatus(c.status));
  }, [c.status]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [channels, setChannels] = useState([]);

  // Reject Dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // SuccessDialog state
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Thao tác thành công.");

  // Channels
  // const [addChannelOpen, setAddChannelOpen] = useState(false); // Moved to Edit Form

  // Load channels
  const loadChannels = () => {
    if (c.campaign_id) {
      listCampaignChannels(c.campaign_id)
        .then((res) => setChannels(res.items || []))
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    loadChannels();
  }, [c.campaign_id]);

  // Hàm helper để reload dữ liệu và cập nhật trạng thái
  const reloadCampaignData = async () => {
    if (initialData?.campaign_id) {
      try {
        const fresh = await getCampaignById(initialData.campaign_id);
        setC((prev) => ({
          ...initialData,
          ...fresh,
          products: fresh.products || initialData.products || [],
          target_filter: fresh.target_filter || initialData.target_filter || {},
          expected_kpi: fresh.expected_kpi || initialData.expected_kpi || {},
        }));
        setLocalStatus(mapStatus(fresh.status));
        // Gọi callback để parent component cũng reload
        if (onStatusChange) {
          await onStatusChange();
        }
      } catch (err) {
        console.error("Reload error:", err);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      
      // Validate status before submission
      if (!["Draft", "Rejected"].includes(localStatus)) {
        toast.error("Chỉ chiến dịch Draft hoặc Rejected mới được gửi duyệt");
        return;
      }

      const res = await submitForApproval(c.campaign_id);
      setSuccessMessage(res.message || "Đã gửi duyệt thành công");
      setSuccessOpen(true);
      await reloadCampaignData();
    } catch (e) {
      const errorMsg = e?.response?.data?.error?.message || 
                       
                       "Có lỗi xảy ra";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      
      if (localStatus !== "Submitted") {
        toast.error("Chỉ chiến dịch Submitted mới được từ chối");
        return;
      }

      const res = await rejectCampaign(c.campaign_id, rejectReason);
      setSuccessMessage(res.message || "Đã từ chối chiến dịch");
      setSuccessOpen(true);
      setRejectOpen(false);
      setRejectReason("");
      await reloadCampaignData();
    } catch (e) {
      const errorMsg = e?.response?.data?.error?.message || 
                       e?.response?.data?.message || 
                       e?.message || 
                       "Có lỗi xảy ra";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveProposal = async () => {
    try {
      setIsProcessing(true);
      
      if (localStatus !== "Submitted") {
        toast.error("Chỉ chiến dịch Submitted mới được duyệt");
        return;
      }

      const res = await approveProposal(c.campaign_id);
      setSuccessMessage(res.message || "Đã duyệt chiến dịch thành công");
      setSuccessOpen(true);
      await reloadCampaignData();
    } catch (e) {
      const errorMsg = e?.response?.data?.error?.message || 
                       e?.response?.data?.message || 
                       e?.message || 
                       "Có lỗi xảy ra";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRun = async () => {
    try {
      setIsProcessing(true);
      
      if (!["Approved", "Configuring", "Paused"].includes(localStatus)) {
        toast.error("Trạng thái không hợp lệ để chạy chiến dịch");
        return;
      }

      const { ok, status, message } = await approveCampaign(c.campaign_id, {
        status: "running",
      });
      if (!ok) throw new Error(message || "Lỗi khi chạy");
      setSuccessMessage("Chiến dịch đã được chạy thành công");
      setSuccessOpen(true);
      await reloadCampaignData();
    } catch (e) {
      const errorMsg = e?.response?.data?.error?.message || 
                       e?.response?.data?.message || 
                       e?.message || 
                       "Có lỗi xảy ra";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
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

  const banner =
    c.image ||
    c.banner ||
    "https://rubicmarketing.com/wp-content/uploads/2021/08/thiet-ke-banner-my-pham-1.jpg";

  return (
    <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-4">
      {/* Banner */}
      <div className="relative -mx-6 -mt-6">
        <img
          src={banner}
          alt="Campaign banner"
          className="w-full h-90 object-cover rounded-t-xl"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute bottom-2 right-2 flex gap-2 pr-2">
          <a
            href={banner}
            target="_blank"
            rel="noreferrer"
            className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-md hover:bg-black/80 transition flex items-center gap-1"
          >
            <Eye className="w-3 h-3" /> Xem ảnh
          </a>
          <a
            href={`/landing/campaigns/${c.campaign_id}`}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 transition flex items-center gap-1 shadow-lg"
          >
            <ExternalLink className="w-3 h-3" /> Xem Landing Page
          </a>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">{c.name}</h2>
        <div className="mt-1 flex gap-2">
          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
            {c.channel}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
            {localStatus}
          </span>
          {c.data_source && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              {c.data_source}
            </span>
          )}
        </div>
      </div>

      {/* Reject Alert */}
      {localStatus === "Rejected" && c.settings?.reject_reason && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-2">
          <p className="font-semibold text-sm">Chiến dịch bị từ chối</p>
          <p className="text-sm">Lý do: {c.settings.reject_reason}</p>
        </div>
      )}

      {/* Note / Description */}
      {c.note && (
        <div className="border rounded-lg p-4 bg-yellow-50/50">
          <h3 className="font-semibold text-sm mb-1 text-gray-700">Ghi chú</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.note}</p>
        </div>
      )}

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
              {formatDate(c.start_date || c.startDate)} -{" "}
              {formatDate(c.end_date || c.endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
          <Tag className="w-4 h-4 mt-0.5 text-indigo-600" />
          <div>
            <p className="text-xs text-gray-500">Nguồn dữ liệu</p>
            <p className="font-medium">
              {c.data_source || c.dataSource || "—"}
            </p>
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
          <div>
            <span className="text-gray-500">Độ tuổi:</span> {ageMin || "—"} -{" "}
            {ageMax || "—"}
          </div>
          <div>
            <span className="text-gray-500">Giới tính:</span> {genders || "—"}
          </div>
          <div>
            <span className="text-gray-500">Khu vực:</span> {locations || "—"}
          </div>
          <div>
            <span className="text-gray-500">Sở thích:</span> {interests || "—"}
          </div>
          {tf.note && (
            <div className="md:col-span-2 text-gray-700">
              <span className="text-gray-500">Ghi chú:</span> {tf.note}
            </div>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">KPI kỳ vọng</h3>
        {hasKPI ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(kpi).map(([k, v]) => (
              <span
                key={k}
                className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
              >
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
            {(c.products || [])
              .slice()
              .sort((a, b) => (a?.name || "").localeCompare(b?.name || ""))
              .map((p, i) => (
                <li
                  key={i}
                  className="p-3 flex gap-4 items-start hover:bg-gray-50 transition rounded-lg"
                >
                  {/* IMAGE */}
                  <div className="flex-shrink-0">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name || "Product"}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-gray-400"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* CENTER (BASIC INFO) */}
                  <div className="flex-1 space-y-1 min-h-[64px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {p.name || "—"}
                      </span>
                      {p.category && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {p.category}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                      {p.product_id && (
                        <span className="font-mono">
                          #{String(p.product_id).slice(-8)}
                        </span>
                      )}
                      {p.variant_id && (
                        <span className="font-mono">· v:{p.variant_id}</span>
                      )}
                      {typeof p.discount === "number" && (
                        <span className="text-green-600 font-semibold">
                          · -{p.discount}%
                        </span>
                      )}
                      {typeof p.quantity === "number" && (
                        <span>· SL: {p.quantity.toLocaleString("vi-VN")}</span>
                      )}
                    </div>
                    {p.reason && (
                      <p className="text-xs text-gray-600 leading-relaxed italic">
                        "{p.reason}"
                      </p>
                    )}
                  </div>

                  {/* RIGHT (PRICE) */}
                  <div className="text-right w-28 flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">
                      {p.price_current != null
                        ? formatCurrency(p.price_current)
                        : "—"}
                    </div>
                    {typeof p.discount === "number" && (
                      <div className="text-[11px] text-green-600 mt-0.5">
                        Tiết kiệm {p.discount}%
                      </div>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 px-4 pb-4">Chưa có sản phẩm.</p>
        )}
      </div>

      {/* Channels & Automation */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-purple-600" />
            Kênh & Automation
          </h3>
        </div>
        {channels.length > 0 ? (
          <div className="divide-y">
            {channels.map((ch, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm capitalize">
                    {ch.channel || ch.type}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ch.account_name && `${ch.account_name} · `}
                    Trạng thái:{" "}
                    <span className="font-medium">{ch.status || "Draft"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400">Flow ID</div>
                  <div className="text-xs font-mono">
                    {ch.flow_id ||
                      (ch.flows && ch.flows[0]?.flow_id) ||
                      "Chưa gán"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Chưa có kênh nào được cấu hình.
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-3 pt-3 border-t">
        {/* Draft / Rejected -> Submit */}
        {(localStatus === "Draft" || localStatus === "Rejected") && (
          <PermissionGuard module="campaign" action="update">
            <Button
              variant="actionCreate"
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              <Send className="w-4 h-4" />
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />} Gửi
              duyệt
            </Button>
          </PermissionGuard>
        )}

        {/* Submitted -> Approve / Reject */}
        {localStatus === "Submitted" && (
          <>
            <PermissionGuard module="campaign" action="approve">
              <div className="flex">
                <Button
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={isProcessing}
                  className="rounded-none rounded-tl-md rounded-bl-md"
                >
                  Từ chối
                </Button>
                <Button
                  variant="actionApprove"
                  onClick={handleApproveProposal}
                  disabled={isProcessing}
                  className="rounded-none rounded-tr-md rounded-br-md"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                  Duyệt chiến dịch
                </Button>
              </div>
            </PermissionGuard>
          </>
        )}

        {/* Configuring / Running / Paused -> Run/Pause */}
        {(localStatus === "Configuring" ||
          localStatus === "Running" ||
          localStatus === "Paused" ||
          localStatus === "Approved") && (
            <PermissionGuard module="campaign" action="run">
              {/* Chỉ hiện nút Chạy khi đã có kênh và gắn flow */}
              {channels.length > 0 &&
                channels.some(
                  (ch) => ch.flow_id || (ch.flows && ch.flows.length > 0)
                ) ? (
                localStatus === "Running" ? (
                  <Button
                    className="px-3 py-2 rounded-lg flex gap-2 items-center text-sm text-white bg-amber-500 hover:bg-amber-600"
                    onClick={async () => {
                      try {
                        setIsProcessing(true);
                        
                        if (localStatus !== "Running") {
                          toast.error("Chỉ chiến dịch đang chạy mới được tạm dừng");
                          return;
                        }

                        const { ok, message } = await approveCampaign(c.campaign_id, {
                          status: "paused",
                        });
                        if (!ok) throw new Error(message || "Lỗi khi tạm dừng");
                        setSuccessMessage("Đã tạm dừng chiến dịch");
                        setSuccessOpen(true);
                        await reloadCampaignData();
                      } catch (e) {
                        const errorMsg = e?.response?.data?.error?.message || 
                                         e?.response?.data?.message || 
                                         e?.message || 
                                         "Có lỗi xảy ra";
                        toast.error(typeof errorMsg === 'string' ? errorMsg : "Có lỗi xảy ra");
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Tạm dừng
                  </Button>
                ) : (
                  <Button
                    className={`px-3 py-2 rounded-lg flex gap-2 items-center text-sm text-white ${"bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    onClick={handleRun}
                    disabled={isProcessing}
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {localStatus === "Paused"
                      ? "Tiếp tục"
                      : "Chạy Chiến Dịch"}
                  </Button>
                )
              ) : (
                // Case: Running but no valid channels (should verify if this happen)
                localStatus === "Running" && (
                  <Button
                    className="px-3 py-2 rounded-lg flex gap-2 items-center text-sm text-white bg-green-600"
                    disabled
                  >
                    Đang chạy
                  </Button>
                )
              )}
            </PermissionGuard>
          )}

        {(localStatus === "Draft" ||
          localStatus === "Rejected" ||
          localStatus === "Approved" ||
          localStatus === "Configuring") && (
            <PermissionGuard module="campaign" action="update">
              <Button variant="actionUpdate" onClick={() => onEdit?.(c)}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
            </PermissionGuard>
          )}

        {localStatus !== "Running" && (
          <PermissionGuard module="campaign" action="delete">
            <Button
              variant="actionDelete"
              onClick={() => onDelete?.(c.id || c.campaign_id)}
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </Button>
          </PermissionGuard>
        )}
      </div>

      {/* Status History */}
      {c.settings?.history && (
        <StatusHistory
          key={`history-${c.campaign_id}-${c.settings?.history?.length || 0}`}
          history={c.settings.history}
        />
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-400 mt-4">
        {c.created_at && (
          <>Tạo: {new Date(c.created_at).toLocaleString("vi-VN")} · </>
        )}
        {c.updated_at && (
          <>Cập nhật: {new Date(c.updated_at).toLocaleString("vi-VN")}</>
        )}
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Thành công"
        message={successMessage}
      />

      {/* AddChannelDialog removed from here per request */}

      {/* Simple Reject Dialog */}
      {rejectOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              Từ chối chiến dịch
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Vui lòng nhập lý do từ chối để nhân viên chỉnh sửa.
            </p>
            <textarea
              className="w-full border rounded-md p-2 mb-4 text-sm"
              rows={3}
              placeholder="Nhập lý do..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Hủy
              </Button>
              <Button
                variant="actionDelete"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
