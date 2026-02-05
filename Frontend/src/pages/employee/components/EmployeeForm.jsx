import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DropdownOptions from '@/components/common/DropdownOptions';
import { Input } from "@/components/ui/input";
import { Edit, Save, Trash2 } from "lucide-react";
import { StatusList } from "@/lib/data";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import PermissionGuard from "@/components/auth/PermissionGuard";

export function EmployeeForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  availableRoles = [],
  setMode,
  onClose,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Sales",
    status: "ACTIVE",
    password: "",
  });

  useEffect(() => {
    // Chỉ nạp dữ liệu từ data vào form khi:
    // 1. data tồn tại (chế độ View hoặc Edit nhân viên cũ)
    // 2. data thay đổi (người dùng chọn nhân viên khác)
    if (data) {
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "Sales",
        status: (data.status || "active").toUpperCase(),
        password: "", // Luôn để trống password khi load dữ liệu cũ
      });
    } else if (mode === "create") {
      // Nếu là create mới hoàn toàn, và form hiện đang có dữ liệu (do người dùng đã nhập)
      // thì KHÔNG reset. Chỉ reset nếu form đang trống (lần đầu mở).
      // Cách an toàn nhất là chỉ reset khi component này "Mount" (lần đầu xuất hiện)
    }
  }, [data]);


  const handleCancel = () => {
    if (data) {
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "Sales",
        status: (data.status || "active").toUpperCase(),
        password: "",
      });
      setMode?.("view");
    } else {
      // Nếu là thêm mới thì đóng modal luôn
      setMode?.("close");
      if (typeof onClose === "function") onClose();
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error("Vui lòng nhập họ tên và email");
      return;
    }

    try {
      // Trả về kết quả save, để page quyết định có đóng/chuyển view hay không
      await onSave({
        ...form,
        id: data?.id,
        status: form.status.toLowerCase(),
      });


    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi lưu nhân viên.";
      toast.error(errorMessage);
      // Không reset form ở đây nữa, giữ nguyên dữ liệu người dùng vừa nhập
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
              <Input
                disabled={mode === "view"}
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Nhập họ tên"
                variant="normal"
              />
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
              <div className="w-40">
                <label className="block text-sm font-medium mb-1">SĐT</label>
                <Input
                  disabled={mode === "view"}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="0123456"
                  variant="normal"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Vai trò</label>
                <DropdownOptions
                  options={availableRoles.map((role, idx) => ({
                    ...role,
                    key: role.value || role.label || idx
                  }))}
                  value={form.role}
                  onChange={(value) => setForm((f) => ({ ...f, role: value }))}
                  disabled={mode === "view"}
                />
              </div>

              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownOptions
                  options={StatusList.map((status, idx) => ({
                    value: status.toUpperCase(),
                    label: status.toUpperCase(),
                    key: status.toUpperCase()
                  }))}
                  value={form.status}
                  onChange={(value) => setForm((f) => ({ ...f, status: value }))}
                  disabled={mode === "view"}
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
              <PermissionGuard module="user" action="update">
                <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
              </PermissionGuard>
              {/* Bọc nút Xóa bằng ConfirmDialog */}
              <PermissionGuard module="user" action="delete">
                <ConfirmDialog
                  title="Xác nhận xóa"
                  description={
                    <>
                      Bạn có chắc chắn muốn xóa nhân viên{" "}
                      <span className="font-semibold text-black">{data?.name}</span>?
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
              <Button onClick={handleSubmit} variant="actionUpdate">
                <Save className="w-4 h-4" />
                {mode === "create" ? "Tạo nhân viên" : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeForm;