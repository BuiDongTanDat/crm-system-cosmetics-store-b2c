import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2, X } from "lucide-react";
import { StatusList } from "@/lib/data";

export function EmployeeForm({
  mode = "view",
  employee = null,
  onClose,
  onSave,
  onDelete,
  availableRoles = [],
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Sales",
    status: "Active",
    password: "",
  });

  const [editMode, setEditMode] = useState(mode === "edit");

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        role: employee.role || "Sales",
        status: employee.status || "Active",
        password: "", // Don't pre-fill password for security
      });
    }
    setEditMode(mode === "edit");
  }, [employee, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCancel = () => {
    if (employee) {
      setForm({
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        role: employee.role || "Sales",
        status: employee.status || "Active",
        password: "",
      });
    }
    setEditMode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert("Vui lòng nhập họ tên và email");
      return;
    }
    onSave({
      ...form,
      id: employee?.id,
    });
    setEditMode(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <input
              disabled={!editMode}
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
                placeholder="0123456"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Vai trò</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div
                    className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                      !editMode
                        ? "bg-gray-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-blue-500"
                    }`}
                  >
                    <span className="text-sm">{form.role}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  {availableRoles.map((role) => (
                    <DropdownMenuItem
                      key={role.id}
                      onSelect={() => setForm((f) => ({ ...f, role: role.name }))}
                    >
                      {role.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div
                    className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                      !editMode
                        ? "bg-gray-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-blue-500"
                    }`}
                  >
                    <span className="text-sm">{form.status}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {StatusList.map((status) => (
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

          {editMode && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {employee ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder={employee ? "Nhập mật khẩu mới" : "Nhập mật khẩu"}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          {!editMode ? (
            <>
              <Button variant="actionUpdate" onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4" />
                
                Chỉnh sửa
              </Button>
              <Button
                variant="actionDelete"
                onClick={() => onDelete(employee.id)}
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
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

export default EmployeeForm;
