import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import PermissionGuard from "@/components/auth/PermissionGuard";

export function RoleForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
  permissionsList = [],
  actionsList = [],
  onCancel,
}) {
  const [form, setForm] = useState({
    role_name: "",
    description: "",
    permissions: [],
  });

  useEffect(() => {
    if (data) {
      setForm({
        role_name: data.role_name || "",
        description: data.description || "",
        permissions: permissionsList.map((basePerm) => {
          // Lấy quyền từ data nếu có, nếu không thì false
          const dataPerm =
            data.permissions.find((p) => p.name === basePerm.name) || {};

          const obj = { name: basePerm.name };

          actionsList.forEach((action) => {
            // render action theo permissionsList
            if (Object.prototype.hasOwnProperty.call(basePerm, action)) {
              // checked theo data.permissions
              obj[action] = !!dataPerm[action];
            }
          });
          return obj;
        }),
      });
    } else {
      setForm({
        role_name: "",
        description: "",
        permissions: permissionsList.map((p) => {
          const obj = { name: p.name };
          actionsList.forEach((action) => {
            if (Object.prototype.hasOwnProperty.call(p, action)) {
              obj[action] = false;
            }
          });
          return obj;
        }),
      });
    }
  }, [data, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!form.role_name) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }

    // Gửi kèm mode để cha biết là create hay update
    onSave({ ...form, mode });

    // Chỉ quay lại view khi đang ở edit (ko phải create)
    if (mode === "edit" && data?.role_name) {
      setMode?.("view");
    }
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        role_name: data.role_name || "",
        permissions: data.permissions || [],
      });
      setMode?.("view");
    } else {
      onCancel?.();
    }
  };

  return (
    <div className="flex flex-col overflow-hidden h-[80vh]">
      {/* Nội dung cuộn riêng trong form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Tên  */}
          <div className="w-full gap-2 flex-col">
            <label className="block text-sm font-medium mb-1">
              Tên vai trò
            </label>
            <Input
              disabled={mode !== "create"} // chỉ cho nhập khi tạo mới
              value={form.role_name}
              onChange={handleChange("role_name")}
              placeholder="Nhập tên vai trò"
              variant="normal"
            />
          </div>
          <div className="w-full gap-2 flex-col">
            {/* Mô tả */}
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              disabled={mode === "view"}
              value={form.description}
              onChange={handleChange("description")}
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 disabled:hover:border-slate-200 hover:border-blue-500 bg-white border  border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-muted/30 resize-none"
              placeholder="Nhập mô tả vai trò."
            />
          </div>

          {/* Quyền hạn */}
          <label className="block text-sm  font-medium mb-1">
            Thiết lập quyền
          </label>
          <table className=" w-full border border-blue-500 rounded-md overflow-hidden">
            <thead className="bg-slate-100 text-sm font-normal">
              <tr>
                <th className="p-2 text-left">Module</th>
                {actionsList.map((action) => (
                  <th key={action} className="p-2 text-center capitalize">
                    {action}
                  </th>
                ))}
                <th className="p-2 text-center">Tất cả</th>
              </tr>
            </thead>
            <tbody>
              {/* perm là mỗi module, và trong mỗi perm có CRUD action */}
              {form.permissions.map((perm, index) => {
                // Xử lý checkbox "Tất cả"
                const allChecked = actionsList.every((action) =>
                  perm.hasOwnProperty(action) ? perm[action] : true
                );

                return (
                  <tr key={perm.name} className="border-t ">
                    <td className="p-3 font-medium">{perm.name}</td>
                    {actionsList.map((action) => (
                      <td
                        key={`${perm.name}-${action}`}
                        className="p-3 text-center"
                      >
                        {perm.hasOwnProperty(action) ? (
                          <Checkbox
                            checked={perm[action]}
                            disabled={mode === "view"}
                            variant="table"
                            onCheckedChange={(checked) => {
                              const updated = [...form.permissions];
                              updated[index] = {
                                ...updated[index],
                                [action]: checked === true,
                              };
                              setForm((prev) => ({
                                ...prev,
                                permissions: updated,
                              }));
                            }}
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    ))}

                    <td className="p-3 text-center">
                      <Checkbox
                        checked={allChecked}
                        disabled={mode === "view"}
                        variant="all"
                        onCheckedChange={(checked) => {
                          const updated = [...form.permissions];
                          actionsList.forEach((action) => {
                            if (updated[index].hasOwnProperty(action)) {
                              updated[index][action] = checked === true;
                            }
                          });
                          setForm((prev) => ({
                            ...prev,
                            permissions: updated,
                          }));
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons cố định */}
      <div className="border-t bg-white p-6 flex-shrink-0 sticky bottom-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <PermissionGuard module="role" action="update">
                <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
              </PermissionGuard>
              {/* Bọc nút Xóa bằng ConfirmDialog */}
              <PermissionGuard module="role" action="delete">
                <ConfirmDialog
                  title="Xác nhận xóa"
                  description={
                    <>
                      Bạn có chắc chắn muốn xóa vai trò{" "}
                      <span className="font-semibold text-black">
                        {data?.role_name}
                      </span>
                      ?
                    </>
                  }
                  confirmText="Xóa"
                  cancelText="Hủy"
                  onConfirm={() => onDelete(data?.role_name)}
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
                {mode === "create" ? "Tạo vai trò" : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoleForm;
