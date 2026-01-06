import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DropdownOptions from "@/components/common/DropdownOptions";
import { Input } from "@/components/ui/input";
import { Edit, Save, Trash2, Loader2 } from "lucide-react";
import { mockEmployees } from "@/lib/data";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import { createLead, updateLead } from "@/services/leads";
import { formatCurrency } from "@/utils/helper";

const priorityOptions = [
  { value: "high", label: "Cao" },
  { value: "medium", label: "Trung bình" },
  { value: "low", label: "Thấp" },
];

const sourceOptions = [
  "Website",
  "Facebook",
  "Instagram",
  "Google Ads",
  "Zalo",
  "Giới thiệu",
  "Email",
  "Điện thoại",
];

const statusOptions = [
  { value: "leads", label: "Leads", stage: "leads" },
  { value: "contacted", label: "Contacted", stage: "contacted" },
  { value: "qualified", label: "Qualified", stage: "qualified" },
  { value: "nurturing ", label: "Nurturing", stage: "nurturing " },
  { value: "converted", label: "Converted", stage: "converted" },
  { value: "closed-lost", label: "Closed-Lost", stage: "closed-lost" },
];

export function DealForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
}) {
  const [form, setForm] = useState({
    title: "",
    name: "",
    email: "",
    phone: "",
    value: "",
    source: "Website",
    assigneeId: "",
    assignee: "",
    priority: "medium",
    products: [],
    notes: "",
    aiReason: "",
    leadScore: 0,
    conversionProb: 0,
    mlConversionProb: 0,
    mlPredictedValue: 0,
    mlLastScoredAt: null,
    mlModelVersion: null,
    stage: "new",
    status: "new",
    productInterests: [],
    interactions: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        value: data.value || "",
        source: data.source || "Website",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        priority: data.priority || "medium",
        products: data.products || [],
        notes: data.notes || "",
        aiReason: data.aiReason || "",
        leadScore: data.leadScore || 0,
        conversionProb: data.conversionProb || 0,
        mlConversionProb: data.mlConversionProb || 0,
        mlPredictedValue: data.mlPredictedValue || 0,
        mlLastScoredAt: data.mlLastScoredAt || null,
        mlModelVersion: data.mlModelVersion || null,
        stage: data.stage || "new",
        status: data.status || data.stage || "new",
        productInterests: data.productInterests || [],
        interactions: data.interactions || [],
      });
    } else {
      // Reset to default values when data is null (creating new deal)
      setForm({
        title: "",
        name: "",
        email: "",
        phone: "",
        value: "",
        source: "Website",
        assigneeId: "",
        assignee: "",
        priority: "medium",
        products: [],
        notes: "",
        aiReason: "",
        leadScore: 0,
        conversionProb: 0,
        mlConversionProb: 0,
        mlPredictedValue: 0,
        mlLastScoredAt: null,
        mlModelVersion: null,
        stage: "new",
        status: "new",
        productInterests: [],
        interactions: [],
      });
    }
  }, [data]);

  const handleCancel = () => {
    if (data) {
      setForm({
        title: data.title || "",
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        value: data.value || "",
        source: data.source || "Website",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        priority: data.priority || "medium",
        products: data.products || [],
        notes: data.notes || "",
        aiReason: data.aiReason || "",
        leadScore: data.leadScore || 0,
        conversionProb: data.conversionProb || 0,
        mlConversionProb: data.mlConversionProb || 0,
        mlPredictedValue: data.mlPredictedValue || 0,
        mlLastScoredAt: data.mlLastScoredAt || null,
        mlModelVersion: data.mlModelVersion || null,
        stage: data.stage || "new",
        status: data.status || data.stage || "new",
        productInterests: data.productInterests || [],
        interactions: data.interactions || [],
      });
    }
    setMode?.("view");
  };

  const handleStatusChange = (newStatus) => {
    const statusOption = statusOptions.find((s) => s.value === newStatus);
    setForm((prev) => ({
      ...prev,
      status: newStatus,
      stage: statusOption?.stage || newStatus,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.name) {
      toast.error("Vui lòng nhập tiêu đề và tên khách hàng");
      return;
    }

    const isCreating = !data?.id;
    setIsSubmitting(true);

    try {
      if (isCreating) {
        // Creating new lead - call API
        const payload = {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          source: form.source || "website",
          priority: form.priority || "medium",
          notes: form.notes || null,
          deal_name: form.title,
          assigned_to: form.assigneeId || null,
          status: "NEW",
        };

        await createLead(payload);
        toast.success("Tạo lead thành công!");
        onSave?.({ ...form, shouldRefresh: true });
      } else {
        // Updating existing lead - call API
        const payload = {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          source: form.source || "website",
          priority: form.priority || "medium",
          notes: form.notes || null,
          deal_name: form.title,
          assigned_to: form.assigneeId || null,
        };

        await updateLead(data.id, payload);
        toast.success("Cập nhật lead thành công!");

        const updated = {
          ...form,
          value: Number(form.value) || 0,
          id: data.id,
          createdDate: data.createdDate || new Date().toISOString().split("T")[0],
          lastActivity: new Date().toISOString().split("T")[0],
        };

        // Don't call setMode here - let parent handle it
        onSave?.(updated);
      }
    } catch (error) {
      console.error("Failed to save lead:", error);
      toast.error(error.message || (isCreating ? "Tạo lead thất bại!" : "Cập nhật lead thất bại!"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));



  return (
    <div className="flex flex-col h-[70vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tiêu đề deal
              </label>
              <Input
                disabled={mode === "view"}
                value={form.title}
                onChange={handleChange("title")}
                placeholder="Nhập tiêu đề deal"
                variant="normal"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Tên khách hàng
                </label>
                <Input
                  disabled={mode === "view"}
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Nhập tên khách hàng"
                  variant="normal"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">
                  Giá trị (VNĐ)
                </label>
                <Input
                  disabled={mode === "view"}
                  type="number"
                  value={form.value}
                  onChange={handleChange("value")}
                  placeholder="0"
                  variant="normal"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  disabled={mode === "view"}
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="email@example.com"
                  variant="normal"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Số điện thoại
                </label>
                <Input
                  disabled={mode === "view"}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="0901234567"
                  variant="normal"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Nguồn</label>
                <Input
                  value={form.source}
                  onChange={(val) => setForm((f) => ({ ...f, source: val }))}
                  disabled={mode === "view"}
                  placeholder="Chọn nguồn"
                  variant="normal"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Trạng thái
                  <span className="text-xs text-gray-500 ml-1"></span>
                </label>
                <Input
                  variant="normal"
                  value={form.status.toUpperCase()}
                  //onChange={(val) => handleStatusChange(val)}
                  disabled={true}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Độ ưu tiên
                </label>
                <DropdownOptions
                  options={priorityOptions.map((p) => ({
                    value: p.value,
                    label: p.label,
                  }))}
                  value={form.priority}
                  onChange={(val) => setForm((f) => ({ ...f, priority: val }))}
                  disabled={mode === "view"}
                  placeholder="Chọn độ ưu tiên"
                  width="w-full"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Người phụ trách
                </label>
                <DropdownOptions
                  options={mockEmployees.map((emp) => ({
                    value: emp.id,
                    label: emp.name,
                  }))}
                  value={form.assigneeId || ""}
                  onChange={(val) => {
                    const emp = mockEmployees.find((e) => e.id === val);
                    setForm((f) => ({
                      ...f,
                      assigneeId: val,
                      assignee: emp?.name || "",
                    }));
                  }}
                  disabled={mode === "view"}
                  placeholder="Chọn người phụ trách"
                  width="w-full"
                />
              </div>
            </div>

            {/* AI Insights Section */}
            {(form.leadScore > 0 ||
              form.conversionProb > 0 ||
              form.aiReason) && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-900">
                  Đánh giá AI
                </h4>

                {/* Grid layout for metrics */}
                <div className="grid grid-cols-2 gap-2">
                  {form.leadScore > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 mb-1">Điểm Lead</p>
                      <p className="text-lg font-bold text-blue-900">
                        {form.leadScore}/100
                      </p>
                    </div>
                  )}

                  {form.conversionProb > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 mb-1">Xác suất chuyển đổi</p>
                      <p className="text-lg font-bold text-blue-900">
                        {(form.conversionProb * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Reason in separate box */}
                {form.aiReason && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-2 font-medium">Lý do đánh giá:</p>
                    <p className="text-sm text-blue-900 italic leading-relaxed">{form.aiReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* ML Model Predictions Section */}
            {(form.mlConversionProb > 0 || form.mlPredictedValue > 0 || form.mlModelVersion || form.mlLastScoredAt) && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-purple-900">
                  Dự đoán Machine Learning
                </h4>

                {/* Grid layout for ML metrics */}
                <div className="grid grid-cols-2 gap-2">
                  {form.mlConversionProb > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-700 mb-1">Xác suất chuyển đổi (ML)</p>
                      <p className="text-lg font-bold text-purple-900">
                        {(form.mlConversionProb * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {form.mlPredictedValue > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-700 mb-1">Giá trị dự đoán (ML)</p>
                      <p className="text-lg font-bold text-purple-900">
                        {formatCurrency(form.mlPredictedValue)}
                      </p>
                    </div>
                  )}

                  {form.mlModelVersion && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-700 mb-1">Phiên bản model</p>
                      <p className="text-sm font-semibold text-purple-900">
                        {form.mlModelVersion}
                      </p>
                    </div>
                  )}

                  {form.mlLastScoredAt && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-700 mb-1">Đánh giá lúc</p>
                      <p className="text-sm font-semibold text-purple-900">
                        {new Date(form.mlLastScoredAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Sản phẩm quan tâm
              </label>
              <textarea
                disabled={mode === "view"}
                value={form.products.join(", ")}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    products: e.target.value
                      .split(",")
                      .map((p) => p.trim())
                      .filter((p) => p),
                  }))
                }
                rows={2}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập các sản phẩm, cách nhau bằng dấu phẩy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ghi chú của khách hàng
              </label>
              <textarea
                disabled={mode === "view"}
                value={form.notes}
                onChange={handleChange("notes")}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Ghi chú từ khách hàng..."
              />
            </div>

            {/* Product Interests Section */}
            {mode === "view" && form.productInterests && form.productInterests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  Sản phẩm quan tâm ({form.productInterests.length})
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {form.productInterests.map((item) => (
                      <div key={item.lead_interest_id} className="flex items-start gap-2 text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <div className="flex gap-3 text-xs text-gray-600 mt-1">
                            <span>Lượt quan tâm: {item.interest_count}</span>
                            <span>•</span>
                            <span>Lần đầu: {new Date(item.first_interested_at).toLocaleDateString('vi-VN')}</span>
                            {item.status && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{item.status}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Interactions Timeline Section */}
            {mode === "view" && form.interactions && form.interactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  Lịch sử tương tác ({form.interactions.length})
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                  
                  <div className="space-y-3">
                    
                    {form.interactions.map((interaction) => {
                      const typeLabels = {
                        interested: 'Quan tâm',
                        promote_from_interest: 'Chuyển đổi từ interest',
                        contacted: 'Đã liên hệ',
                        email_opened: 'Mở email',
                        email_clicked: 'Click link email',
                      };
                      
                      return (
                        <div key={interaction.interaction_id} className="flex gap-3  pl-0">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {typeLabels[interaction.type] || interaction.type}
                              </span>
                              {interaction.score_delta && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  +{interaction.score_delta} điểm
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(interaction.occurred_at).toLocaleString('vi-VN')}
                            </p>
                            {interaction.properties?.product_name && (
                              <p className="text-xs text-gray-700 mt-1">
                                Sản phẩm: {interaction.properties.product_name}
                              </p>
                            )}
                            {interaction.properties?.updated_fields && (
                              <p className="text-xs text-gray-500 mt-1">
                                Cập nhật: {interaction.properties.updated_fields.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {mode === "view" && form.value > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">
                    Giá trị dự đoán:
                  </span>
                  <span className="text-lg font-semibold text-green-700">
                    {formatCurrency(form.value)}
                  </span>
                </div>
              </div>
            )}
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
              <ConfirmDialog
                title="Xác nhận xóa"
                description={
                  <>
                    Bạn có chắc chắn muốn xóa deal{" "}
                    <span className="font-semibold">{data?.title}</span>?
                  </>
                }
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete?.(data?.id)}
              >
                <Button variant="actionDelete">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </ConfirmDialog>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleSubmit} 
                variant="actionUpdate"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DealForm;
