import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter, MoreVertical, PackagePlus, Loader2, CheckCircle2, XCircle, Loader } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import OrderForm from "@/components/forms/OrderForm";
import AppPagination from "@/components/pagination/AppPagination";
import { mockOrders, OrderStatus, PaymentMethod } from "@/lib/data";

export default function OrderPage() {
    const [orders, setOrders] = useState(mockOrders);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: "view", order: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedStatus, setSelectedStatus] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 6;

    // Tính toán số lượng đơn theo trạng thái (dùng chuỗi tiếng Việt)
    const stats = {
        [OrderStatus.new]: orders.filter((o) => o.status === OrderStatus.new).length,
        [OrderStatus.processing]: orders.filter((o) => o.status === OrderStatus.processing).length,
        [OrderStatus.completed]: orders.filter((o) => o.status === OrderStatus.completed).length,
        [OrderStatus.cancelled]: orders.filter((o) => o.status === OrderStatus.cancelled).length,
    };

    // Lọc (theo từ khóa + trạng thái)
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.status.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => setCurrentPage(1), [searchTerm, selectedStatus]);

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
    const indexOfLast = currentPage * ordersPerPage;
    const indexOfFirst = indexOfLast - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);

    // Pagination handlers
    const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handlePageChange = (page) => setCurrentPage(page);

    // CRUD handlers
    const handleView = (order) => setModal({ open: true, mode: "view", order });
    const handleEdit = (order) => setModal({ open: true, mode: "edit", order });
    const handleCreate = () => setModal({ open: true, mode: "edit", order: null });
    const closeModal = () => setModal({ open: false, mode: "view", order: null });

    const handleSave = (orderData) => {
        if (orderData.id) {
            setOrders((prev) =>
                prev.map((order) => (order.id === orderData.id ? { ...order, ...orderData } : order))
            );
            
            // Cập nhật dữ liệu trong modal và chuyển về view mode
            setModal(prev => ({
                ...prev,
                mode: 'view', // Chuyển về view mode
                order: { ...orderData }
            }));
        } else {
            const newOrder = {
                ...orderData,
                id: Math.max(...orders.map((o) => o.id)) + 1,
            };
            setOrders((prev) => [...prev, newOrder]);
            closeModal();
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
            setOrders((prev) => prev.filter((order) => order.id !== id));
            closeModal();
        }
    };

    // Import/Export JSON
    const exportOrders = () => {
        const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orders.json";
        a.click();
        URL.revokeObjectURL(url);
        setMenuOpen(false);
    };

    const importOrders = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (Array.isArray(json)) {
                    setOrders(
                        json.map((item, i) => ({
                            id: item.id || Date.now() + i,
                            customerId: item.customerId || 1,
                            customerName: item.customerName || "Khách hàng",
                            orderDate: item.orderDate || new Date().toISOString().split("T")[0],
                            totalAmount: item.totalAmount || 0,
                            paymentMethod: item.paymentMethod || PaymentMethod.cash,
                            status: item.status || OrderStatus.new,
                            orderDetails: item.orderDetails || [],
                        }))
                    );
                    setMenuOpen(false);
                } else {
                    alert("File import không hợp lệ (cần mảng JSON)");
                }
            } catch (err) {
                alert("Không thể đọc file JSON: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Helpers
    const getStatusBadge = (status) => {
        const baseClass =
            "px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center inline-block";
        const statusMap = {
            [OrderStatus.new]: `${baseClass} bg-blue-100 text-blue-800`,
            [OrderStatus.processing]: `${baseClass} bg-yellow-100 text-yellow-800`,
            [OrderStatus.completed]: `${baseClass} bg-green-100 text-green-800`,
            [OrderStatus.cancelled]: `${baseClass} bg-red-100 text-red-800`,
        };
        return statusMap[status] || baseClass;
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
        }).format(amount);

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("vi-VN");

    // Click chọn trạng thái
    const handleStatusClick = (status) => {
        setSelectedStatus((prev) => (prev === status ? null : status));
    };

    return (
        <div className="p-0">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Danh sách đơn hàng ({filteredOrders.length})
            </h1>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(stats).map(([status, count]) => {
                    const iconMap = {
                        [OrderStatus.new]: PackagePlus,
                        [OrderStatus.processing]: Loader,
                        [OrderStatus.completed]: CheckCircle2,
                        [OrderStatus.cancelled]: XCircle,
                    };

                    const colorMap = {
                        [OrderStatus.new]: {
                            base: "bg-blue-50 text-blue-900 border-blue-200",
                            active: "bg-blue-600 text-white border-blue-600",
                        },
                        [OrderStatus.processing]: {
                            base: "bg-yellow-50 text-yellow-900 border-yellow-200",
                            active: "bg-yellow-500 text-white border-yellow-500",
                        },
                        [OrderStatus.completed]: {
                            base: "bg-green-50 text-green-900 border-green-200",
                            active: "bg-green-600 text-white border-green-600",
                        },
                        [OrderStatus.cancelled]: {
                            base: "bg-red-50 text-red-900 border-red-200",
                            active: "bg-red-600 text-white border-red-600",
                        },
                    };

                    const isActive = selectedStatus === status;
                    const Icon = iconMap[status];
                    const colorClass = isActive
                        ? colorMap[status].active
                        : colorMap[status].base;

                    return (
                        <div
                            key={status}
                            onClick={() => handleStatusClick(status)}
                            className={`animate-fade-in p-4 rounded-xl border shadow-sm transition cursor-pointer flex items-center gap-4 ${colorClass}
          hover:shadow-md hover:scale-105 active:scale-95 duration-200`}
                        >
                            {/* Icon bên trái */}
                            <div className="flex-shrink-0">
                                <Icon
                                    className={`w-10 h-10 ${isActive ? "text-white" : "opacity-90"
                                        }`}
                                />
                            </div>

                            {/* Tiêu đề + số lượng bên phải */}
                            <div className="flex flex-col">
                                <h3 className="font-semibold text-base capitalize leading-tight">
                                    {status}
                                </h3>
                                <p className="text-2xl font-bold leading-snug">{count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search + Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 mb-4">
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
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button variant="actionNormal" className="gap-2">
                        <Filter className="w-5 h-5" />
                        Lọc
                    </Button>

                    <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Thêm ĐH
                    </Button>

                    <div className="relative">
                        <Button variant="actionNormal" onClick={() => setMenuOpen((p) => !p)}>
                            <MoreVertical className="w-5 h-5" />
                        </Button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <button
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Nhập file JSON
                                </button>
                                <button
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
                                    onClick={exportOrders}
                                >
                                    Xuất file JSON
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/json"
                            className="hidden"
                            onChange={(e) => importOrders(e.target.files?.[0])}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                            <tr >
                                {[
                                    "Mã đơn",
                                    "Người đặt hàng",
                                    "Ngày đặt hàng",
                                    "Tổng giá trị",
                                    "Phương thức thanh toán",
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
                            {currentOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                                    onMouseEnter={() => setHoveredRow(order.id)}
                                    onMouseLeave={() => setHoveredRow(null)}

                                >
                                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                        {order.id}
                                    </td>
                                    <td className="px-6 py-4  text-sm text-gray-900">
                                        {order.customerName}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                                        {formatDate(order.orderDate)}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                                        {formatCurrency(order.totalAmount)}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                                        {order.paymentMethod}
                                    </td>
                                    <td className="px-6 py-4 text-center w-32">
                                        <span className={getStatusBadge(order.status)}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center w-36">
                                        <div
                                            className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === order.id
                                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                                    : "opacity-0 translate-y-1 pointer-events-none"
                                                }`}
                                        >
                                            <Button
                                                variant="actionRead"
                                                size="icon"
                                                onClick={() => handleView(order)}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="actionUpdate"
                                                size="icon"
                                                onClick={() => handleEdit(order)}
                                                className="h-8 w-8"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="actionDelete"
                                                size="icon"
                                                onClick={() => handleDelete(order.id)}
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

            {/* Dialog */}
            <AppDialog
                open={modal.open}
                onClose={closeModal}
                title={{
                    view: `Chi tiết đơn hàng #${modal.order?.id || ''}`,
                    edit: modal.order ? `Chỉnh sửa đơn hàng #${modal.order.id}` : 'Thêm đơn hàng mới'
                }}
                mode={modal.mode}
                FormComponent={OrderForm}
                data={modal.order}
                onSave={handleSave}
                onDelete={handleDelete}
                maxWidth="sm:max-w-5xl"
            />
        </div>
    );
}
