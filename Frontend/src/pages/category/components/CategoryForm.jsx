import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DropdownOptions from "@/components/common/DropdownOptions";
import { Edit, Save, Trash2 } from "lucide-react";

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
    const [form, setForm] = useState({
        category_id: null, // added
        name: "",
        description: "",
        status: "ACTIVE"
    });
    // Quản lý mode nội bộ nếu không truyền setMode
    const [mode, setMode] = useState(propMode || (data ? "view" : "add"));

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
    const isEdit = mode === "edit" || mode === "add";

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

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!form.name.trim()) {
            alert("Tên danh mục không được để trống!");
            return;
        }
        // Đảm bảo status luôn là "ACTIVE" hoặc "INACTIVE"
        const status = form.status === "ACTIVE" || form.status === "INACTIVE"
            ? form.status
            : (form.status === "Active" ? "ACTIVE" : (form.status === "Inactive" ? "INACTIVE" : "ACTIVE"));

        // Gửi nguyên form (bao gồm category_id chỉ khi có giá trị)
        const payload = {
            name: form.name,
            description: form.description,
            status,
            ...(form.category_id ? { category_id: form.category_id } : {}) // <-- only include if truthy
        };

        onSave(payload);

        // điều chỉnh mode/đóng modal dựa trên presence của category_id / id
        if (data?.category_id || data?.id) {
            (propSetMode || setMode)("view");
        } else {
            (propSetMode || setMode)("close");
            onClose?.();
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
                            <Button variant="actionUpdate" onClick={() => (propSetMode || setMode)("edit")}>
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                            </Button>
                            <Button variant="actionDelete" onClick={() => onDelete?.(data?.id)}>
                                <Trash2 className="w-4 h-4" />
                                Xóa
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Hủy
                            </Button>
                            <Button type="submit" onClick={handleSubmit} variant="actionUpdate">
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
