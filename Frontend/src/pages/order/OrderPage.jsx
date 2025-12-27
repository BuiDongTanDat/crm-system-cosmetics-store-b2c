import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter, PackagePlus, Loader2, CheckCircle2, XCircle, Loader } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import OrderForm from "@/pages/order/components/OrderForm";
import AppPagination from "@/components/pagination/AppPagination";
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

import { PaymentMethod } from "@/lib/data";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/helper";
import { getOrders, createOrder, updateOrder, deleteOrder, updateOrderStatus } from "@/services/orders";
import { getCustomers } from "@/services/customers";
import { getProducts } from "@/services/products";
import DropdownOptions from '@/components/common/DropdownOptions'; // same component used in ProductPage
import { ChevronDown } from "lucide-react";
import DropdownWithSearch from '@/components/common/DropdownWithSearch';
import { Input } from "@/components/ui/input";
import PermissionGuard from "@/components/auth/PermissionGuard";

export default function OrderPage() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    // Nhãn tiếng Việt cho payment methods
    const PAYMENT_LABELS = {
        credit_card: "Thẻ tín dụng",
        paypal: "PayPal",
        bank_transfer: "Chuyển khoản",
        cash_on_delivery: "Thanh toán khi nhận hàng",
    };
    // Nhãn tiếng Việt cho statuses (Hiện trên front thôi, còn lưu về biến tiếng anh)
    const STATUS_LABELS = {
        pending: "Chờ xử lý",
        processing: "Đang xử lý",
        cancelled: "Đã hủy",
        paid: "Đã thanh toán",
        failed: "Thanh toán thất bại",
        refunded: "Đã hoàn tiền",
        shipped: "Đã giao hàng",
        completed: "Hoàn tất",
    };

    // Danh sách trạng thái đơn hàng bind từ status_labels
    const ORDER_STATUSES_LIST = Object.keys(STATUS_LABELS);

    useEffect(() => {
  let mounted = true;

  Promise.all([ getOrders(), getProducts()])
    .then(([ordersRes, productsRes]) => {
      if (!mounted) return;

      const ordersList = Array.isArray(ordersRes)
        ? ordersRes
        : ordersRes?.data || [];

      const products = productsRes?.data || productsRes || [];
      setProducts(products);

      const productMap = Object.fromEntries(
        products.map(p => [p.product_id || p.id, p])
      );

      const enrichedOrders = ordersList.map(o => ({
        ...o,
        customer_name: o.customer_name || o.customer_id, // dùng trực tiếp
        items: (o.items || []).map(it => {
          const prod = productMap[it.product_id];
          let disc = Number(it.discount ?? it.discount_percent ?? 0);
          if (disc > 1) disc = disc / 100;

          return {
            ...it,
            product_name: it.product_name || prod?.name || '',
            price: it.price_unit || prod?.price_current || 0,
            discount: disc,
          };
        }),
      }));

      setOrders(enrichedOrders);
    })
    .catch(err => {
      console.error('Load orders failed:', err);
      setOrders([]);
    });

  return () => { mounted = false; };
}, []);


    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: "view", order: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);


    // Field mapping for CSV export/import using API field names
    const orderFieldMapping = {
        order_id: 'Mã đơn',
        customer_id: 'Mã khách hàng',
        order_date: 'Ngày đặt hàng',
        total_amount: 'Tổng giá trị',
        payment_method: 'Phương thức thanh toán',
        status: 'Trạng thái'
    };


    // Filter orders 
    const filteredOrders = orders.filter((order) => {
        const customerField = (order.customer_name || order.customer_id || "").toString();
        const matchesSearch =
            customerField.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.payment_method || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.status || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.order_id || "").toString().toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
        const matchesCustomer = selectedCustomer ? (order.customer_id === selectedCustomer) : true;
        return matchesSearch && matchesStatus && matchesCustomer;
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 8;

    useEffect(() => setCurrentPage(1), [searchTerm, selectedStatus, selectedCustomer]);

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
    const handleCreate = () => setModal({ open: true, mode: "create", order: null });
    const closeModal = () => setModal({ open: false, mode: "view", order: null });
    const isOnlyStatusUpdate = (originalOrder, payload) => {
        if (!originalOrder?.order_id || !payload?.order_id) return false;

        // các field mà form có thể gửi lên
        const keys = Object.keys(payload || {});

        // Bắt buộc có status
        if (!keys.includes("status")) return false;

        // Không cho phép update items/total ở nhánh status-only
        const forbiddenKeys = ["items", "total_amount", "currency", "order_date", "payment_method", "channel", "notes", "lead_id", "customer_id"];
        if (keys.some(k => forbiddenKeys.includes(k) && payload[k] !== (originalOrder[k] ?? null))) {
            return false;
        }

        // status khác thật sự mới gọi
        const statusChanged = String(payload.status) !== String(originalOrder.status);

        // Các key còn lại (order_id, status) được phép
        const allowedKeys = new Set(["order_id", "status"]);
        const hasOtherKeys = keys.some(k => !allowedKeys.has(k));

        return statusChanged && !hasOtherKeys;
    };
    const handleSave = async (payload) => {
        const customerMap = Object.fromEntries(
            (customers || []).map(c => [c.customer_id || c.id, c.full_name || c.fullName || c.name || ""])
        );
        const productMap = Object.fromEntries(
            (products || []).map(p => [p.product_id || p.id, p])
        );

        try {
            if (payload.order_id) {
                const original = orders.find(o => String(o.order_id) === String(payload.order_id));
                if (original && isOnlyStatusUpdate(original, payload)) {
                    const res = await updateOrderStatus(payload.order_id, { status: payload.status });
                    const saved = res?.data || res || { ...original, status: payload.status };
                    // Update state tối thiểu cho bảng
                    setOrders(prev =>
                        prev.map(o =>
                            String(o.order_id) === String(payload.order_id)
                                ? { ...o, status: saved.status, _updatedAt: Date.now() }
                                : o
                        )
                    );
                    toast.success("Cập nhật trạng thái đơn hàng thành công!");
                    return;
                }
                // Update
                const res = await updateOrder(payload.order_id, payload);
                const saved = res?.data || res || payload;
                console.log("Saved order response:", saved);

                const enrichedForTable = {
                    ...saved,
                    order_id: String(saved.order_id),
                    customer_name: customerMap[saved.customer_id] || saved.customer_name || saved.customer_id,
                    items: (saved.items || []).map(it => {
                        const prod = productMap[it.product_id];
                        const qty = Number(it.quantity ?? it.qty ?? 0);
                        const unit = Number(it.unit_price ?? it.price ?? prod?.price_current ?? 0);
                        let rawDisc = it.discount ?? it.discount_percent ?? 0;
                        let disc = Number(rawDisc) || 0;
                        if (disc > 1) disc = disc / 100;
                        const original_price = Number(it.price_original ?? it.original_price ?? prod?.price_original ?? 0) || unit;
                        return {
                            order_detail_id: it.order_detail_id || it.id || `local-${Date.now()}`,
                            product_id: it.product_id || null,
                            product_name: it.product_name || prod?.name || "",
                            quantity: qty,
                            price: unit,
                            original_price,
                            discount: disc,
                            subtotal: Number(it.total_price ?? it.subtotal ?? qty * unit),
                        };
                    }),
                };

                setOrders(prev => prev.map(o =>
                    String(o.order_id) === String(enrichedForTable.order_id)
                        ? { ...enrichedForTable, _updatedAt: Date.now() } // force re-render
                        : o
                ));
                console.log("Enriched updated order:", enrichedForTable);

                toast.success('Cập nhật đơn hàng thành công!');
                return;
            }

            // Create
            const res = await createOrder(payload);
            const created = res?.data || res || payload;
            const newId =
                created.order_id ||
                created.id ||
                (typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `local-${Date.now()}`);

            const enriched = {
                ...created,
                order_id: newId,
                customer_name:
                    customerMap[created.customer_id] ||
                    created.customer_name ||
                    created.customer_id,
                items: (created.items || payload.items || []).map(it => {
                    const prod = productMap[it.product_id];
                    const qty = Number(it.quantity ?? it.qty ?? 0);
                    const unit = Number(it.unit_price ?? it.price ?? prod?.price_current ?? 0);
                    let rawDisc = it.discount ?? it.discount_percent ?? 0;
                    let disc = Number(rawDisc) || 0;
                    if (disc > 1) disc = disc / 100;
                    const original_price =
                        Number(it.price_original ?? it.original_price ?? prod?.price_original ?? 0) || unit;
                    return {
                        order_detail_id: it.order_detail_id || it.id || `local-${Date.now()}`,
                        product_id: it.product_id || null,
                        product_name: it.product_name || prod?.name || "",
                        quantity: qty,
                        price: unit,
                        original_price,
                        discount: disc,
                        subtotal: Number(it.total_price ?? it.subtotal ?? qty * unit),
                    };
                }),
            };

            setOrders(prev => [enriched, ...prev]);

            // Reset modal state to trigger table re-render
            setModal({ open: false, mode: "view", order: null });

            toast.success('Thêm đơn hàng thành công!');
        } catch (err) {
            console.error("Lỗi khi lưu đơn hàng:", err);
            toast.error('Có lỗi khi lưu đơn hàng');
        }
    };


    const handleDelete = async (id) => {
        try {
            await deleteOrder(id);
            setOrders(prev => prev.filter(o => o.order_id !== id));
            closeModal();
            toast.success('Xóa đơn hàng thành công!');
        } catch (err) {
            console.error("Lỗi khi xóa đơn hàng:", err);
            toast.error('Có lỗi khi xóa đơn hàng');
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
    };

    // Updated import handler for CSV
    const handleImportSuccess = (importedData) => {
        try {
            const processedOrders = importedData.map((item, index) => ({
                id: Math.max(...orders.map(o => o.id), 0) + index + 1,
                customerId: parseInt(item['Mã khách hàng'] || item.customerId || 1),
                customerName: item['Tên khách hàng'] || item.customerName || 'Khách hàng',
                orderDate: item['Ngày đặt hàng'] || item.orderDate || new Date().toISOString().split("T")[0],
                totalAmount: parseFloat(item['Tổng giá trị'] || item.totalAmount || 0),
                paymentMethod: item['Phương thức thanh toán'] || item.paymentMethod || PaymentMethod.cash,
                status: item['Trạng thái'] || item.status || OrderStatus.new,
                orderDetails: item.orderDetails || []
            }));

            setOrders(prev => [...prev, ...processedOrders]);
            toast.success(`Đã nhập thành công ${processedOrders.length} đơn hàng!`);
        } catch (error) {
            console.error('Lỗi xử lý dữ liệu nhập:', error);
            toast.error('Có lỗi xảy ra khi xử lý dữ liệu nhập');
        }
    };

    const handleImportError = (errorMessage) => {
        toast.error(`Lỗi nhập file: ${errorMessage}`);
    };

    // Hàm tạo màu nhãn
    const getStatusBadge = (status) => {
        const baseClass =
            "px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center inline-block";
        const statusMap = {
            paid: `${baseClass} bg-green-100 text-green-800`,
            pending: `${baseClass} bg-blue-100 text-blue-800`,
            processing: `${baseClass} bg-yellow-100 text-yellow-800`,
            completed: `${baseClass} bg-green-100 text-green-800`,
            cancelled: `${baseClass} bg-red-100 text-red-800`,
            refunded: `${baseClass} bg-indigo-100 text-indigo-800`,
            failed: `${baseClass} bg-rose-100 text-rose-800`,
            shipped: `${baseClass} bg-sky-100 text-sky-800`,
        };
        return statusMap[status] || `${baseClass} bg-gray-100 text-gray-800`;
    };


    return (
        <div className=" flex flex-col">
            {/* Sticky header*/}
            <div className=" sticky top-[70px] flex-col items-center justify-between z-20  gap-3 p-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
                <div className="flex justify-between w-full mb-2">
                    <h1 className="text-xl font-bold mb-2">
                        Danh sách đơn hàng ({filteredOrders.length})
                    </h1>
                    {/* Search + Actions Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 mb-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm đơn hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                            <PermissionGuard module="order" action="create">
                                <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Thêm Đơn hàng
                                </Button>
                            </PermissionGuard>
                            {/* Import/Export Dropdown */}
                            <ImportExportDropdown
                                data={orders}
                                filename="orders"
                                fieldMapping={orderFieldMapping}
                                onImportSuccess={handleImportSuccess}
                                onImportError={handleImportError}
                                trigger="icon"
                                variant="actionNormal"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters row */}
                <div className="flex items-center justify-between gap-3 mt-2 w-full">
                    <div /> {/* left placeholder to mirror product page layout */}
                    <div className="flex items-center gap-3">
                        {/* Status dropdown */}
                        <DropdownOptions
                            options={[
                                { value: '', label: 'Tất cả trạng thái' },
                                ...ORDER_STATUSES_LIST.map(s => ({ value: s, label: STATUS_LABELS[s] || String(s).toUpperCase() }))
                            ]}
                            value={selectedStatus || ''}
                            onChange={(val) => setSelectedStatus(val || null)}
                            width="w-48"
                            placeholder="Trạng thái"
                        />

                        {/* Customer dropdown with search (custom) */}
                        <DropdownWithSearch
                            items={[{ customer_id: '', full_name: 'Tất cả khách hàng' }, ...customers]}
                            itemKey={(c) => c.customer_id || c.id}
                            renderItem={(c) => (c.full_name || c.fullName || c.name || c.customer_id)}
                            filterFn={(c, s) => (c.full_name || c.fullName || c.name || c.customer_id || '').toString().toLowerCase().includes((s || '').toLowerCase())}
                            onSelect={(c) => { setSelectedCustomer((c?.customer_id || c?.id) === '' ? '' : (c?.customer_id || c?.id)); setCurrentPage(1); }}
                            placeholder={selectedCustomer ? (customers.find(c => (c.customer_id || c.id) === selectedCustomer)?.full_name || selectedCustomer) : 'Tất cả khách hàng'}
                            searchPlaceholder="Tìm kiếm khách hàng..."
                            contentClassName="max-h-64 overflow-y-auto"
                        >
                            <div className="w-56 flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                                <div className="text-sm truncate">
                                    {selectedCustomer ? (customers.find(c => (c.customer_id || c.id) === selectedCustomer)?.full_name || selectedCustomer) : 'Tất cả khách hàng'}
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                        </DropdownWithSearch>
                    </div>
                </div>
            </div>

            {/* Scrollable content: */}
            <div className="flex-1 p-0 mt-4">
                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="w-full">
                        <table className="w-full table-fixed">
                            <thead className="bg-gray-50">
                                <tr >
                                    {[
                                        "Người đặt hàng",
                                        "Ngày đặt hàng",
                                        "Tổng giá trị",
                                        "Phương thức thanh toán",
                                        "Trạng thái",
                                        ""
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" /* reduced vertical padding */
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentOrders.map((order) => (
                                    <tr
                                        key={order.order_id}
                                        className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                                        onMouseEnter={() => setHoveredRow(order.order_id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td className="px-4 py-2 text-sm text-gray-900"> {/* reduced padding */}
                                            {/* API returns customer_id; if customer_name exists prefer that */}
                                            {order.customer_name || order.customer_id}
                                        </td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-900"> {/* reduced padding */}
                                            {formatDateTime(order.order_date)} {/* Ensure correct timezone */}
                                        </td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-900"> {/* reduced padding */}
                                            {formatCurrency(order.total_amount || order.total || 0)}
                                        </td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-900"> {/* reduced padding */}
                                            {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                                        </td>
                                        <td className="px-4 py-2 text-center w-32"> {/* reduced padding */}
                                            <span className={getStatusBadge(order.status)}>
                                                {STATUS_LABELS[order.status] || String(order.status || "").toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center w-36"> {/* reduced padding */}
                                            <div
                                                className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === order.order_id
                                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                                    : "opacity-0 translate-y-1 pointer-events-none"
                                                    }`}
                                            >
                                                <PermissionGuard module="order" action="read">
                                                    <Button
                                                        variant="actionRead"
                                                        size="icon"
                                                        onClick={() => handleView(order)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </PermissionGuard>
                                                <PermissionGuard module="order" action="update">
                                                    <Button
                                                        variant="actionUpdate"
                                                        size="icon"
                                                        onClick={() => handleEdit(order)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </PermissionGuard>
                                                <PermissionGuard module="order" action="delete">
                                                    <ConfirmDialog
                                                        title="Xác nhận xóa"
                                                        description={<>Bạn có chắc chắn muốn xóa đơn hàng <span className="font-semibold">{order.order_id}</span>?</>}
                                                        confirmText="Xóa"
                                                        cancelText="Hủy"
                                                        onConfirm={() => handleDelete(order.order_id)}
                                                    >
                                                        <Button
                                                            variant="actionDelete"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </ConfirmDialog>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Trạng thái rỗng */}
                                {currentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">Không có Đơn hàng</td>
                                    </tr>
                                )}
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
                <PermissionGuard
                    module="order"
                    action={
                        modal.mode === "create"
                            ? "create"
                            : modal.mode === "edit"
                            ? "update"
                            : "read"
                    }
                >
                    <AppDialog
                        open={modal.open}
                        onClose={closeModal}
                        title={{
                            view: `Chi tiết đơn hàng`,
                            edit: `Chỉnh sửa đơn hàng `,
                            create: "Tạo đơn hàng mới",
                        }}
                        mode={modal.mode}
                        FormComponent={OrderForm}
                        data={modal.order}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        paymentLabels={PAYMENT_LABELS}
                        statusLabels={STATUS_LABELS}
                        maxWidth="sm:max-w-5xl"
                        setMode={(m) =>
                            setModal((prev) => {
                                if (m === "view" && prev.order == null) {
                                    // close modal when cancelling a new order form
                                    return { open: false, mode: "view", order: null };
                                }
                                return { ...prev, mode: m };
                            })
                        }
                    />
                </PermissionGuard>
            </div>
        </div>
    );
}