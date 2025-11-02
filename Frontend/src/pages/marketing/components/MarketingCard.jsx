import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Calendar, DollarSign, Target, TrendingUp } from "lucide-react";

export default function MarketingCard({ campaign, onView, onEdit, onDelete, getStatusBadge, getTypeBadge }) {
    const [hoveredCard, setHoveredCard] = useState(false);

    // helpers are passed from parent (MarketingPage) to keep styling consistent across card/list

    return (
        <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:scale-105 hover:shadow-md transition-all duration-150 animate-fade-in group"
            onMouseEnter={() => setHoveredCard(true)}
            onMouseLeave={() => setHoveredCard(false)}
        >
            {/* Tiêu đề và trạng thái */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-2">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                        {campaign.name}
                    </h3>
                    <div className="flex gap-2">
                        <span className={getTypeBadge?.(campaign.type)}>{campaign.type}</span>
                    </div>
                </div>
                {/* Status badge - top right corner */}
                <div className="flex-shrink-0 ">
                    <span className={getStatusBadge?.(campaign.status)}>{campaign.status}</span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {/* Budget */}
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <div>
                        <p className="text-xs text-gray-500">Ngân sách</p>
                        <p className="text-sm font-medium">{campaign.budget.toLocaleString()} đ</p>
                    </div>
                </div>

                {/* THời gian */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                        <p className="text-xs text-gray-500">Thời gian</p>
                        <p className="text-sm font-medium">
                            {new Date(campaign.startDate).toLocaleDateString("vi-VN")} - {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
                        </p>
                    </div>
                </div>

                {/* Target & Assignee */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-destructive" />
                        <div>
                            <p className="text-xs text-gray-500">Đối tượng</p>
                            <p className="text-sm font-medium">{campaign.targetAudience}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-xs text-white">
                            {campaign.assignee ? campaign.assignee.charAt(0) : '-'}
                        </span>
                        <div>
                            <p className="text-xs text-gray-500">Phụ trách</p>
                            <p className="text-sm font-medium">{campaign.assignee}</p>
                        </div>
                    </div>
                </div>

                {/* Hiệu suất chiến dịch (chỉ hiện nếu có nha) */}
                {campaign.performance && (
                    <div className="bg-gray-50 rounded p-2">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">Hiệu suất</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <span>ROI: <strong>{campaign.performance.roi}%</strong></span>
                            <span>Tiếp cận: <strong>{campaign.performance.reach.toLocaleString()}</strong></span>
                        </div>
                    </div>
                )}

                {/* KPI - will be covered by action buttons on hover */}
                <div className={`transition-opacity duration-200 ${hoveredCard ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-xs text-gray-500">KPI kỳ vọng</p>
                    <p className="text-sm text-gray-700">{campaign.expectedKPI}</p>
                </div>
            </div>

            {/* Khu vực Action Buttons, hover là ẩn KPI */}
            {hoveredCard && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2  p-2  animate-slide-up z-10">
                    <Button variant="actionRead" size="icon" onClick={() => onView(campaign)}>
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="actionUpdate" size="icon" onClick={() => onEdit(campaign)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="actionDelete" size="icon" onClick={() => onDelete(campaign.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
