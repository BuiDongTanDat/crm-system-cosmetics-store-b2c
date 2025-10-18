import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, Plus, Save, Trash2, X, History, ArrowLeft } from "lucide-react";
import { StatusList, CustomerTypes, CustomerSources, Industries } from "@/lib/data";
import InteractionHistory from "@/pages/customer/components/InteractionHistory";

export function CustomerForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
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
    gender: "Nam",
    industry: "Công nghệ thông tin",
    email: "",
    phone: "",
    address: "",
    socialMedia: "",
    source: CustomerSources.website,
    notes: "",
    tags: [],
    status: "Active",
  });

  const [tagInput, setTagInput] = useState("");
  const [showInteractionHistory, setShowInteractionHistory] = useState(showHistory);
  

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        type: data.type || CustomerTypes.standard,
        birthDate: data.birthDate || "",
        gender: data.gender || "Nam",
        industry: data.industry || "Công nghệ thông tin",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        socialMedia: data.socialMedia || "",
        source: data.source || CustomerSources.website,
        notes: data.notes || "",
        tags: data.tags || [],
        status: data.status || "Active",
      });
    } else {
      // Reset form for new entries
      setForm({
        name: "",
        type: CustomerTypes.standard,
        birthDate: "",
        gender: "Nam",
        industry: "Công nghệ thông tin",
        email: "",
        phone: "",
        address: "",
        socialMedia: "",
        source: CustomerSources.website,
        notes: "",
        tags: [],
        status: "Active",
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
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        name: data.name || "",
        type: data.type || CustomerTypes.standard,
        birthDate: data.birthDate || "",
        gender: data.gender || "Nam",
        industry: data.industry || "Công nghệ thông tin",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        socialMedia: data.socialMedia || "",
        source: data.source || CustomerSources.website,
        notes: data.notes || "",
        tags: data.tags || [],
        status: data.status || "Active",
      });
    }
    setMode?.("view");
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      alert("Vui lòng nhập tên khách hàng và email");
      return;
    }

    const isCreating = !data?.id;

    onSave({
      ...form,
      id: data?.id,
    });

    // Nếu là update, chuyển về view mode
    if (!isCreating) {
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
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Tên khách hàng</label>
                <input
                  disabled={mode === "view"}
                  value={form.name}
                  onChange={handleChange("name")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Phân loại</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
                      <span className="text-sm">{form.type}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {Object.values(CustomerTypes).map((type) => (
                      <DropdownMenuItem key={type} onSelect={() => setForm((f) => ({ ...f, type }))}>
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Ngày sinh và giới tính */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange("birthDate")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Giới tính</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
                      <span className="text-sm">{form.gender}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {["Nam", "Nữ", "Khác"].map((gender) => (
                      <DropdownMenuItem key={gender} onSelect={() => setForm((f) => ({ ...f, gender }))}>
                        {gender}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Ngành nghề */}
            <div>
              <label className="block text-sm font-medium mb-1">Ngành nghề / Lĩnh vực</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={mode === "view"}>
                  <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
                    <span className="text-sm">{form.industry}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {Industries.map((industry) => (
                    <DropdownMenuItem key={industry} onSelect={() => setForm((f) => ({ ...f, industry }))}>
                      {industry}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Email và SĐT */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  disabled={mode === "view"}
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="email@example.com"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium mb-1">SĐT</label>
                <input
                  disabled={mode === "view"}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0123456789"
                />
              </div>
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ</label>
              <input
                disabled={mode === "view"}
                value={form.address}
                onChange={handleChange("address")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập địa chỉ"
              />
            </div>

            {/* Mạng xã hội và nguồn khách hàng */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Mạng xã hội / Kênh liên lạc</label>
                <input
                  disabled={mode === "view"}
                  value={form.socialMedia}
                  onChange={handleChange("socialMedia")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="VD: Facebook: username"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Nguồn KH</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
                      <span className="text-sm">{form.source}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {Object.values(CustomerSources).map((source) => (
                      <DropdownMenuItem key={source} onSelect={() => setForm((f) => ({ ...f, source }))}>
                        {source}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {tag}
                    {mode === "edit" && (
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-blue-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {mode === "edit" && (
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Nhập tag và nhấn Enter"
                  />
                  <Button type="button" onClick={handleAddTag} variant="actionUpdate" >
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

            {/* Trạng thái */}
            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={mode === "view"}>
                  <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
                    <span className="text-sm">{form.status}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {StatusList.map((status) => (
                    <DropdownMenuItem key={status} onSelect={() => setForm((f) => ({ ...f, status }))}>
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
              <Button
                variant="actionUpdate"
                onClick={handleViewInteractions}
                className="flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                Lịch sử tương tác
              </Button>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex gap-3">
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
    </div>
      
  );
}


export default CustomerForm;
