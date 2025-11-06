import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter, History } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import CustomerForm from "@/pages/customer/components/CustomerForm";
import AppPagination from "@/components/pagination/AppPagination";
import ImportExportDropdown from "@/components/common/ImportExportDropdown";
import { CustomerTypes, CustomerSources } from "@/lib/data";
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

// Import API client (chỉnh path cho đúng dự án của bạn)
import { getCustomers } from "@/services/customers";
import { Input } from "@/components/ui/input";
// hoặc: import { getCustomers } from "@/utils/api/customers";

export default function CustomerListPage() {
    // TỪ: const [customers, setCustomers] = useState(mockCustomers);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: 'view', customer: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const fileInputRef = useRef(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const customersPerPage = 8;

    // Map dữ liệu từ API -> UI
    const mapApiToUi = (item) => ({
        id: item.customer_id,                             // "5b7c9cb4-..."
        name: item.full_name ?? '—',                      // "Lead Mẫu 5"
        type: item.customer_type ?? CustomerTypes.standard,
        birthDate: item.birth_date ?? '',
        gender: item.gender ?? '',
        industry: item.industry ?? '',                    // backend có thể chưa trả => fallback ''
        email: item.email ?? '',
        phone: item.phone ?? '',
        address: item.address ?? '',
        socialMedia: item.social_channels ?? {},          // {}
        source: item.source ?? CustomerSources.website,   // "order_checkout"
        notes: item.notes ?? '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        status: item.status ?? 'Active',                  // nếu API chưa có, mặc định Active
    });

    // 🚀 Gọi API lấy danh sách
    useEffect(() => {
        let ignore = false;
        async function fetchCustomers() {
            try {
                setLoading(true);
                setLoadError("");
                const res = await getCustomers(); // kỳ vọng { ok, data, error }
                if (!ignore) {
                    if (res?.ok) {
                        const list = Array.isArray(res.data) ? res.data.map(mapApiToUi) : [];
                        setCustomers(list);
                    } else {
                        setLoadError(res?.error || "Không thể tải danh sách khách hàng");
                        toast.error(res?.error || "Không thể tải danh sách khách hàng");
                    }
                }
            } catch (e) {
                if (!ignore) {
                    setLoadError("Lỗi kết nối máy chủ");
                    toast.error("Lỗi kết nối máy chủ");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        fetchCustomers();
        return () => { ignore = true; };
    }, []);

    const safeIncludes = (val) => (val || "").toLowerCase().includes(searchTerm.toLowerCase());

    const filteredCustomers = customers.filter((customer) =>
        safeIncludes(customer.name) ||
        safeIncludes(customer.email) ||
        safeIncludes(customer.type) ||
        safeIncludes(customer.industry)
    );

    // Pagination calculations
    useEffect(() => setCurrentPage(1), [searchTerm]);
    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / customersPerPage));
    const indexOfLast = currentPage * customersPerPage;
    const indexOfFirst = indexOfLast - customersPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirst, indexOfLast);

    // Pagination handlers
    const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handlePageChange = (page) => setCurrentPage(page);

    // Handlers
    const handleView = (customer) => setModal({ open: true, mode: 'view', customer });
    const handleEdit = (customer) => setModal({ open: true, mode: 'edit', customer });
    const handleCreate = () => setModal({ open: true, mode: 'edit', customer: null });
    const closeModal = () => setModal({ open: false, mode: 'view', customer: null, showHistory: false });

    const handleViewHistory = (customer) => setModal({ open: true, mode: 'view', customer, showHistory: true });
    const handleBackFromHistory = () => setModal(prev => ({ ...prev, showHistory: false }));

    // (Giữ nguyên logic create/update local; nếu muốn nối API create/update, mình có thể bổ sung sau)
    const handleSave = (customerData) => {
        if (customerData.id) {
            setCustomers(prev =>
                prev.map(customer =>
                    customer.id === customerData.id ? { ...customer, ...customerData } : customer
                )
            );
            setModal(prev => ({ ...prev, mode: 'view', customer: { ...customerData } }));
            toast.success('Cập nhật khách hàng thành công!');
        } else {
            const newCustomer = {
                ...customerData,
                id: crypto.randomUUID?.() ?? String(Date.now())
            };
            setCustomers(prev => [...prev, newCustomer]);
            closeModal();
            toast.success('Thêm khách hàng thành công!');
        }
    };

    const handleImportSuccess = (importedData) => {
        try {
            const nextBaseId = customers.length;
            const processedCustomers = importedData.map((item, index) => ({
                id: item.customer_id || item.id || `${nextBaseId + index + 1}`,
                name: item['Tên khách hàng'] || item.name || item.full_name || 'Untitled',
                type: item['Loại khách hàng'] || item.type || CustomerTypes.standard,
                birthDate: item['Ngày sinh'] || item.birthDate || '',
                gender: item['Giới tính'] || item.gender || 'Nam',
                industry: item['Ngành nghề'] || item.industry || 'Công nghệ thông tin',
                email: item['Email'] || item.email || '',
                phone: item['Số điện thoại'] || item.phone || '',
                address: item['Địa chỉ'] || item.address || '',
                socialMedia: item['Mạng xã hội'] || item.socialMedia || '',
                source: item['Nguồn khách hàng'] || item.source || CustomerSources.website,
                notes: item['Ghi chú'] || item.notes || '',
                tags: item.tags || [],
                status: item['Trạng thái'] || item.status || 'Active'
            }));

            setCustomers(prev => [...prev, ...processedCustomers]);
            toast.success(`Đã nhập thành công ${processedCustomers.length} khách hàng!`);
        } catch (error) {
            console.error('Lỗi xử lý dữ liệu nhập:', error);
            toast.error('Có lỗi xảy ra khi xử lý dữ liệu nhập');
        }
    };

    const handleImportError = (errorMessage) => {
        toast.error(`Lỗi nhập file: ${errorMessage}`);
    };

    const handleDelete = (id) => {
        setCustomers(prev => prev.filter(customer => customer.id !== id));
        closeModal();
        toast.success('Xóa khách hàng thành công!');
    };

    // Mapping các attribute cho CSV export/import
    const customerFieldMapping = {
        name: 'Tên khách hàng',
        type: 'Loại khách hàng',
        birthDate: 'Ngày sinh',
        gender: 'Giới tính',
        industry: 'Ngành nghề',
        email: 'Email',
        phone: 'Số điện thoại',
        address: 'Địa chỉ',
        socialMedia: 'Mạng xã hội',
        source: 'Nguồn khách hàng',
        notes: 'Ghi chú',
        status: 'Trạng thái'
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-2 py-1 rounded-sm text-xs font-medium w-[100px] text-center inline-block";
        return status === "Active"
            ? `${baseClass} bg-green-100 text-green-800`
            : `${baseClass} bg-red-100 text-red-800`;
    };

    const getTypeBadge = (type) => {
        const baseClass = "p-1 border rounded-sm text-[10px] font-medium w-[100px] text-center inline-block";
        const colorMap = {
            [CustomerTypes.vip]: "bg-purple-100 text-purple-800 border-purple-200",
            [CustomerTypes.premium]: "bg-blue-100 text-blue-800 border-blue-200",
            [CustomerTypes.standard]: "bg-gray-100 text-gray-800 border-gray-200",
            [CustomerTypes.new]: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
        return `${baseClass} ${colorMap[type] || colorMap[CustomerTypes.standard]}`;
    };

    const handleShowHistoryChange = (showHistory) => {
        setModal(prev => ({ ...prev, showHistory }));
    };

    return (
        <div className="flex flex-col">
            {/* Sticky header */}
            <div
                className="sticky top-[70px] z-20 flex gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md "
                style={{ backdropFilter: 'blur' }}
            >
                <div className="flex justify-between w-full">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">
                            {loading ? "Đang tải khách hàng..." : `Quản lý Khách hàng (${filteredCustomers.length})`}
                        </h1>
                        {loadError && <span className="text-sm text-red-600"> • {loadError}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm khách hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <Button variant="actionNormal" className="gap-2">
                            <Filter className="w-5 h-5" />
                            Lọc
                        </Button>

                        {/* Add Customer */}
                        <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Thêm KH
                        </Button>

                        {/* Import/Export Dropdown */}
                        <ImportExportDropdown
                            data={customers}
                            filename="customers"
                            fieldMapping={customerFieldMapping}
                            onImportSuccess={handleImportSuccess}
                            onImportError={handleImportError}
                            trigger="icon"
                            variant="actionNormal"
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable content: table, pagination, dialog */}
            <div className="flex-1 pt-4 ">
                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Khách hàng", "Email", "SĐT", "Ngành nghề", "Nguồn KH", "Trạng thái", ""].map((header) => (
                                        <th key={header} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                                        onMouseEnter={() => setHoveredRow(customer.id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td className="px-6 py-2 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                            
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{customer.email || '—'}</div>
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900">{customer.phone || '—'}</div>
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900">{customer.industry || '—'}</div>
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900">{customer.source || '—'}</div>
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-center w-32">
                                            <span className={getTypeBadge(customer.type)}>{customer.type}</span>
                                        </td>
                                        <td className="px-6 py-2 text-center w-36">
                                            <div
                                                className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === customer.id
                                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                                    : "opacity-0 translate-y-1 pointer-events-none"
                                                    }`}
                                            >
                                                <Button
                                                    variant="actionRead"
                                                    size="icon"
                                                    onClick={() => handleViewHistory(customer)}
                                                    className="h-8 w-8"
                                                >
                                                    <History className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="actionRead"
                                                    size="icon"
                                                    onClick={() => handleView(customer)}
                                                    className="h-8 w-8"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="actionUpdate"
                                                    size="icon"
                                                    onClick={() => handleEdit(customer)}
                                                    className="h-8 w-8"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <ConfirmDialog
                                                    title="Xác nhận xóa"
                                                    description={
                                                        <>
                                                            Bạn có chắc chắn muốn xóa khách hàng{" "}
                                                            <span className="font-semibold text-black">{customer.name}</span>?
                                                        </>
                                                    }
                                                    confirmText="Xóa"
                                                    cancelText="Hủy"
                                                    onConfirm={() => handleDelete(customer.id)}
                                                >
                                                    <Button variant="actionDelete" size="icon" className="h-8 w-8">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </ConfirmDialog>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* Trạng thái rỗng */}
                                {!loading && !loadError && currentCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500">Không có khách hàng</td>
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

                {/* Customer Dialog */}
                <AppDialog
                    open={modal.open}
                    onClose={closeModal}
                    title={{
                        view: 'Chi tiết khách hàng',
                        edit: modal.customer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'
                    }}
                    mode={modal.mode}
                    FormComponent={CustomerForm}
                    data={modal.customer}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    showHistory={modal.showHistory}
                    onBackFromHistory={handleBackFromHistory}
                    onShowHistoryChange={handleShowHistoryChange}
                    maxWidth="sm:max-w-4xl"
                />
            </div>
        </div>
    );
}
