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

export default function CategoryPage() {
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: "view", category: null });

    // Filtering
    const [filterStatus, setFilterStatus] = useState("");
    const FILTER_OPTIONS = [
        { value: "", label: "Tất cả" },
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
    const categoriesPerPage = 6;
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
            const data = await getCategories();
            setCategories(data || []);
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
            setCategories([]);
        }
    };


    const handleView = (category) => setModal({ open: true, mode: "view", category });
    const handleEdit = (category) => setModal({ open: true, mode: "edit", category });
    const handleCreate = () => setModal({ open: true, mode: "edit", category: null });
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
                await updateCategory(idForUpdate, payloadToSend);
                savedItem = await getCategory(idForUpdate);
            } else {
                savedItem = await createCategory(payloadToSend);
            }

            if (savedItem) {
                if (idForUpdate) {
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
                } else {
                    setCategories((prev) => [savedItem, ...prev]);
                    closeModal();
                    toast.success( "Thêm danh mục thành công.");
                }
            } else {
                await fetchCategories();
                closeModal();
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || err?.message || "Không thể lưu danh mục!";
            toast.error(String(msg));
            console.error("Lỗi lưu danh mục:", err);
        }
    };
    const handleDelete = async (id) => {
        try {
            await deleteCategory(id);
            await fetchCategories();
            closeModal();
            toast.error("Xóa danh mục thành công!");
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || err?.message || "Không thể xóa danh mục!";
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
        <div className=" flex flex-col">
            {/* Sticky header */}
            <div
                className="sticky top-[70px] z-20 flex justify-between gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-7"
                style={{ backdropFilter: 'blur' }}
            >
                {/* Header */}
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">
                        Quản lý Khách hàng ({filteredCategories.length})
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all border-gray-200 bg-white/90 dark:bg-gray-800/90"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter dropdown */}
                    <div className="flex items-center">
                        <DropdownOptions
                            options={FILTER_OPTIONS}
                            value={filterStatus}
                            onChange={handleFilterChange}
                            width="w-36"
                            placeholder="Trạng thái"
                        />
                    </div>

                    <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Thêm Danh mục
                    </Button>


                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
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
                                    className="group hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{category.description}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={getStatusBadge(category.status)}>{category.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center w-36">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transform group-hover:-translate-y-1 transition-all duration-200">
                                            <Button
                                                variant="actionRead"
                                                size="icon"
                                                onClick={() => handleView(category)}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="actionUpdate"
                                                size="icon"
                                                onClick={() => handleEdit(category)}
                                                className="h-8 w-8"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            {/* <ConfirmDialog
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

                                            </ConfirmDialog> */}

                                        </div>
                                    </td>
                                </tr>
                            ))}
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

            <AppDialog
                open={modal.open}
                onClose={closeModal}
                title={{
                    view: `Chi tiết danh mục - ${modal.category?.name || ""}`,
                    edit: modal.category
                        ? `Chỉnh sửa danh mục - ${modal.category.name}`
                        : "Thêm danh mục mới",
                }}
                mode={modal.mode}
                FormComponent={CategoryForm}
                data={modal.category}
                onSave={handleSave}
                onDelete={handleDelete}
                maxWidth="sm:max-w-xl"
            />

        </div>
    );
}
