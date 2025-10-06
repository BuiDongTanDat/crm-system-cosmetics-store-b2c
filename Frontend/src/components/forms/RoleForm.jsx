import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2 } from "lucide-react";
import { StatusList } from "@/lib/data";

export function RoleForm({
    mode = "view",
    data = null,
    onSave,
    onDelete,
    setMode,
}) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        permissions: [],
        status: "Active",
    });

    const [editMode, setEditMode] = useState(mode === "edit");
    const availablePermissions = ["read", "write", "delete"];

    useEffect(() => {
        if (data) {
            setForm({
                name: data.name || "",
                description: data.description || "",
                permissions: data.permissions || [],
                status: data.status || "Active",
            });
        } else {
            setForm({
                name: "",
                description: "",
                permissions: [],
                status: "Active",
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
        if (!form.name) {
            alert("Vui lòng nhập tên vai trò");
            return;
        }
        
        onSave({
            ...form,
            id: data?.id,
        });
        
        // Chỉ chuyển về view mode nếu là update (có data.id)
        // Nếu là create thì page sẽ tự đóng modal
        if (data?.id) {
            setMode?.("view");
        }
    };

    const handleCancel = () => {
        if (data) {
            setForm({
                name: data.name || "",
                description: data.description || "",
                permissions: data.permissions || [],
                status: data.status || "Active",
            });
        }
        setMode?.("view");
    };

    return (
        <div className="flex flex-col h-[60vh]">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên vai trò</label>
                            <input
                                disabled={mode === "view"}
                                value={form.name}
                                onChange={handleChange("name")}
                                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                                placeholder="Nhập tên vai trò"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Mô tả</label>
                            <textarea
                                disabled={mode === "view"}
                                value={form.description}
                                onChange={handleChange("description")}
                                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                                placeholder="Nhập mô tả vai trò"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-start justify-between gap-6">
                            {/* Phân quyền */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">Quyền hạn</label>
                                <div className="flex gap-4 flex-wrap">
                                    {availablePermissions.map((permission) => (
                                        <label
                                            key={permission}
                                            className={`
                                                flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all duration-200
                                                ${mode === "view" ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                                                ${
                                                    form.permissions.includes(permission)
                                                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                                                        : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 active:scale-80'
                                                }
                                            `}
                                            onClick={() => handlePermissionToggle(permission)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.permissions.includes(permission)}
                                                onChange={() => handlePermissionToggle(permission)}
                                                disabled={mode === "view"}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`
                                                    w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200
                                                    ${
                                                        form.permissions.includes(permission)
                                                            ? 'border-white bg-white'
                                                            : 'border-gray-400 bg-white'
                                                    }
                                                `}
                                            >
                                                {form.permissions.includes(permission) && (
                                                    <svg
                                                        className="w-2.5 h-2.5 text-blue-500"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                            <span
                                                className={`capitalize text-sm font-medium ${
                                                    form.permissions.includes(permission)
                                                        ? 'text-white'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {permission === 'read'
                                                    ? 'Đọc'
                                                    : permission === 'write'
                                                    ? 'Ghi'
                                                    : 'Xóa'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Trạng thái */}
                            <div className="w-40 flex-shrink-0">
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild disabled={mode === "view"}>
                                        <div
                                            className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                                                mode === "view"
                                                    ? 'bg-gray-50 cursor-not-allowed'
                                                    : 'cursor-pointer hover:border-blue-500'
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

export default RoleForm;
