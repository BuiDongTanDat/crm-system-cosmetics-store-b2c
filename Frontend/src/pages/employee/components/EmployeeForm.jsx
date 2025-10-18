import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DropdownOptions from '@/components/common/DropdownOptions';
import { Edit, Save, Trash2 } from "lucide-react";
import { StatusList } from "@/lib/data";

export function EmployeeForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  availableRoles = [],
  setMode,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Sales",
    status: "Active",
    password: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "Sales",
        status: data.status || "Active",
        password: "", // Don't pre-fill password for security
      });
    }
  }, [data]);

  const handleCancel = () => {
    if (data) {
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "Sales",
        status: data.status || "Active",
        password: "",
      });
    }
    setMode?.("view");
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      alert("Vui lòng nhập họ tên và email");
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

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Họ tên</label>
              <input
                disabled={mode === "view"}
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập họ tên"
              />
            </div>

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
                  placeholder="0123456"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Vai trò</label>
                <DropdownOptions
                  options={availableRoles}
                  value={form.role}
                  onChange={(value) => setForm((f) => ({ ...f, role: value }))}
                  disabled={mode === "view"}
                />
              </div>

              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownOptions
                  options={StatusList.map(status => ({ value: status, label: status }))}
                  value={form.status}
                  onChange={(value) => setForm((f) => ({ ...f, status: value }))}
                  disabled={mode === "view"}
                />
              </div>
            </div>

            {mode === "edit" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {data ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder={data ? "Nhập mật khẩu mới" : "Nhập mật khẩu"}
                />
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

export default EmployeeForm;