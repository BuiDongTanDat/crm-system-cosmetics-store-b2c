import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DropdownOptions from "@/components/common/DropdownOptions";
import { Edit, Save, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import PermissionGuard from "@/components/auth/PermissionGuard";

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "ACTIVE" },
    { value: "INACTIVE", label: "INACTIVE" }
];

export default function CategoryForm({
    data = null,
    mode: propMode,
    onSave,
    onDelete,
    onClose,
    setMode: propSetMode
}) {
    // Quản lý mode nội bộ nếu không truyền setMode
    const [mode, setMode] = useState(propMode || (data ? "view" : "add"));
    const [form, setForm] = useState({
        category_id: null, // added
        name: "",
        description: "",
        status: "ACTIVE"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMode(propMode || (data ? "view" : "add"));
    }, [propMode, data]);

    useEffect(() => {
        if (data) {
            setForm({
                category_id: data.category_id || data.id || null, // set category_id from either field
                name: data.name || "",
                description: data.description || "",
                status: data.status || "ACTIVE"
            });
        } else {
            setForm({
                category_id: null,
                name: "",
                description: "",
                status: "ACTIVE"
            });
        }
    }, [data]);

    const isView = mode === "view";

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleStatusChange = (value) => {
        setForm(prev => ({ ...prev, status: value }));
    };

    const handleCancel = () => {
        if (data) {
            setForm({
                category_id: data.category_id || data.id || null,
                name: data.name || "",
                description: data.description || "",
                status: data.status || "ACTIVE"
            });
            (propSetMode || setMode)("view");
        } else {
            (propSetMode || setMode)("close");
            onClose?.();
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Tên danh mục không được để trống!");
            return;
        }

        // Đảm bảo status luôn là "ACTIVE" hoặc "INACTIVE"
        const status = form.status === "ACTIVE" || form.status === "INACTIVE"
            ? form.status
            : (form.status === "Active" ? "ACTIVE" : (form.status === "Inactive" ? "INACTIVE" : "ACTIVE"));

        const payload = {
            name: form.name,
            description: form.description,
            status,
            ...(form.category_id ? { category_id: form.category_id } : {})
        };

        try {
            setIsSubmitting(true);
            const res = await onSave?.(payload);
            // Nếu onSave trả về object lỗi theo contract { success: false, message }
            if (res && res.success === false) {
                // Này bên page sẽ toast lỗi từ API nên tắt cái này tránh toast 2 lần á
                // toast.error(String(res.message || "Có lỗi khi lưu danh mục"));
                // giữ modal mở và ở chế độ edit để người dùng sửa
                (propSetMode || setMode)("edit");
                return;
            }

            // Nếu thành công: chuyển mode/đóng modal như trước
            if (data?.category_id || data?.id) {
                (propSetMode || setMode)("view");
            } else {
                (propSetMode || setMode)("close");
                onClose?.();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-[60vh]">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên danh mục</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange("name")}
                                disabled={isView}
                                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50 text-sm"
                                required
                                placeholder="Nhập tên danh mục"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mô tả</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange("description")}
                                disabled={isView}
                                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50 text-sm"
                                rows={3}
                                placeholder="Nhập mô tả"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Trạng thái</label>
                            <DropdownOptions
                                options={STATUS_OPTIONS}
                                value={form.status}
                                onChange={handleStatusChange}
                                disabled={isView}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Fixed Action Buttons */}
            <div className="border-t bg-white p-6 flex-shrink-0">
                <div className="flex justify-end gap-3">
                    {isView ? (
                        <>
                            <PermissionGuard module="category" action="update">
                                <Button variant="actionUpdate" onClick={() => (propSetMode || setMode)("edit")}>
                                    <Edit className="w-4 h-4" />
                                    Chỉnh sửa
                                </Button>
                            </PermissionGuard>

                            {/* <PermissionGuard module="category" action="delete">
                                <ConfirmDialog
                                    title="Xác nhận xóa"
                                    description={
                                        <>
                                            Bạn có chắc chắn muốn xóa danh mục{" "}
                                            <span className="font-semibold text-black">{data?.name}</span>?
                                        </>
                                    }
                                    confirmText="Xóa"
                                    cancelText="Hủy"
                                    onConfirm={() => onDelete?.(data?.category_id || data?.id)}
                                >
                                    <Button variant="actionDelete">
                                        <Trash2 className="w-4 h-4" />
                                        Xóa
                                    </Button>
                                </ConfirmDialog>
                            </PermissionGuard> */}
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Hủy
                            </Button>
                            <PermissionGuard
                                module="category"
                                action={mode === "add" || mode === "create" ? "create" : "update"}
                            >
                                <Button type="submit" onClick={handleSubmit} variant="actionUpdate" disabled={isSubmitting}>
                                    <Save className="w-4 h-4" />
                                    {mode === "create" || mode === "add" ? "Tạo danh mục" : "Lưu thay đổi"}
                                </Button>
                            </PermissionGuard>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
