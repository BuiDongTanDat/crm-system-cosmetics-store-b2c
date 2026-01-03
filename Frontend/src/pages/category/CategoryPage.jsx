import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import CategoryForm from "@/pages/category/components/CategoryForm";
import AppPagination from "@/components/pagination/AppPagination";
import DropdownOptions from "@/components/common/DropdownOptions";
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from "@/services/categories";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import PermissionGuard from "@/components/auth/PermissionGuard";

export default function CategoryPage() {
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: "view", category: null });

    // hovered row for action buttons (like ProductPage)
    const [hoveredRow, setHoveredRow] = useState(null);

    // Filtering
    const [filterStatus, setFilterStatus] = useState("");
    const FILTER_OPTIONS = [
        { value: "", label: "Trạng thái" },
        { value: "ACTIVE", label: "ACTIVE" },
        { value: "INACTIVE", label: "INACTIVE" },
    ];
    const filteredCategories = categories.filter(
        (category) =>
            (category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.description?.toLowerCase().includes(searchTerm.toLowerCase()))
            &&
            // apply status filter when selected
            (filterStatus ? (category.status === filterStatus) : true)
    );
    const handleFilterChange = (value) => {
        setFilterStatus(value);
        setCurrentPage(1);
    };



    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const categoriesPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / categoriesPerPage));
    const currentCategories = filteredCategories.slice(
        (currentPage - 1) * categoriesPerPage,
        currentPage * categoriesPerPage
    );



    // Fetch all categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const result = await getCategories();
            if (result && result.ok) {
                setCategories(result.data || []);
            } else {
                console.log("Lỗi tải danh mục:", result.error);
                setCategories([]);
            }

        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
            setCategories([]);
        }
    };


    const handleView = (category) => setModal({ open: true, mode: "view", category });
    const handleEdit = (category) => setModal({ open: true, mode: "edit", category });
    const handleCreate = () => setModal({ open: true, mode: "create", category: null });
    const closeModal = () => setModal({ open: false, mode: "view", category: null });
    const handleSave = async (categoryData) => {
        console.log("Saving categoryData:", categoryData);
        try {
            const idForUpdate = categoryData.category_id || categoryData.id;
            const payloadToSend = { ...categoryData };
            if (!payloadToSend.category_id) delete payloadToSend.category_id;
            if (!payloadToSend.id) delete payloadToSend.id;

            let savedItem;

            if (idForUpdate) {
                const updateRes = await updateCategory(idForUpdate, payloadToSend);

                // Kiểm tra nếu lỗi
                if (!updateRes || !updateRes.ok) {
                    return { success: false, message: updateRes?.error?.message || "Lỗi cập nhật" };
                }

                savedItem = updateRes.data;

                // Cập nhật state và giữ modal mở ở chế độ "view"
                setCategories((prev) => {
                    const idx = prev.findIndex((c) => (c.category_id || c.id) == idForUpdate);
                    if (idx !== -1) {
                        const newArr = [...prev];
                        newArr[idx] = savedItem;
                        return newArr;
                    }
                    return [...prev, savedItem];
                });
                setModal({ open: true, mode: "view", category: savedItem });
                toast.success("Cập nhật danh mục thành công!");
                return { success: true, data: savedItem };
            } else {
                const createRes = await createCategory(payloadToSend);
                // Kiểm tra nếu lỗi
                if (!createRes && !createRes.ok) {
                    return { success: false, message: createRes?.error?.message || "Lỗi tạo danh mục mới" };
                }

                savedItem = createRes.data;

                // Cập nhật state để thêm mục mới nhưng KHÔNG đóng modal ở đây; trả về success cho form
                setCategories((prev) => [savedItem, ...prev]);
                toast.success("Thêm danh mục thành công.");
                return { success: true, data: savedItem };
            }
        } catch (err) {
            const msg = err?.message || "Không thể lưu danh mục!";
            toast.error(String(msg));
            console.error("Lỗi lưu danh mục:", err);
            return { success: false, message: String(msg) };
        }
    };
    const handleDelete = async (id) => {
        try {
            await deleteCategory(id);
            await fetchCategories();
            closeModal();
            toast.error("Xóa danh mục thành công!");
        } catch (err) {
            const msg = err?.message || "Không thể xóa danh mục!";
            toast.error(String(msg));
            console.error("Lỗi xóa danh mục:", err);
        }
    };



    const getStatusBadge = (status) => {
        const baseClass = "px-2 py-1 text-xs font-medium rounded-full w-[80px] text-center inline-block";
        return status === "ACTIVE"
            ? `${baseClass} text-green-800 bg-green-100`
            : `${baseClass} text-red-800 bg-red-100`;
    };

    return (
        <div className="flex flex-col">
            {/* Sticky header */}
            <div
                className="border  z-20 flex flex-col gap-3 p-3 bg-brand/10 backdrop-blur-lg rounded-md my-3 md:flex-row md:justify-between md:items-center"
                style={{ backdropFilter: 'blur' }}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                    <h1 className="text-lg font-bold text-gray-900 md:text-xl">
                        Quản lý Danh mục ({filteredCategories.length})
                    </h1>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    {/* Search */}
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-2 w-full md:w-56"
                        />
                    </div>

                    {/* Filter dropdown */}
                    <div className="flex items-center w-full md:w-auto">
                        <DropdownOptions
                            options={FILTER_OPTIONS}
                            value={filterStatus}
                            onChange={handleFilterChange}
                            width="w-full md:w-36"
                            placeholder="Trạng thái"
                        />
                    </div>

                    {/* Thêm Danh mục chỉ khi có quyền create */}
                    <PermissionGuard module="category" action="create">
                        <Button
                            onClick={handleCreate}
                            variant="actionCreate"
                            className="gap-2 w-full md:w-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="">Thêm Danh mục</span>
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md border overflow-hidden shadow mb-4">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50">
                            <tr>
                                {["Tên danh mục", "Mô tả", "Trạng thái", ""].map((header, index) => (
                                    <th
                                        key={index}
                                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentCategories.map((category, index) => (
                                <tr
                                    key={`${category.category_id || category.id || 'cat'}-${index}`}
                                    onMouseEnter={() => setHoveredRow(category.category_id || category.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-2 text-sm font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-2 text-sm text-gray-900">{category.description}</td>
                                    <td className="px-6 py-2 text-center">
                                        <span className={getStatusBadge(category.status)}>{category.status}</span>
                                    </td>
                                    <td className="px-6 py-2 text-center w-36">
                                        <div className={`flex justify-center transition-all duration-200 gap-1 ${hoveredRow === (category.category_id || category.id) ? 'opacity-100 translate-y-0 duration-200' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
                                            {/* Xem chi tiết chỉ khi có quyền read */}
                                            <PermissionGuard module="category" action="read">
                                                <Button
                                                    variant="actionRead"
                                                    size="icon"
                                                    onClick={() => handleView(category)}
                                                    className="h-8 w-8"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </PermissionGuard>
                                            {/* Chỉnh sửa chỉ khi có quyền update */}
                                            <PermissionGuard module="category" action="update">
                                                <Button
                                                    variant="actionUpdate"
                                                    size="icon"
                                                    onClick={() => handleEdit(category)}
                                                    className="h-8 w-8"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </PermissionGuard>
                                            {/* Xóa chỉ khi có quyền delete */}
                                            {/* <PermissionGuard module="category" action="delete">
                                                <ConfirmDialog
                                                    title="Xác nhận xóa"
                                                    description={
                                                        <>
                                                            Bạn có chắc chắn muốn xóa danh mục{" "}
                                                            <span className="font-semibold text-black">{category.name}</span>?
                                                        </>
                                                    }
                                                    confirmText="Xóa"
                                                    cancelText="Hủy"
                                                    onConfirm={() => handleDelete(category.category_id)}
                                                >
                                                    <Button
                                                        variant="actionDelete"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </ConfirmDialog>
                                            </PermissionGuard> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Trạng thái rỗng */}
                            {currentCategories.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">Không có Danh mục</td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>
            </div>

            <AppPagination
                totalPages={totalPages}
                currentPage={currentPage}
                handlePageChange={setCurrentPage}
                handleNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                handlePrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            />

            {/* AppDialog chỉ cho phép tạo, sửa, xóa nếu có quyền tương ứng */}
            <PermissionGuard module="category" action={modal.mode === "create" ? "create" : modal.mode === "edit" ? "update" : "read"}>
                <AppDialog
                    open={modal.open}
                    onClose={closeModal}
                    title={{
                        view: `Chi tiết danh mục`,
                        edit: modal.category
                            ? `Chỉnh sửa danh mục`
                            : "Thêm danh mục mới",
                        create: "Thêm danh mục mới",
                    }}
                    mode={modal.mode}
                    FormComponent={CategoryForm}
                    data={modal.category}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    maxWidth="sm:max-w-xl"
                />
            </PermissionGuard>
        </div>
    );
}
