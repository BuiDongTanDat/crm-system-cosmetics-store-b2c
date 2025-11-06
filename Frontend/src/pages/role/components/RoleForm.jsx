import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";

export function RoleForm({
    mode = "view",
    data = null,
    onSave,
    onDelete,
    setMode,
    permissionsList = [],
    onCancel,
}) {
    const [form, setForm] = useState({
        role_name: "",
        permissions: [],
    });

    useEffect(() => {
        if (data) {
            setForm({
                role_name: data.role_name || "",
                permissions: data.permissions || [],
            });
        } else {
            setForm({
                role_name: "",
                permissions: [],
            });
        }
    }, [data, mode]);

    const handleChange = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handlePermissionToggle = (permission) => {
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

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
                    <div className="w-full gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên vai trò</label>
                            <Input
                                disabled={mode !== "create"} // chỉ cho nhập khi tạo mới
                                value={form.role_name}
                                onChange={handleChange("role_name")}
                                placeholder="Nhập tên vai trò"
                                variant="normal"
                            />
                        </div>
                    </div>

                    {/* Quyền hạn */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Quyền hạn</label>
                        <div className="flex flex-col gap-4 pr-2">
                            {permissionsList && permissionsList.length > 0 ? (
                                permissionsList.map((group) => (
                                    <div key={group.group} className="mb-2">
                                        <div className="font-semibold text-gray-400 mb-1 text-[13px]">{group.label}</div>
                                        <div className="flex gap-2 flex-wrap">
                                            {group.permissions.map((permission) => {
                                                const isActive = form.permissions.includes(permission);
                                                return (
                                                    <Button
                                                        variant={isActive ? "actionCreate" : "actionNormal"}
                                                        key={permission}
                                                        type="button"
                                                        onClick={() => {
                                                            if (mode !== "view") handlePermissionToggle(permission);
                                                        }}
                                                        disabled={mode === "view"}
                                                        className="border border-gray-300 text-sm px-3 py-1 rounded-md"
                                                    >
                                                        {permission}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400 text-sm italic">
                                    Không có dữ liệu phân quyền. Vui lòng kiểm tra cấu hình.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Action buttons cố định */}
            <div className="border-t bg-white p-6 flex-shrink-0 sticky bottom-0">
                <div className="flex justify-end gap-3">
                    {mode === "view" ? (
                        <>
                            <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                            </Button>

                            {/* Bọc nút Xóa bằng ConfirmDialog */}
                            <ConfirmDialog
                                title="Xác nhận xóa"
                                description={
                                    <>
                                        Bạn có chắc chắn muốn xóa vai trò{" "}
                                        <span className="font-semibold text-black">{data?.role_name}</span>?
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

export default RoleForm;
