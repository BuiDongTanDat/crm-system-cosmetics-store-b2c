import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import RoleForm from "@/pages/role/components/RoleForm";
import AppPagination from "@/components/pagination/AppPagination";
// import { mockRoles } from "@/lib/data"; // Xóa dòng này
import {
    getRoles,
    getRoleByName,
    createRole,
    updateRole,
    deleteRole
} from "@/services/roles"; // Thêm dòng này
import { formatDate, formatDateTime } from "@/utils/helper";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Danh sách phân quyền cho role
const PERMISSIONS_LIST = [
    { group: "auth", label: "Xác thực", permissions: ["auth.login", "auth.logout"] },
    { group: "user", label: "Người dùng", permissions: ["user.read", "user.write", "user.delete"] },
    { group: "customer", label: "Khách hàng", permissions: ["customer.read", "customer.write", "customer.delete"] },
    { group: "role", label: "Vai trò", permissions: ["role.read", "role.write", "role.delete"] },
    { group: "lead", label: "Lead", permissions: ["lead.read", "lead.write", "lead.delete", "lead.import", "lead.scoring.view", "lead.convert"] },
    { group: "campaign", label: "Chiến dịch", permissions: ["campaign.read", "campaign.write", "campaign.delete", "campaign.automation.setup", "campaign.ai.suggestion", "campaign.roi.view"] },
    { group: "order", label: "Đơn hàng", permissions: ["order.read", "order.write", "order.delete", "order.status.view"] },
    { group: "product", label: "Sản phẩm", permissions: ["product.read", "product.write", "product.delete", "product.import"] },
    { group: "analytics", label: "Phân tích", permissions: ["customer.behavior.view", "dashboard.realtime.view", "report.view", "revenue.forecast.view"] },
    { group: "data", label: "Dữ liệu", permissions: ["data.export", "data.import"] }
];

export default function RolePage() {
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: 'view', role: null });
    const [hoveredRow, setHoveredRow] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rolesPerPage = 8;

    const filteredRoles = roles.filter(role =>
        (role.role_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (role.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    useEffect(() => setCurrentPage(1), [searchTerm]);
    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / rolesPerPage));
    const indexOfLast = currentPage * rolesPerPage;
    const indexOfFirst = indexOfLast - rolesPerPage;
    const currentRoles = filteredRoles.slice(indexOfFirst, indexOfLast);

    // Pagination handlers
    const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handlePageChange = (page) => setCurrentPage(page);

    // Fetch roles từ API
    const fetchRoles = async () => {
        try {
            const res = await getRoles();
            let data = Array.isArray(res) ? res : res?.data;
            if (!data) data = [];
            setRoles(data);
        } catch (err) {
            console.error("Lỗi tải danh sách vai trò:", err);
            const msg = err?.response?.data?.error || err?.message || "Không thể tải danh sách vai trò.";
            toast.error(msg);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Handlers
    const handleView = async (role) => {
        setModal({ open: true, mode: 'view', role });
    };

    const handleEdit = (role) => {
        setModal({ open: true, mode: 'edit', role });
    };

    const handleCreate = () => {
        setModal({ open: true, mode: 'create', role: null });
    };

    const closeModal = () => {
        setModal({ open: false, mode: 'view', role: null });
    };

    const handleSave = async (roleData) => {
        try {
            let savedItem;

            if (roleData.mode === "edit" && modal.role?.role_name) {
                // Cập nhật
                await updateRole(modal.role.role_name, roleData);
                savedItem = await getRoleByName(modal.role.role_name);

                if (savedItem) {
                    setRoles((prev) =>
                        prev.map((r) =>
                            r.role_name === modal.role.role_name ? savedItem : r
                        )
                    );
                    toast.success("Cập nhật vai trò thành công!");
                    setModal({ open: true, mode: "view", role: savedItem });
                } else {
                    await fetchRoles();
                    setModal({ open: true, mode: "view", role: roleData });
                }

            } else if (roleData.mode === "create") {
                // Tạo mới
                savedItem = await createRole(roleData);
                if (savedItem && savedItem.role_name) {
                    setRoles((prev) => [savedItem, ...prev]);
                    toast.success("Thêm vai trò thành công.");
                    closeModal();
                } else {
                    await fetchRoles();
                    closeModal();
                }
            } else {
                console.warn("Không xác định được mode khi lưu vai trò:", roleData);
            }

        } catch (err) {
            console.error("Lỗi lưu vai trò:", err);
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Đã xảy ra lỗi không xác định.";
            toast.error(msg);
        }
    };


    const handleDelete = async (role_name) => {
        try {
            await deleteRole(role_name);
            setRoles((prev) => prev.filter(r => r.role_name !== role_name));
            closeModal();
            toast.success("Xóa vai trò thành công!");
        } catch (err) {
            console.error("Lỗi xóa vai trò:", err);
            const msg = err?.response?.data?.error || err?.message || "Lỗi khi xóa vai trò!";
            toast.error(msg);
        }
    };

    return (
        <div className=" flex flex-col">
            {/* Sticky header */}
            <div
                className="sticky top-[70px] z-20 flex  gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md "
                style={{ backdropFilter: 'blur' }}
            >
                <div className="flex justify-between w-full">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">
                            Quản lý Vai trò ({filteredRoles.length})
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm vai trò..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>


                        {/* Add Role */}
                        <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Thêm vai trò
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable content: table, pagination, dialog */}
            <div className="flex-1  pt-4">
                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        "Tên vai trò",
                                        "Quyền hạn",
                                        "Ngày tạo",
                                        "Cập nhật lần cuối",
                                        ""
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentRoles.map((role) => (
                                    <tr
                                        key={role.role_name}
                                        className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                                        onMouseEnter={() => setHoveredRow(role.role_name)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td className="px-6 2 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{role.role_name}</div>
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-start">
                                            <div className="text-sm text-gray-900">
                                                {role.permissions && role.permissions.length > 0
                                                    ? (() => {
                                                        const maxShow = 5;
                                                        const perms = role.permissions.slice(0, maxShow);
                                                        return perms.join(", ") + (role.permissions.length > maxShow ? ", ..." : "");
                                                    })()
                                                    : <span className="text-gray-400 italic">Không có quyền</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-2 text-center whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(role.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-2 text-center whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDateTime(role.updated_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-2 text-center w-36">
                                            <div
                                                className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === role.role_name
                                                    ? "opacity-100 translate-y-0 pointer-events-auto "
                                                    : "opacity-0 translate-y-1 pointer-events-none"
                                                    }`}
                                            >
                                                <Button
                                                    variant="actionRead"
                                                    size="icon"
                                                    onClick={() => handleView(role)}
                                                    className="h-8 w-8"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="actionUpdate"
                                                    size="icon"
                                                    onClick={() => handleEdit(role)}
                                                    className="h-8 w-8"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>

                                                {/* Dùng ConfirmDialog cho hành động xóa */}
                                                <ConfirmDialog
                                                    title="Xác nhận xóa"
                                                    description={
                                                        <>
                                                            Bạn có chắc chắn muốn xóa vai trò{" "}
                                                            <span className="font-semibold text-black">{role.role_name}</span>?
                                                        </>
                                                    }
                                                    confirmText="Xóa"
                                                    cancelText="Hủy"
                                                    onConfirm={() => handleDelete(role.role_name)}
                                                >
                                                    <Button
                                                        variant="actionDelete"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </ConfirmDialog>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <AppPagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    handlePageChange={handlePageChange}
                    handleNext={handleNext}
                    handlePrev={handlePrev}
                />

                {/* Role Dialog */}
                <AppDialog
                    open={modal.open}
                    onClose={closeModal}
                    title={{
                        view: `Chi tiết vai trò - ${modal.role?.role_name || ''}`,
                        edit: modal.role ? `Chỉnh sửa vai trò - ${modal.role.role_name}` : 'Thêm vai trò mới',
                        create: 'Thêm vai trò mới' //Này thêm chế độ create tại có phân biết với edit trong việc được nhập role name hay không
                    }}
                    mode={modal.mode}
                    FormComponent={RoleForm}
                    data={modal.role}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    maxWidth="sm:max-w-2xl"
                    permissionsList={PERMISSIONS_LIST}
                    onCancel={closeModal}
                />
            </div>
        </div>
    );
}
