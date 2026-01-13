import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Filter,
  List,
  Square,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MarketingCard from "@/pages/marketing/components/MarketingCard";
import AppDialog from "@/components/dialogs/AppDialog";
import MarketingForm from "@/pages/marketing/components/MarketingForm";
import AppPagination from "@/components/pagination/AppPagination";
import ImportExportDropdown from "@/components/common/ImportExportDropdown";
import DropdownOptions from "@/components/common/DropdownOptions";
import DateRangeButtonPicker from "@/components/common/DateRangeButtonPicker";
import { getAll } from "@/services/campaign";
import MarketingDetail from "@/pages/marketing/components/MarketingDetail";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/utils/helper";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import PermissionGuard from "@/components/auth/PermissionGuard";

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [modal, setModal] = useState({
    open: false,
    mode: "view", // "view" | "edit" | "add"
    campaign: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 6;
  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  // Hàm chuẩn hóa status từ API
  const normalizeStatus = (status) => {
    const statusMap = {
      draft: "Draft",
      submitted: "Submitted",
      approved: "Approved",
      configuring: "Configuring",
      running: "Running",
      paused: "Paused",
      completed: "Completed",
      rejected: "Rejected",
    };
    const lowerStatus = String(status || "").toLowerCase();
    return statusMap[lowerStatus] || "Draft";
  };

  const mapApiCampaignToUI = (c) => {
    if (!c) {
      console.warn("[MAP] nhận giá trị falsy:", c);
      return null;
    }

    const mapped = {
      id: c.campaign_id,
      name: c.name,
      type: capitalize(c.channel || "Email"),
      budget: c.budget ?? 0,
      startDate: c.start_date ? c.start_date.slice(0, 10) : "",
      endDate: c.end_date ? c.end_date.slice(0, 10) : "",
      targetAudience: c.target_filter?.note || "",
      target_filter: c.target_filter || {},
      dataSource: c.data_source || "Customers",
      status: normalizeStatus(c.status), // Sử dụng hàm normalizeStatus
      assignee: "",
      assigneeId: c.owner_employee_id || null,
      expectedKPI: c.expected_kpi ? JSON.stringify(c.expected_kpi) : "",
      expected_kpi: c.expected_kpi || {},
      products: Array.isArray(c.products) ? c.products : [],
      performance: c.performance || null,
      __raw: c,
    };

    console.log(
      "[MAP] api.campaign_id -> ui.id",
      c.campaign_id,
      "=>",
      mapped.id,
      mapped.name
    );
    return mapped;
  };
  // view mode (card | list)
  const [viewMode, setViewMode] = useState("card");
  const [hoveredRow, setHoveredRow] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        // truyền filter nếu muốn: { page: 1, limit: 20, status: 'active' }
        const { items } = await getAll();
        const mapped = items.map(mapApiCampaignToUI);
        setCampaigns(mapped);
      } catch (e) {
        console.error("Load campaigns failed:", e);
        toast.error("Không tải được danh sách chiến dịch");
      }
    })();
  }, []);

  // Items per page: card = 3, list = 8
  // const campaignsPerPage = viewMode === 'card' ? 3 : 8;

  // Helper: status badge classes (moved here to share between card and list)
  const getStatusBadge = (status) => {
    const baseClass =
      "w-[90px] px-2 py-1 font-medium rounded-full text-xs inline-block text-center";
    const statusMap = {
      Draft: `${baseClass} text-gray-800 bg-gray-100`,
      Submitted: `${baseClass} text-yellow-800 bg-yellow-100`,
      Approved: `${baseClass} text-emerald-800 bg-emerald-100`,
      Configuring: `${baseClass} text-indigo-800 bg-indigo-100`,
      Running: `${baseClass} text-blue-800 bg-blue-100`,
      Completed: `${baseClass} text-green-800 bg-green-100`,
      Paused: `${baseClass} text-orange-800 bg-orange-100`,
      Rejected: `${baseClass} text-red-800 bg-red-100`,
    };
    return statusMap[status] || statusMap.Draft;
  };

  // Helper: type badge classes (moved here to share between card and list)
  const getTypeBadge = (type) => {
    const baseClass =
      "w-[100px] px-2 py-1 rounded-sm text-xs font-medium inline-block border text-center";
    const typeMap = {
      Email: `${baseClass} bg-purple-100 text-purple-800 border-purple-200`,
      SMS: `${baseClass} bg-green-100 text-green-800 border-green-200`,
      Ads: `${baseClass} bg-gray-100 text-gray-800 border-gray-200`,
      "Social Media": `${baseClass} bg-blue-100 text-blue-800 border-blue-200`,
      "Content Marketing": `${baseClass} bg-orange-100 text-orange-800 border-orange-200 `,
      SEO: `${baseClass} bg-indigo-100 text-indigo-800 border-indigo-200 `,
      LiveStream: `${baseClass} bg-red-100 text-red-800 border-red-200`,
    };
    return typeMap[type] || `${baseClass} bg-gray-100 text-gray-800`;
  };

  // Field mapping for CSV export/import
  const campaignFieldMapping = {
    name: "Tên chiến dịch",
    type: "Loại chiến dịch",
    budget: "Ngân sách",
    startDate: "Ngày bắt đầu",
    endDate: "Ngày kết thúc",
    targetAudience: "Đối tượng mục tiêu",
    dataSource: "Nguồn dữ liệu",
    status: "Trạng thái",
    assignee: "Người phụ trách",
    expectedKPI: "KPI mong đợi",
  };

  // Dropdown options for campaign types
  const CAMPAIGN_TYPE_OPTIONS = [
    { value: "all", label: "Tất cả loại chiến dịch" },
    { value: "Email", label: "Email" },
    { value: "SMS", label: "SMS" },
    { value: "Ads", label: "Ads" },
    { value: "Social Media", label: "Social Media" },
    { value: "Content Marketing", label: "Content Marketing" },
    { value: "SEO", label: "SEO" },
    { value: "LiveStream", label: "LiveStream" },
    { value: "Paid", label: "Paid" },
    { value: "Social", label: "Social" },
  ];

  // Cập nhật options cho trạng thái
  const CAMPAIGN_STATUS_OPTIONS = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Draft", label: "Nháp" },
    { value: "Submitted", label: "Đã gửi duyệt" },
    { value: "Approved", label: "Đã duyệt" },
    { value: "Configuring", label: "Đang cấu hình" },
    { value: "Running", label: "Đang chạy" },
    { value: "Paused", label: "Tạm dừng" },
    { value: "Completed", label: "Hoàn thành" },
    { value: "Rejected", label: "Từ chối" },
  ];

  // Filtered campaigns (bổ sung lọc theo ngày và trạng thái)
  const filtered = (campaigns ?? []).filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (c.name || "").toLowerCase().includes(term) ||
      (c.type || "").toLowerCase().includes(term);
    const matchesType = selectedType === "all" || c.type === selectedType;
    const matchesStatus =
      selectedStatus === "all" || c.status === selectedStatus;
    // Lọc theo khoảng ngày
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      // So sánh ngày bắt đầu và kết thúc của chiến dịch với khoảng lọc
      const campaignStart = new Date(c.startDate);
      const campaignEnd = new Date(c.endDate || c.startDate);
      const filterStart = new Date(dateRange.from);
      const filterEnd = new Date(dateRange.to);
      // Kiểm tra nếu chiến dịch có giao với khoảng lọc
      matchesDate = campaignEnd >= filterStart && campaignStart <= filterEnd;
    }
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Pagination
  useEffect(() => setCurrentPage(1), [searchTerm, selectedType, viewMode]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / campaignsPerPage));
  const indexOfLast = currentPage * campaignsPerPage;
  const indexOfFirst = indexOfLast - campaignsPerPage;
  const currentCampaigns = filtered.slice(indexOfFirst, indexOfLast);

  // Handlers
  const openView = (c) =>
    setModal({ open: true, mode: "view", campaign: c.__raw || c });
  const openEdit = (c) =>
    setModal({ open: true, mode: "edit", campaign: c.__raw || c });
  const openAdd = () => setModal({ open: true, mode: "add", campaign: null });
  const closeModal = () =>
    setModal({ open: false, mode: "view", campaign: null });

  // Thêm hàm setMode để chuyển đổi chế độ trong modal
  const setMode = (mode) => {
    if (mode === "close") {
      setModal({ open: false, mode: "view", campaign: null });
    } else {
      setModal((prev) => ({ ...prev, mode }));
    }
  };

  // Thêm hàm load lại campaigns từ API
  const reloadCampaigns = async () => {
    try {
      const { items } = await getAll();
      const mapped = items.map(mapApiCampaignToUI);
      setCampaigns(mapped);
    } catch (e) {
      toast.error("Không tải được danh sách chiến dịch");
    }
  };

  // Sửa lại handleSave để đảm bảo cập nhật ngay
  const handleSave = async (apiData) => {
    try {
      // Reload toàn bộ danh sách
      await reloadCampaigns();

      // Fetch lại campaign vừa lưu để có dữ liệu mới nhất
      let campaignId = apiData?.campaign_id || apiData?.id;

      if (campaignId) {
        try {
          const { items } = await getAll();
          const freshCampaign = items.find((c) => c.campaign_id === campaignId);
          if (freshCampaign) {
            // Cập nhật modal với dữ liệu mới nhất
            setModal((prev) => ({
              ...prev,
              mode: "view",
              campaign: freshCampaign,
            }));
            return;
          }
        } catch (e) {
          console.error("Error fetching fresh campaign:", e);
        }
      }

      // Fallback
      const updatedCampaign = mapApiCampaignToUI(apiData);
      setModal((prev) => ({
        ...prev,
        mode: "view",
        campaign: updatedCampaign || apiData,
      }));
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error("Có lỗi khi cập nhật dữ liệu");
    }
  };

  // Sửa lại handleDelete để reload lại danh sách từ API
  const handleDelete = async (id) => {
    await reloadCampaigns();
    setTimeout(() => closeModal(), 0);
    toast.success("Đã xóa chiến dịch");
  };

  // Updated import handler for CSV
  const handleImportSuccess = (importedData) => {
    try {
      const processedCampaigns = importedData.map((item, index) => ({
        id: Math.max(...campaigns.map((c) => c.id), 0) + index + 1,
        name: item["Tên chiến dịch"] || item.name || "Untitled",
        type: item["Loại chiến dịch"] || item.type || "Email",
        budget: parseFloat(item["Ngân sách"] || item.budget || 0),
        startDate: item["Ngày bắt đầu"] || item.startDate || "",
        endDate: item["Ngày kết thúc"] || item.endDate || "",
        targetAudience: item["Đối tượng mục tiêu"] || item.targetAudience || "",
        dataSource: item["Nguồn dữ liệu"] || item.dataSource || "Customers",
        status: item["Trạng thái"] || item.status || "Draft",
        assignee: item["Người phụ trách"] || item.assignee || "",
        assigneeId: item.assigneeId || 1,
        expectedKPI: item["KPI mong đợi"] || item.expectedKPI || "",
        performance: item.performance || null,
      }));

      setCampaigns((prev) => [...prev, ...processedCampaigns]);
      toast.success(
        `Đã nhập thành công ${processedCampaigns.length} chiến dịch!`
      );
      reloadCampaigns(); // reload lại sau khi import
    } catch (error) {
      console.error("Lỗi xử lý dữ liệu nhập:", error);
      toast.error("Có lỗi xảy ra khi xử lý dữ liệu nhập");
    }
  };

  const handleImportError = (errorMessage) => {
    toast.error(`Lỗi nhập file: ${errorMessage}`);
  };

  // Pagination handlers
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="flex flex-col">
      {/* Sticky header: responsive layout, bỏ nút lọc và ba chấm */}
      <div
        className="my-3 z-20 flex flex-col gap-3 p-3 bg-brand/10 backdrop-bl-lg rounded-md"
        style={{ backdropFilter: "blur" }}
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          {/* Cụm trái: Tiêu đề và nút đổi chế độ */}
          <div className="flex items-center gap-2 justify-between w-full lg:justify-start">
            <h1 className="text-2xl font-bold text-gray-900">
              Chiến dịch Marketing ({filtered.length})
            </h1>
            <div className="flex gap-0 ml-2">
              <Button
                variant={viewMode === "card" ? "actionCreate" : "actionNormal"}
                onClick={() => setViewMode("card")}
                size="icon"
                className="rounded-none rounded-tl-md rounded-bl-md"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "actionCreate" : "actionNormal"}
                onClick={() => setViewMode("list")}
                size="icon"
                className="rounded-none rounded-tr-md rounded-br-md"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Cụm phải: Search, Filter, Thêm, Import/Export */}
          <div className="flex flex-col gap-2 w-full  lg:items-end lg:gap-2 lg:w-auto">
            <div className="flex flex-col gap-2 w-full lg:flex-row lg:justify-end lg:gap-2">
              {/* Search */}
              <div className="relative w-full lg:w-56">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm chiến dịch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full"
                />
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <PermissionGuard module="campaign" action="create">
                  <Button
                    onClick={openAdd}
                    variant="actionCreate"
                    className="gap-2 w-full lg:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm chiến dịch
                  </Button>
                </PermissionGuard>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-end w-full lg:w-auto">
              <div className="flex gap-2 w-full lg:w-auto">
                {/* Filter loại chiến dịch */}
              <DropdownOptions
                options={CAMPAIGN_TYPE_OPTIONS}
                value={selectedType}
                onChange={(val) => setSelectedType(val)}
                width="w-full flex-1 lg:w-44"
                placeholder="Loại chiến dịch"
              />

              {/* Thêm bộ lọc theo trạng thái */}
              <DropdownOptions
                options={CAMPAIGN_STATUS_OPTIONS}
                value={selectedStatus}
                onChange={setSelectedStatus}
                width="w-full flex-1 lg:w-44"
                placeholder="Trạng thái"
              />
              </div>
              {/* Thêm bộ lọc theo khoảng ngày */}
              <DateRangeButtonPicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-col">
        {/* View modes */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4 mb-6">
            {currentCampaigns.map((campaign) => (
              <MarketingCard
                key={campaign.id}
                campaign={campaign}
                onView={openView}
                onEdit={openEdit}
                onDelete={handleDelete}
                getStatusBadge={getStatusBadge}
                getTypeBadge={getTypeBadge}
              />
            ))}
            {currentCampaigns.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Không có Chiến dịch
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Chiến dịch",
                      "Loại",
                      "Ngân sách",
                      "Thời gian",
                      "Trạng thái",
                      "Người phụ trách",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCampaigns.map((c) => (
                    <tr
                      key={c.id}
                      onMouseEnter={() => setHoveredRow(c.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-2 whitespace-nowrap text-left">
                        <div className="flex-col items-center">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">
                            {c.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[220px]">
                            {c.targetAudience}
                          </div>
                        </div>
                      </td>
                      <td className="text-center text-sm text-gray-800">
                        <span className={getTypeBadge(c.type)}>{c.type}</span>
                      </td>
                      <td className="text-center">
                        {c.budget ? formatCurrency(c.budget) : "-"}
                      </td>
                      <td className="text-center text-sm text-gray-700">
                        {formatDate(c.startDate)}
                        {c.endDate ? ` - ${formatDate(c.endDate)}` : ""}
                      </td>
                      <td className="text-center text-sm">
                        <span className={getStatusBadge(c.status)}>
                          {c.status || "Draft"}
                        </span>
                      </td>
                      <td className="text-center text-sm">
                        {c.assignee || "-"}
                      </td>
                      <td className="text-center w-36 py-2">
                        <div
                          className={`flex justify-center gap-1 transition-all duration-200 ${
                            hoveredRow === c.id
                              ? "opacity-100 translate-y-0 pointer-events-auto"
                              : "opacity-0 translate-y-1 pointer-events-none"
                          }`}
                        >
                          <PermissionGuard module="campaign" action="read">
                            <Button
                              variant="actionRead"
                              size="icon"
                              onClick={() => openView(c)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard module="campaign" action="update">
                            <Button
                              variant="actionUpdate"
                              size="icon"
                              onClick={() => openEdit(c)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard module="campaign" action="delete">
                            <ConfirmDialog
                              title="Xác nhận xóa"
                              description={
                                <>
                                  Bạn có chắc chắn muốn xóa chiến dịch{" "}
                                  <span className="font-semibold text-black">
                                    {c?.name}
                                  </span>
                                  ?
                                </>
                              }
                              confirmText="Xóa"
                              cancelText="Hủy"
                              onConfirm={() => handleDelete(c.id)}
                            >
                              <Button variant="actionDelete" size="icon">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </ConfirmDialog>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Trạng thái rỗng */}
                  {currentCampaigns.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        Không có Chiến dịch
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        <AppPagination
          totalPages={totalPages}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          handleNext={handleNext}
          handlePrev={handlePrev}
        />

        {/* Modal */}
        <AppDialog
          open={modal.open}
          onClose={closeModal}
          title={{
            view: `Chi tiết chiến dịch - ${modal.campaign?.name || ""}`,
            edit: modal.campaign
              ? `Chỉnh sửa chiến dịch - ${modal.campaign?.name || ""}`
              : "Thêm chiến dịch mới",
            add: "Thêm chiến dịch mới",
            detail: `Chi tiết chiến dịch - ${modal.campaign?.name || ""}`,
          }}
          mode={modal.mode}
          FormComponent={(props) =>
            modal.mode === "view" ? (
              <MarketingDetail
                {...props}
                data={modal.campaign}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={async () => {
                  // Reload toàn bộ campaigns
                  await reloadCampaigns();
                  // Fetch lại campaign hiện tại để cập nhật modal
                  if (modal.campaign?.campaign_id) {
                    try {
                      const { items } = await getAll();
                      const freshCampaign = items.find(
                        (c) => c.campaign_id === modal.campaign.campaign_id
                      );
                      if (freshCampaign) {
                        setModal((prev) => ({
                          ...prev,
                          campaign: freshCampaign,
                        }));
                      }
                    } catch (e) {
                      console.error("Error refreshing campaign:", e);
                    }
                  }
                }}
              />
            ) : (
              <MarketingForm
                {...props}
                mode={modal.mode === "add" ? "edit" : modal.mode}
                data={modal.campaign}
                onSave={handleSave}
                onDelete={handleDelete}
                onAfterSave={reloadCampaigns}
                onAfterDelete={reloadCampaigns}
                onClose={closeModal}
                setMode={setMode}
              />
            )
          }
          data={modal.campaign}
          onSave={handleSave}
          onDelete={handleDelete}
          onEdit={openEdit}
          maxWidth="sm:max-w-4xl"
        />
      </div>
    </div>
  );
}
