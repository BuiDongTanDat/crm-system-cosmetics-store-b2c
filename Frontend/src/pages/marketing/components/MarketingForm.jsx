import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2, TrendingUp } from "lucide-react";
import { CampaignTypeList, CampaignStatusList, mockEmployees } from "@/lib/data";

export function MarketingForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
}) {
  const [form, setForm] = useState({
    name: "",
    type: "Email",
    budget: "",
    startDate: "",
    endDate: "",
    targetAudience: "",
    dataSource: "Customers",
    status: "Draft",
    assigneeId: "",
    assignee: "",
    expectedKPI: "",
  });

  const [performance, setPerformance] = useState({
    reach: "",
    openRate: "",
    clickRate: "",
    newLeads: "",
    actualCost: "",
    revenue: "",
    roi: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        type: data.type || "Email",
        budget: data.budget || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        targetAudience: data.targetAudience || "",
        dataSource: data.dataSource || "Customers",
        status: data.status || "Draft",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        expectedKPI: data.expectedKPI || "",
      });

      if (data.performance) {
        setPerformance({
          reach: data.performance.reach || "",
          openRate: data.performance.openRate || "",
          clickRate: data.performance.clickRate || "",
          newLeads: data.performance.newLeads || "",
          actualCost: data.performance.actualCost || "",
          revenue: data.performance.revenue || "",
          roi: data.performance.roi || "",
        });
      }
    }
  }, [data]);

  const handleCancel = () => {
    if (data) {
      setForm({
        name: data.name || "",
        type: data.type || "Email",
        budget: data.budget || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        targetAudience: data.targetAudience || "",
        dataSource: data.dataSource || "Customers",
        status: data.status || "Draft",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        expectedKPI: data.expectedKPI || "",
      });
    }
    setMode?.("view");
  };

  const handleSubmit = () => {
    if (!form.name || !form.budget) {
      alert("Vui lòng nhập tên chiến dịch và ngân sách");
      return;
    }

    // Prepare performance data
    const performanceData = data?.performance || {};
    
    // Update performance with current form values
    Object.entries(performance).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        performanceData[key] = key === 'lastUpdated' ? value : Number(value) || value;
      }
    });

    const updated = {
      ...form,
      budget: Number(form.budget),
      id: data?.id,
      performance: Object.keys(performanceData).length > 0 ? performanceData : null
    };

    const isCreating = !data?.id;
    
    onSave(updated);
    
    // Nếu là update, chuyển về view mode
    if (!isCreating) {
      setMode?.("view");
    }
  };

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePerformanceChange = (field) => (e) =>
    setPerformance((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên chiến dịch</label>
              <input
                disabled={mode === "view"}
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tên chiến dịch"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Loại chiến dịch</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">{form.type}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                      className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
                    {CampaignTypeList.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onSelect={() => setForm((f) => ({ ...f, type }))}
                      >
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">{form.status}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {CampaignStatusList.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onSelect={() => setForm((f) => ({ ...f, status }))}
                      >
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngân sách (VNĐ)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={form.budget}
                  onChange={handleChange("budget")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Đối tượng mục tiêu</label>
                <input
                  disabled={mode === "view"}
                  value={form.targetAudience}
                  onChange={handleChange("targetAudience")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Mô tả đối tượng"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={form.startDate}
                  onChange={handleChange("startDate")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={form.endDate}
                  onChange={handleChange("endDate")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Nguồn dữ liệu</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">{form.dataSource}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                      className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
                    {["Leads", "Customers", "Products"].map((source) => (
                      <DropdownMenuItem
                        key={source}
                        onSelect={() => setForm((f) => ({ ...f, dataSource: source }))}
                      >
                        {source}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Người phụ trách</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">{form.assignee || "Chọn người phụ trách"}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                      className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
                    {mockEmployees.map((employee) => (
                      <DropdownMenuItem
                        key={employee.id}
                        onSelect={() => setForm((f) => ({ 
                          ...f, 
                          assigneeId: employee.id,
                          assignee: employee.name 
                        }))}
                      >
                        {employee.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">KPI kỳ vọng</label>
              <textarea
                disabled={mode === "view"}
                value={form.expectedKPI}
                onChange={handleChange("expectedKPI")}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Mô tả KPI kỳ vọng..."
              />
            </div>
          </div>

          {/* Campaign Performance - Always show */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Hiệu suất chiến dịch</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Số lượng tiếp cận</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={performance.reach}
                  onChange={handlePerformanceChange("reach")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tỷ lệ mở email (%)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  step="0.1"
                  value={performance.openRate}
                  onChange={handlePerformanceChange("openRate")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tỷ lệ click (%)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  step="0.1"
                  value={performance.clickRate}
                  onChange={handlePerformanceChange("clickRate")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số lead mới</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={performance.newLeads}
                  onChange={handlePerformanceChange("newLeads")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chi phí thực tế (VNĐ)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={performance.actualCost}
                  onChange={handlePerformanceChange("actualCost")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Doanh thu (VNĐ)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={performance.revenue}
                  onChange={handlePerformanceChange("revenue")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ROI (%)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  step="0.1"
                  value={performance.roi}
                  onChange={handlePerformanceChange("roi")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày cập nhật cuối</label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={performance.lastUpdated || new Date().toISOString().split('T')[0]}
                  onChange={handlePerformanceChange("lastUpdated")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button variant="actionDelete" onClick={() => onDelete(data?.id)}>
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} variant="actionUpdate">
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketingForm;
