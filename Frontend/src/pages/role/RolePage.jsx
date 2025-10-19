import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import RoleForm from "@/pages/role/components/RoleForm";
import AppPagination from "@/components/pagination/AppPagination";
import { mockRoles } from "@/lib/data";

export default function RolePage() {
    const [roles, setRoles] = useState(mockRoles);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: 'view', role: null });
    const [hoveredRow, setHoveredRow] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rolesPerPage = 6;

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Handlers
    const handleView = (role) => {
        setModal({ open: true, mode: 'view', role });
    };

    const handleEdit = (role) => {
        setModal({ open: true, mode: 'edit', role });
    };

    const handleCreate = () => {
        setModal({ open: true, mode: 'edit', role: null });
    };

    const closeModal = () => {
        setModal({ open: false, mode: 'view', role: null });
    };

    const handleSave = (roleData) => {
        if (roleData.id) {
            // Update existing
            setRoles(prev => prev.map(role =>
                role.id === roleData.id ? { ...role, ...roleData } : role
            ));
            
            // Cập nhật dữ liệu trong modal để hiển thị thông tin mới nhất
            setModal(prev => ({
                ...prev,
                mode: 'view', // Chuyển về view mode
                role: { ...roleData }
            }));
        } else {
            // Create new
            const newRole = {
                ...roleData,
                id: Math.max(...roles.map(r => r.id)) + 1
            };
            setRoles(prev => [...prev, newRole]);
            closeModal();
        }
        console.log("Role saved:", roleData);
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa vai trò này?")) {
            setRoles(prev => prev.filter(role => role.id !== id));
            closeModal();
        }
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center";
        return status === "Active"
            ? `${baseClass} bg-green-100 text-green-800`
            : `${baseClass} bg-red-100 text-red-800`;
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
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all border-gray-200 bg-white/90 dark:bg-gray-800/90"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <Button variant="actionNormal" className="gap-2">
                            <Filter className="w-5 h-5" />
                            Lọc
                        </Button>

                        {/* Add Role */}
                        <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Thêm vai trò
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable content: table, pagination, dialog */}
            <div className="flex-1 overflow-auto p-6">
                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        "Tên vai trò",
                                        "Mô tả",
                                        "Quyền hạn",
                                        "Trạng thái",
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
                                        key={role.id}
                                        className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                                        onMouseEnter={() => setHoveredRow(role.id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{role.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900">
                                                {role.permissions.map(permission =>
                                                    permission === 'read' ? 'Đọc' :
                                                        permission === 'write' ? 'Ghi' : 'Xóa'
                                                ).join(", ")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center w-32">
                                            <span className={getStatusBadge(role.status)}>
                                                {role.status === "Active" ? "Hoạt động" : "Không hoạt động"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center w-36">
                                            <div
                                                className={`flex justify-center gap-1 transition-all duration-200 ${
                                                    hoveredRow === role.id
                                                        ? "opacity-100 translate-y-0 pointer-events-auto"
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
                                                <Button
                                                    variant="actionDelete"
                                                    size="icon"
                                                    onClick={() => handleDelete(role.id)}
                                                    className="h-8 w-8"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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
                        view: `Chi tiết vai trò - ${modal.role?.name || ''}`,
                        edit: modal.role ? `Chỉnh sửa vai trò - ${modal.role.name}` : 'Thêm vai trò mới'
                    }}
                    mode={modal.mode}
                    FormComponent={RoleForm}
                    data={modal.role}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    maxWidth="sm:max-w-2xl"
                />
            </div>
        </div>
    );
}
