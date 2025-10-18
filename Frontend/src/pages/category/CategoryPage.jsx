import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import CategoryForm from "@/pages/category/components/CategoryForm";
import AppPagination from "@/components/pagination/AppPagination";
import ImportExportDropdown from "@/components/common/ImportExportDropdown";
import DropdownOptions from "@/components/common/DropdownOptions";
import { api } from "@/utils/api";

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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const categoriesPerPage = 6;

    const categoryFieldMapping = {
        name: "Tên danh mục",
        description: "Mô tả",
        status: "Trạng thái",
    };

    // Fetch all categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { ok, data } = await api.getJson("/category");
            if (!ok) throw new Error("Fetch failed");
            setCategories(data || []);
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
            setCategories([]);
        }
    };

    const filteredCategories = categories.filter(
        (category) =>
            (category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.description?.toLowerCase().includes(searchTerm.toLowerCase()))
            &&
            // apply status filter when selected
            (filterStatus ? (category.status === filterStatus) : true)
    );

    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / categoriesPerPage));
    const currentCategories = filteredCategories.slice(
        (currentPage - 1) * categoriesPerPage,
        currentPage * categoriesPerPage
    );

    const handleView = (category) => setModal({ open: true, mode: "view", category });
    const handleEdit = (category) => setModal({ open: true, mode: "edit", category });
    const handleCreate = () => setModal({ open: true, mode: "edit", category: null });
    const closeModal = () => setModal({ open: false, mode: "view", category: null });

    const handleSave = async (categoryData) => {
        console.log("Saving categoryData:", categoryData);
        try {
            let res;
            const idForUpdate = categoryData.category_id || categoryData.id;

            // Prepare payload: remove falsy id fields so backend can auto-generate
            const payloadToSend = { ...categoryData };
            if (!payloadToSend.category_id) delete payloadToSend.category_id;
            if (!payloadToSend.id) delete payloadToSend.id;

            if (idForUpdate) {
                // Update via api helper
                res = await api.putJson(`/category/${idForUpdate}`, payloadToSend);
            } else {
                // Create via api helper
                res = await api.postJson("/category", payloadToSend);
            }

            if (res.ok) {
                if (idForUpdate) {
                    // prefer returned updated item
                    const updatedItem = res.data ?? (await (async () => {
                        const r = await api.getJson(`/category/${idForUpdate}`);
                        return r.ok ? r.data : null;
                    })());

                    if (updatedItem) {
                        setCategories((prev) => {
                            const idx = prev.findIndex((c) => (c.category_id || c.id) == idForUpdate);
                            if (idx !== -1) {
                                const newArr = [...prev];
                                newArr[idx] = updatedItem;
                                return newArr;
                            }
                            return [...prev, updatedItem];
                        });
                        setModal({ open: true, mode: "view", category: updatedItem });
                    } else {
                        await fetchCategories();
                        setModal({ open: true, mode: "view", category: { ...categoryData, category_id: idForUpdate } });
                    }
                } else {
                    const created = res.data ?? null;
                    if (created) {
                        setCategories((prev) => [created, ...prev]);
                    } else {
                        await fetchCategories();
                    }
                    closeModal();
                }
            } else {
                alert("Không thể lưu danh mục!");
            }
        } catch (err) {
            console.error("Lỗi lưu danh mục:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        try {
            const { ok } = await api.deleteJson(`/category/${id}`);
            if (ok) {
                await fetchCategories();
                closeModal();
            } else {
                alert("Không thể xóa danh mục!");
            }
        } catch (err) {
            console.error("Lỗi xóa danh mục:", err);
        }
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-2 py-1 text-xs font-medium rounded-full w-[80px] text-center inline-block";
        return status === "ACTIVE"
            ? `${baseClass} text-green-800 bg-green-100`
            : `${baseClass} text-red-800 bg-red-100`;
    };



    const handleFilterChange = (value) => {
        setFilterStatus(value);
        setCurrentPage(1);
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
                                            <Button
                                                variant="actionDelete"
                                                size="icon"
                                                onClick={() => handleDelete(category.category_id)}
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
