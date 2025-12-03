import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter, History } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import CustomerForm from "@/pages/customer/components/CustomerForm";
import AppPagination from "@/components/pagination/AppPagination";
import { CustomerTypes, CustomerSources } from "@/lib/data";
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/services/customers";
import { Input } from "@/components/ui/input";
import DropdownOptions from "@/components/common/DropdownOptions"; // <-- added

export default function CustomerListPage() {

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState(""); // <-- new: customer type filter
    const [modal, setModal] = useState({ open: false, mode: 'view', customer: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const fileInputRef = useRef(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const customersPerPage = 8;

    // Map dữ liệu từ API -> UI
    const mapApiToUi = (item) => {
        // Helper to map API customer_type -> UI constant
        const mapType = (t) => {
            if (!t) return CustomerTypes.standard;
            const up = String(t).toUpperCase();
            if (up.includes('VIP')) return CustomerTypes.vip;
            if (up.includes('PREMIUM')) return CustomerTypes.premium;
            if (up.includes('NEW')) return CustomerTypes.new;
            return CustomerTypes.standard;
        };

        // Map API gender keys to standardized API-like values we use in the form: 'male'|'female'|'other'
        const mapGender = (g) => {
            if (!g) return 'other';
            const low = String(g).toLowerCase();
            if (low === 'male' || low === 'm' || low === 'nam') return 'male';
            if (low === 'female' || low === 'f' || low === 'nữ' || low === 'nu') return 'female';
            return 'other';
        };

        // Social channels: object -> readable string (key:value, ...)
        const socialToString = (s) => {
            if (!s) return '';
            if (typeof s === 'string') return s;
            if (typeof s === 'object') {
                return Object.entries(s).map(([k, v]) => `${k}:${v}`).join(', ');
            }
            return String(s);
        };

        // Normalize birth_date to YYYY-MM-DD for <input type="date">
        const toDateInput = (d) => {
            if (!d) return '';
            try {
                return d.split('T')[0];
            } catch (e) {
                return '';
            }
        };

        return {
            id: item.customer_id,
            name: item.full_name ?? '—',
            type: mapType(item.customer_type),
            birthDate: toDateInput(item.birth_date),
            gender: mapGender(item.gender),
            email: item.email ?? '',
            phone: item.phone ?? '',
            address: item.address ?? '',
            socialMedia: socialToString(item.social_channels ?? {}),
            source: item.source ?? CustomerSources.website,
            notes: item.notes ?? '',
            tags: Array.isArray(item.tags) ? item.tags : [],
            status: item.status ?? 'Active',
        };
    };

    // Gọi API lấy danh sách
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

    // Customer type options for dropdown (includes empty = all)
    const CUSTOMER_TYPE_OPTIONS = [
        { value: "", label: "Tất cả KH" },
        ...Object.values(CustomerTypes).map((t) => ({ value: t, label: t })),
    ];

    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch =
            safeIncludes(customer.name) ||
            safeIncludes(customer.email) ||
            safeIncludes(customer.type);
        const matchesType = filterType ? customer.type === filterType : true;
        return matchesSearch && matchesType;
    });

    // Pagination calculations
    // Reset page when search or type filter changes
    useEffect(() => setCurrentPage(1), [searchTerm, filterType]);
    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / customersPerPage));
    const indexOfLast = currentPage * customersPerPage;
    const indexOfFirst = indexOfLast - customersPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirst, indexOfLast);

    // Pagination handlers
    const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handlePageChange = (page) => setCurrentPage(page);

    // Convert UI form object -> API payload
    const uiToApiPayload = (c) => {
        // Map UI CustomerTypes values
        const uiTypeToApi = (t) => {
            if (!t) return 'NORMAL';
            const map = {
                [CustomerTypes.vip]: 'VIP',
                [CustomerTypes.premium]: 'PREMIUM',
                [CustomerTypes.new]: 'NEW',
                [CustomerTypes.standard]: 'NORMAL',
            };
            // Prefer direct mapping; fallback to heuristic uppercase check for unknown values
            if (map[t]) return map[t];
            const up = String(t).toUpperCase();
            if (up.includes('VIP')) return 'VIP';
            if (up.includes('PREMIUM')) return 'PREMIUM';
            if (up.includes('NEW')) return 'NEW';
            if (up.includes('TIÊU CHUẨN') || up.includes('STANDARD') || up.includes('NORMAL')) return 'NORMAL';
            return up;
        };

        // gender: 'male'|'female'|'other'
        const gender = c.gender || null;

        // parse socialMedia string "key:val, key2:val2" into object
        const parseSocial = (s) => {
            if (!s || typeof s !== 'string') return {};
            const obj = {};
            s.split(',').forEach(part => {
                // Tách key và value, đồng thời trim() để loại bỏ khoảng trắng
                const pieces = part.split(':').map(x => x.trim());
                const key = pieces[0];
                const value = pieces.slice(1).join(':').trim(); // Nối lại phần còn lại của value nếu có dấu ':'
                if (key) {
                    obj[key] = value || '';
                }
            });
            return obj;
        };

        return {
            full_name: c.name,
            customer_type: uiTypeToApi(c.type),
            //Field trả về có định dạng sẵn: "YYYY-MM-DD"
            birth_date: c.birthDate || null,
            gender: gender,
            email: c.email,
            phone: c.phone,
            address: c.address,
            social_channels: parseSocial(c.socialMedia),
            source: c.source,
            // Đảm bảo tags luôn là một mảng
            tags: Array.isArray(c.tags) ? c.tags : [],
            notes: c.notes,
        };
    };

    // Handlers
    const handleView = (customer) => setModal({ open: true, mode: 'view', customer });
    const handleEdit = (customer) => setModal({ open: true, mode: 'edit', customer });
    const handleCreate = () => setModal({ open: true, mode: 'edit', customer: null });
    const closeModal = () => setModal({ open: false, mode: 'view', customer: null, showHistory: false });

    const handleViewHistory = (customer) => setModal({ open: true, mode: 'view', customer, showHistory: true });
    const handleBackFromHistory = () => setModal(prev => ({ ...prev, showHistory: false }));

    const handleSave = async (customerData) => {
        const isCreating = !customerData.id;
        try {
            setLoading(true);
            if (isCreating) {
                const payload = uiToApiPayload(customerData);
                console.log('Creating customer with payload:', payload);
                const res = await createCustomer(payload);
                console.log('Create customer response:', res);
                if (res?.ok) {
                    const added = mapApiToUi(res.data ?? payload);
                    setCustomers(prev => [...prev, added]);
                    closeModal();
                    toast.success('Thêm khách hàng thành công!');
                } else {
                    toast.error(res?.error || 'Tạo khách hàng thất bại');
                }
            } else {
                const payload = uiToApiPayload(customerData);
                const res = await updateCustomer(customerData.id, payload);
                if (res?.ok) {
                    const updated = mapApiToUi(res.data ?? { ...payload, customer_id: customerData.id });
                    setCustomers(prev => prev.map(c => c.id === customerData.id ? updated : c));
                    setModal(prev => ({ ...prev, mode: 'view', customer: updated }));
                    toast.success('Cập nhật khách hàng thành công!');
                } else {
                    toast.error(res?.error || 'Cập nhật thất bại');
                }
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id) => {
        try {
            setLoading(true);
            const res = await deleteCustomer(id);
            console.log('Delete customer response:', res); //Res 204 bên axios đã xử lý và trả về null
            if (res === null) {
                setCustomers(prev => prev.filter(customer => customer.id !== id));
                closeModal();
                toast.success('Xóa khách hàng thành công!');
            } else {
                // Xử lý lỗi (ví dụ: 400 Bad Request, 404 Not Found, 500 Internal Server Error)
                toast.error(res?.error || 'Xóa thất bại. Khách hàng không tồn tại hoặc lỗi server.');
            }
        } catch (e) {
            console.error("Lỗi khi gọi API xóa:", e);
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };


    const getTypeBadge = (type) => {
        const baseClass = "p-1 rounded-sm text-[12px] font-semibold w-[100px] text-center inline-block"; // Thêm shadow cho hiệu ứng nổi bật hơn

        // Định nghĩa các lớp gradient mới
        const vipGradientClass = "bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold";
        const premiumGradientClass = "bg-gradient-to-r from-pink-400 to-yellow-500 text-white font-bold";

        const colorMap = {
            // VIP: Gradient Indigo/Blue
            [CustomerTypes.vip]: vipGradientClass,

            // PREMIUM: Gradient Vàng/Cam
            [CustomerTypes.premium]: premiumGradientClass,

            // Giữ nguyên hoặc thay đổi cho các loại còn lại
            [CustomerTypes.standard]: "bg-gray-100 text-gray-800 border border-gray-200",
            [CustomerTypes.new]: "bg-green-100 text-green-800 border border-green-200",
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

                        {/* Filter by Customer Type */}
                        <DropdownOptions
                            options={CUSTOMER_TYPE_OPTIONS}
                            value={filterType}
                            onChange={setFilterType}
                            width="w-44"
                            placeholder="Phân loại KH"
                        />


                        {/* Add Customer */}
                        <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Thêm KH
                        </Button>

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
                                    {["Khách hàng","Giới tính", "Email", "SĐT", "Nguồn KH", "Loại KH", ""].map((header) => (
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
                                            <div className="text-sm  text-gray-900">{customer.gender}</div>

                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{customer.email || '—'}</div>
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900">{customer.phone || '—'}</div>
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
                                        <td colSpan={6} className="text-center py-8 text-gray-500">Không có khách hàng</td>
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
