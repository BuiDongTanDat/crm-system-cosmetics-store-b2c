import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Calendar, DollarSign, Target, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/helper";
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import PermissionGuard from "@/components/auth/PermissionGuard";

const formatPercent = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    const percent = n <= 1 && n >= 0 ? n * 100 : n;
    return `${percent.toFixed(1)}%`;
};

export default function MarketingCard({ campaign, onView, onEdit, onDelete, getStatusBadge, getTypeBadge, extraActions }) {
    const [hoveredCard, setHoveredCard] = useState(false);

    // safe helpers
    const safeBudget = () => {
        if (campaign?.budget == null) return '—';
        try { return formatCurrency(Number(campaign.budget)); } catch { return String(campaign.budget); }
    };
    const safeDateRange = () => {
        const s = campaign?.startDate;
        const e = campaign?.endDate;
        if (!s && !e) return '—';
        const start = s ? formatDate(s) : '';
        const end = e ? formatDate(e) : '';
        return start + (end ? ` - ${end}` : '');
    };

    const defaultBanner = "https://rubicmarketing.com/wp-content/uploads/2021/08/thiet-ke-banner-my-pham-1.jpg";
    const bannerUrl = campaign?.image || campaign?.__raw?.image || campaign?.banner || defaultBanner;

    return (
        <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-150 animate-fade-in group"
            onMouseEnter={() => setHoveredCard(true)}
            onMouseLeave={() => setHoveredCard(false)}
        >
            {/* Banner Image */}
            <div className="relative h-40 overflow-hidden">
                <img
                    src={bannerUrl}
                    alt={campaign?.name || 'Campaign banner'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        e.currentTarget.src = defaultBanner;
                    }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Status badge - overlay on image */}
                <div className="absolute top-2 right-2">
                    <span className={getStatusBadge?.(campaign?.status)}>{campaign?.status || 'Draft'}</span>
                </div>

                {/* Type badge - overlay on image */}
                <div className="absolute bottom-2 left-2">
                    <span className={getTypeBadge?.(campaign?.type)}>{campaign?.type || '-'}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col">
                {/* Tiêu đề */}
                <h3 className="font-semibold text-gray-900 text-lg mb-3 line-clamp-2 min-h-[3.5rem]">
                    {campaign?.name || 'Untitled'}
                </h3>

                {/* Thông tin chính - 2 cột */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Budget */}
                    <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Ngân sách</p>
                            <p className="text-sm font-semibold truncate">{safeBudget()}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Thời gian</p>
                            <p className="text-xs font-medium line-clamp-2">{safeDateRange()}</p>
                        </div>
                    </div>
                </div>

                {/* Target Audience */}
                <div className="flex items-start gap-2 mb-3">
                    <Target className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Đối tượng</p>
                        <p className="text-sm font-medium line-clamp-1">{campaign?.targetAudience || '—'}</p>
                    </div>
                </div>

                {/* Performance - luôn hiển thị nếu có */}
                {campaign?.performance && (
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 mb-3">
                        <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-gray-700">Hiệu suất</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <span className="text-gray-600">ROI: <strong className="text-gray-900">{campaign.performance?.roi != null ? `${campaign.performance.roi}%` : '—'}</strong></span>
                            <span className="text-gray-600">Reach: <strong className="text-gray-900">{campaign.performance?.reach != null ? Number(campaign.performance.reach).toLocaleString('vi-VN') : '—'}</strong></span>
                        </div>
                    </div>
                )}

                {/* Action Buttons - luôn hiển thị ở dưới */}
                <div className="flex justify-center gap-2 mt-auto pt-2 border-t">
                    <PermissionGuard module="campaign" action="read">
                        <Button variant="actionRead" size="sm" onClick={() => onView && onView(campaign)} className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            Xem
                        </Button>
                    </PermissionGuard>
                    <PermissionGuard module="campaign" action="update">
                        <Button variant="actionUpdate" size="sm" onClick={() => onEdit && onEdit(campaign)} className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Sửa
                        </Button>
                    </PermissionGuard>
                    <PermissionGuard module="campaign" action="delete">
                        <ConfirmDialog
                            title="Xác nhận xóa"
                            description={<>
                                Bạn có chắc chắn muốn xóa chiến dịch <span className="font-semibold text-black">{campaign?.name}</span>?
                            </>}
                            confirmText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => onDelete && onDelete(campaign.id)}
                        >
                            <Button variant="actionDelete" size="sm" className="flex-1">
                                <Trash2 className="w-4 h-4" /> Xóa
                            </Button>
                        </ConfirmDialog>
                    </PermissionGuard>
                    {extraActions && extraActions}
                </div>
            </div>
        </div>
    );
}
