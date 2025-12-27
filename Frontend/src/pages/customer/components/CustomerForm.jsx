import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import DropdownOptions from "@/components/common/DropdownOptions";
import { Edit, Plus, Save, Trash2, X, History, ArrowLeft } from "lucide-react";
import { CustomerTypes, CustomerSources, Industries } from "@/lib/data";
import InteractionHistory from "@/pages/customer/components/InteractionHistory";
import { Input } from "@/components/ui/input";
import PermissionGuard from "@/components/auth/PermissionGuard";

export function CustomerForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  onCancel,
  setMode,
  onViewInteractions,
  showHistory = false,
  onBackFromHistory,
  onShowHistoryChange,
}) {
  const [form, setForm] = useState({
    name: "",
    type: CustomerTypes.standard,
    birthDate: "",
    gender: "male",
    email: "",
    phone: "",
    address: "",
    socialMedia: "",
    source: CustomerSources.website,
    notes: "",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [showInteractionHistory, setShowInteractionHistory] =
    useState(showHistory);

  useEffect(() => {
    if (data) {
      // ensure birthDate is YYYY-MM-DD and socialMedia is string
      const formatBirth = (b) => {
        if (!b) return "";
        try {
          return b.split("T")[0];
        } catch (e) {
          return b;
        }
      };
      const socialToString = (s) => {
        if (!s) return "";
        if (typeof s === "string") return s;
        if (typeof s === "object") {
          return Object.entries(s)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ");
        }
        return String(s);
      };

      setForm({
        name: data.name || "",
        type: data.type || CustomerTypes.standard,
        birthDate: formatBirth(data.birthDate || ""),
        gender: data.gender || "male",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        socialMedia: socialToString(data.socialMedia || ""),
        source: data.source || CustomerSources.website,
        notes: data.notes || "",
        tags: data.tags || [],
      });
    } else {
      // Reset form for new entries
      setForm({
        name: "",
        type: CustomerTypes.standard,
        birthDate: "",
        gender: "male",
        email: "",
        phone: "",
        address: "",
        socialMedia: "",
        source: CustomerSources.website,
        notes: "",
        tags: [],
      });
    }
  }, [data, mode]);

  useEffect(() => {
    setShowInteractionHistory(showHistory);
  }, [showHistory]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        name: data.name || "",
        type: data.type || CustomerTypes.standard,
        birthDate: data.birthDate || "",
        gender: data.gender || "male",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        socialMedia: data.socialMedia || "",
        source: data.source || CustomerSources.website,
        notes: data.notes || "",
        tags: data.tags || [],
      });
      setMode?.("view");
    } else {
      onCancel?.();
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      toast.error("Vui lòng nhập tên khách hàng và email");
      return;
    }

    onSave({
      ...form,
      id: data?.id,
    });

    // Nếu là update, chuyển về view mode
    if (data?.id) {
      setMode?.("view");
    }
  };

  const handleViewInteractions = () => {
    setShowInteractionHistory(true);
    // Notify parent that we're now showing history
    if (onShowHistoryChange) {
      onShowHistoryChange(true);
    }
  };

  const handleBackFromInteractions = () => {
    setShowInteractionHistory(false);
    // Notify parent that we're no longer showing history
    if (onShowHistoryChange) {
      onShowHistoryChange(false);
    }
    if (onBackFromHistory) {
      onBackFromHistory();
    }
  };

  // Show interaction history if requested
  if (showInteractionHistory && data?.id) {
    return (
      <InteractionHistory
        customerId={data.id}
        customerName={data.name}
        onBack={handleBackFromInteractions}
      />
    );
  }

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Tên và phân loại */}
            <div className="flex gap-3">
              <div className="flex-2">
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
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Phân loại
                </label>
                <div className="w-full">
                  <DropdownOptions
                    options={Object.values(CustomerTypes).map((t) => ({
                      value: t,
                      label: t,
                    }))}
                    value={form.type}
                    onChange={(val) => setForm((f) => ({ ...f, type: val }))}
                    disabled={mode === "view"}
                    placeholder="Chọn phân loại"
                    width="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Ngày sinh và giới tính */}
            <div className="flex gap-3">
              <div className="flex-2">
                <label className="block text-sm font-medium mb-1">
                  Ngày sinh
                </label>
                <Input
                  disabled={mode === "view"}
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange("birthDate")}
                  variant="normal"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Giới tính
                </label>
                <div className="w-full">
                  <DropdownOptions
                    options={[
                      { value: "male", label: "Nam" },
                      { value: "female", label: "Nữ" },
                      { value: "other", label: "Khác" },
                    ]}
                    value={form.gender}
                    onChange={(val) => setForm((f) => ({ ...f, gender: val }))}
                    disabled={mode === "view"}
                    placeholder="Chọn giới tính"
                    width="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Email và SĐT */}
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
                <label className="flex-1 text-sm font-medium mb-1">SĐT</label>
                <Input
                  disabled={mode === "view"}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="0123456789"
                  variant="normal"
                />
              </div>
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ</label>
              <Input
                disabled={mode === "view"}
                value={form.address}
                onChange={handleChange("address")}
                placeholder="Nhập địa chỉ"
                variant="normal"
              />
            </div>

            {/* Mạng xã hội và nguồn khách hàng */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Mạng xã hội / Kênh liên lạc
                </label>
                <Input
                  disabled={mode === "view"}
                  value={form.socialMedia}
                  onChange={handleChange("socialMedia")}
                  placeholder="VD: Facebook: username"
                  variant="normal"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium mb-1">
                  Nguồn KH
                </label>
                <Input
                  disabled={mode === "view"}
                  value={form.source}
                  onChange={handleChange("source")}
                  placeholder="Nguồn khách hàng"
                  variant="normal"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                    {(mode === "edit" || mode === "create") && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {(mode === "edit" || mode === "create") && (
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
                    }
                    placeholder="Nhập tag và nhấn Enter"
                    variant="normal"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="actionUpdate"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm
                  </Button>
                </div>
              )}
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <textarea
                disabled={mode === "view"}
                value={form.notes}
                onChange={handleChange("notes")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập ghi chú"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-between items-center">
          {/* Left side - Interaction History/Back button (only show if customer exists) */}
          <div>
            {/* Chỉ hiển thị nút Lịch sử tương tác ở chế độ view */}
            {data?.id && (
              <PermissionGuard module="customer" action="read">
                <Button
                  variant="actionUpdate"
                  onClick={handleViewInteractions}
                  className="flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Lịch sử tương tác
                </Button>
              </PermissionGuard>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex gap-3">
            {mode === "view" ? (
              <>
                <PermissionGuard module="customer" action="update">
                  <Button
                    variant="actionUpdate"
                    onClick={() => setMode?.("edit")}
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
                </PermissionGuard>

                <PermissionGuard module="customer" action="delete">
                  <ConfirmDialog
                    title="Xác nhận xóa"
                    description={
                      <>
                        Bạn có chắc chắn muốn xóa khách hàng{" "}
                        <span className="font-semibold text-black">
                          {data?.name}
                        </span>
                        ?
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
                </PermissionGuard>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Hủy
                </Button>
                <PermissionGuard
                  module="customer"
                  action={mode === "create" ? "create" : "update"}
                >
                  <Button onClick={handleSubmit} variant="actionUpdate">
                    <Save className="w-4 h-4" />
                    {mode === "create" ? "Thêm khách hàng" : "Lưu thay đổi"}
                  </Button>
                </PermissionGuard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerForm;
