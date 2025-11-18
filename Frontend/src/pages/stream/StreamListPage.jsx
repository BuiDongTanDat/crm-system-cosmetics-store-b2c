import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Search, Eye, Plus, TvMinimalPlay, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { mockCampaigns } from "@/lib/data"; // dùng chung mock data (thay bằng API nếu có)
import { formatCurrency, formatDate } from '@/utils/helper';
import DropdownOptions from "@/components/common/DropdownOptions";
import AppDialog from "@/components/dialogs/AppDialog";
import MarketingForm from "@/pages/marketing/components/MarketingForm";
import SelectStreamOptionDialog from "@/pages/stream/components/SelectStreamOptionDialog";

export default function StreamListPage() {
    const navigate = useNavigate();
    const [hoveredRow, setHoveredRow] = useState(null);

    // modal now supports mode: 'view' | 'edit'
    const [modal, setModal] = useState({ open: false, mode: "view", campaign: null });

    const openViewModal = (campaign) => setModal({ open: true, mode: "view", campaign });
    const openEditModal = (campaign) => setModal({ open: true, mode: "edit", campaign });
    const openAddModal = () => setModal({ open: true, mode: "edit", campaign: null });
    const closeViewModal = () => setModal({ open: false, mode: "view", campaign: null });

    // Thêm state cho dialog chọn kiểu stream
    const [selectDialog, setSelectDialog] = useState({ open: false, campaign: null });

    const openSelectStreamDialog = (campaign) => setSelectDialog({ open: true, campaign });
    const closeSelectStreamDialog = () => setSelectDialog({ open: false, campaign: null });

    // onSelect từ dialog: điều hướng tới trang tương ứng và truyền campaign trong state
    const handleSelectStreamOption = (optionKey) => {
        const cam = selectDialog.campaign;
        if (!cam) { closeSelectStreamDialog(); return; }
        if (optionKey === 'video') {
            // changed route segment 'video' -> 'vid'
            navigate(`/streams/youtube/vid/${cam.id}`, { state: { campaign: cam } });
        } else if (optionKey === 'cam') {
            navigate(`/streams/youtube/cam/${cam.id}`, { state: { campaign: cam } });
        } else {
            // fallback to original single route (kept for safety)
            navigate(`/streams/youtube/${cam.id}`, { state: { campaign: cam } });
        }
        closeSelectStreamDialog();
    };

    // Helpers for badges (kept similar to MarketingPage)
    const getStatusBadge = (status) => {
        const baseClass = "w-[90px] px-2 py-1 font-medium rounded-full text-xs inline-block text-center";
        const statusMap = {
            Draft: `${baseClass} text-gray-800 bg-gray-100`,
            Running: `${baseClass} text-blue-800 bg-blue-100`,
            Completed: `${baseClass} text-green-800 bg-green-100`,
            Paused: `${baseClass} text-orange-800 bg-orange-100`
        };
        return statusMap[status] || statusMap.Draft;
    };

    const getTypeBadge = (type) => {
        const baseClass = "w-[100px] px-2 py-1 rounded-sm text-xs font-medium inline-block border text-center";
        const typeMap = {
            Email: `${baseClass} bg-purple-100 text-purple-800 border-purple-200`,
            Social: `${baseClass} bg-blue-100 text-blue-800 border-blue-200`,
            Paid: `${baseClass} bg-gray-100 text-gray-800 border-gray-200`,
            LiveStream: `${baseClass} bg-red-100 text-red-800 border-red-200`
        };
        return typeMap[type] || `${baseClass} bg-gray-100 text-gray-800`;
    };

    // Lấy campaigns LiveStream từ mock/ứng dụng
    // make campaigns mutable so we can add / edit / delete
    const [campaigns, setCampaigns] = useState(() =>
        (Array.isArray(mockCampaigns) ? mockCampaigns : []).filter(c => c.type === "LiveStream")
    );
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const filtered = useMemo(() => {
        return campaigns.filter(c =>
            ((c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.type || "").toLowerCase().includes(search.toLowerCase())) &&
            (filterStatus ? (c.status || "").toLowerCase() === filterStatus.toLowerCase() : true)
        );
    }, [campaigns, search, filterStatus]);

    const handleNavigateToStream = (campaign) => {
        navigate(`/streams/youtube/${campaign.id}`, { state: { campaign } });
    };

    // CRUD handlers for modal
    const handleSave = (campaignData) => {
        if (!campaignData) return;
        const isCreating = !campaignData.id;
        if (isCreating) {
            const maxId = campaigns.length ? Math.max(...campaigns.map(c => c.id || 0)) : 0;
            const newCampaign = {
                ...campaignData,
                id: maxId + 1,
                type: campaignData.type || "LiveStream",
            };
            setCampaigns(prev => [newCampaign, ...prev]);
            setModal({ open: false, mode: "view", campaign: null });
        } else {
            setCampaigns(prev => prev.map(c => c.id === campaignData.id ? { ...c, ...campaignData } : c));
            // keep modal open but switch to view mode showing updated data
            setModal({ open: true, mode: "view", campaign: { ...campaignData } });
        }
    };

    const handleDelete = (id) => {
        if (!id) return;
        if (!window.confirm("Bạn có chắc muốn xóa chiến dịch này?")) return;
        setCampaigns(prev => prev.filter(c => c.id !== id));
        setModal({ open: false, mode: "view", campaign: null });
    };

    return (
        <div className="flex flex-col">
            {/* Sticky header matching EmployeePage layout */}
            <div
                className="flex-col sticky top-[70px] z-20 flex gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md"
                style={{ backdropFilter: 'blur' }}
            >
                <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">Danh sách Stream ({filtered.length})</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm chiến dịch..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Button variant="actionCreate" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Tạo chiến dịch
                        </Button>
                    </div>
                </div>

                <div className="flex gap-3 items-center justify-end w-full">
                    <DropdownOptions
                        options={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: "Draft", label: "DRAFT" },
                            { value: "Running", label: "RUNNING" },
                            { value: "Completed", label: "COMPLETED" },
                            { value: "Paused", label: "PAUSED" }
                        ]}
                        value={filterStatus}
                        onChange={(val) => setFilterStatus(val)}
                        width="w-44"
                        placeholder="Trạng thái"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 pt-4">
                <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Chiến dịch", "Loại", "Ngân sách", "Thời gian", "Trạng thái", "Phụ trách", ""].map(h => (
                                        <th
                                            key={h}
                                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"

                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filtered.map(c => (
                                    <tr key={c.id}
                                        className="hover:bg-gray-50 "
                                        onMouseEnter={() => setHoveredRow(c.id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td className="px-6 py-2 whitespace-nowrap text-left">
                                            <div className="text-sm font-medium text-gray-900">{c.name || c.title}</div>
                                            <div className="text-xs text-gray-500">{c.targetAudience}</div>
                                        </td>
                                        <td className="px-6 py-2 text-sm whitespace-nowrap text-center">
                                            <span className={getTypeBadge(c.type)}>{c.type}</span>
                                        </td>
                                        <td className="px-6 py-2 text-sm whitespace-nowrap text-center">
                                            {c.budget ? formatCurrency(c.budget) : '-'}
                                        </td>
                                        <td className="px-6 py-2 text-sm whitespace-nowrap text-center">
                                            {formatDate(c.startDate)}{c.endDate ? ` - ${formatDate(c.endDate)}` : ''}
                                        </td>
                                        <td className="px-6 py-2 text-sm whitespace-nowrap text-center">
                                            <span className={getStatusBadge(c.status)}>{c.status}</span>
                                        </td>
                                        <td className="px-6 py-2 text-sm whitespace-nowrap text-center">
                                            {c.assignee || '-'}
                                        </td>
                                        <td className="px-6 py-2 text-center w-36">
                                            <div className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === c.id ?
                                                "opacity-100 translate-y-0 pointer-events-auto" :
                                                "opacity-0 translate-y-1 pointer-events-none"}`}>
                                                <Button variant="actionRead" size="icon" onClick={() => openViewModal(c)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="actionRead" size="icon" onClick={() => openEditModal(c)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {/* Sửa: mở dialog chọn kiểu stream */}
                                                <Button variant="actionUpdate" size="icon" onClick={() => openSelectStreamDialog(c)}>
                                                    <TvMinimalPlay className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Trạng thái rỗng */}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500">Không có Chiến dịch</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >
            {/* Detail modal (view-only) */}
            <AppDialog
                open={modal.open}
                onClose={closeViewModal}
                title={{
                    view: `Chi tiết chiến dịch - ${modal.campaign?.name || modal.campaign?.title || ''}`,
                    edit: modal.campaign ? `Chỉnh sửa chiến dịch - ${modal.campaign.name}` : 'Thêm chiến dịch mới'
                }}
                mode={modal.mode}
                FormComponent={MarketingForm}
                data={modal.campaign}
                onSave={handleSave}
                onDelete={handleDelete}
                setMode={(m) => setModal(prev => ({ ...prev, mode: m }))}
                maxWidth="sm:max-w-4xl"
            />

            {/* Select stream option dialog */}
            <SelectStreamOptionDialog
                open={selectDialog.open}
                onClose={closeSelectStreamDialog}
                onSelect={handleSelectStreamOption}
                title="Chọn hình thức stream"
                description="Chọn phát từ file video đã upload hoặc phát trực tiếp từ webcam"
            />
        </div >
    );
}