import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2, X } from "lucide-react";
import { StatusList, CustomerTypes, CustomerSources, Industries } from "@/lib/data";

export function CustomerForm({
  mode = "view",
  customer = null,
  onClose,
  onSave,
  onDelete,
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

  const [editMode, setEditMode] = useState(mode === "edit");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        type: customer.type || CustomerTypes.standard,
        birthDate: customer.birthDate || "",
        gender: customer.gender || "Nam",
        industry: customer.industry || "Công nghệ thông tin",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        socialMedia: customer.socialMedia || "",
        source: customer.source || CustomerSources.website,
        notes: customer.notes || "",
        tags: customer.tags || [],
        status: customer.status || "Active",
      });
    }
    setEditMode(mode === "edit");
  }, [customer, mode]);

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
    if (customer) {
      setForm({
        name: customer.name || "",
        type: customer.type || CustomerTypes.standard,
        birthDate: customer.birthDate || "",
        gender: customer.gender || "Nam",
        industry: customer.industry || "Công nghệ thông tin",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        socialMedia: customer.socialMedia || "",
        source: customer.source || CustomerSources.website,
        notes: customer.notes || "",
        tags: customer.tags || [],
        status: customer.status || "Active",
      });
    }
    setEditMode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert("Vui lòng nhập tên khách hàng và email");
      return;
    }
    onSave({
      ...form,
      id: customer?.id,
    });
    setEditMode(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {/* Tên và phân loại */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Tên khách hàng</label>
              <input
                disabled={!editMode}
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Phân loại</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${!editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
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
                disabled={!editMode}
                type="date"
                value={form.birthDate}
                onChange={handleChange("birthDate")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Giới tính</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${!editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
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
              <DropdownMenuTrigger asChild disabled={!editMode}>
                <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${!editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
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
                disabled={!editMode}
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
                disabled={!editMode}
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
              disabled={!editMode}
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
                disabled={!editMode}
                value={form.socialMedia}
                onChange={handleChange("socialMedia")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="VD: Facebook: username"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Nguồn KH</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${!editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
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
                  {editMode && (
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-blue-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editMode && (
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Nhập tag và nhấn Enter"
                />
                <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                  Thêm
                </Button>
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              disabled={!editMode}
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
              <DropdownMenuTrigger asChild disabled={!editMode}>
                <div className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${!editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}`}>
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

        <div className="flex justify-end gap-3 mt-4">
          {!editMode ? (
            <>
              <Button variant="actionUpdate" onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button variant="actionDelete" onClick={() => onDelete(customer.id)}>
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
              <Button type="submit" variant="actionUpdate">
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default CustomerForm;
