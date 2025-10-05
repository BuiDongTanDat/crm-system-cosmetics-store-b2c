import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter, MoreVertical } from "lucide-react";
import CustomerDialog from "@/components/dialogs/CustomerDialog";
import AppPagination from "@/components/pagination/AppPagination";
import { mockCustomers, CustomerTypes, CustomerSources } from "@/lib/data";

export default function CustomerListPage() {
    const [customers, setCustomers] = useState(mockCustomers);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: 'view', customer: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const customersPerPage = 6;

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.industry.toLowerCase().includes(searchTerm.toLowerCase())
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
    const handleView = (customer) => {
        setModal({ open: true, mode: 'view', customer });
    };

    const handleEdit = (customer) => {
        setModal({ open: true, mode: 'edit', customer });
    };

    const handleCreate = () => {
        setModal({ open: true, mode: 'edit', customer: null });
    };

    const closeModal = () => {
        setModal({ open: false, mode: 'view', customer: null });
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
            setCustomers(prev => prev.filter(customer => customer.id !== id));
            closeModal();
        }
    };

    const handleSave = (customerData) => {
        if (customerData.id) {
            // Update existing
            setCustomers(prev => prev.map(customer =>
                customer.id === customerData.id ? { ...customer, ...customerData } : customer
            ));
        } else {
            // Create new
            const newCustomer = {
                ...customerData,
                id: Math.max(...customers.map(c => c.id)) + 1
            };
            setCustomers(prev => [...prev, newCustomer]);
        }
        console.log("Customer saved:", customerData);
    };

    // Import/Export functions
    const exportCustomers = () => {
        const blob = new Blob([JSON.stringify(customers, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.json';
        a.click();
        URL.revokeObjectURL(url);
        setMenuOpen(false);
    };

    const importCustomers = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (Array.isArray(json)) {
                    setCustomers(json.map((item, i) => ({
                        id: item.id || Date.now() + i,
                        name: item.name || 'Untitled',
                        type: item.type || CustomerTypes.standard,
                        birthDate: item.birthDate || '',
                        gender: item.gender || 'Nam',
                        industry: item.industry || 'Công nghệ thông tin',
                        email: item.email || '',
                        phone: item.phone || '',
                        address: item.address || '',
                        socialMedia: item.socialMedia || '',
                        source: item.source || CustomerSources.website,
                        notes: item.notes || '',
                        tags: item.tags || [],
                        status: item.status || 'Active'
                    })));
                    setMenuOpen(false);
                } else {
                    alert('File import không hợp lệ (cần mảng JSON)');
                }
            } catch (err) {
                alert('Không thể đọc file JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center inline-block";
        return status === "Active"
            ? `${baseClass} bg-green-100 text-green-800`
            : `${baseClass} bg-red-100 text-red-800`;
    };

    const getTypeBadge = (type) => {
        const baseClass = "px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center inline-block";
        const colorMap = {
            [CustomerTypes.vip]: "bg-purple-100 text-purple-800",
            [CustomerTypes.premium]: "bg-blue-100 text-blue-800",
            [CustomerTypes.standard]: "bg-gray-100 text-gray-800",
            [CustomerTypes.new]: "bg-yellow-100 text-yellow-800"
        };
        return `${baseClass} ${colorMap[type] || colorMap[CustomerTypes.standard]}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý Khách hàng ({filteredCustomers.length})
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

                    {/* Add Customer */}
                    <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Thêm KH
                    </Button>

                    {/* Menu */}
                    <div className="relative">
                        <Button variant="actionNormal" onClick={() => setMenuOpen(prev => !prev)}>
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
                                    onClick={exportCustomers}
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
                            onChange={(e) => importCustomers(e.target.files?.[0])}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "Khách hàng",
                                    "Email",
                                    "SĐT",
                                    "Ngành nghề",
                                    "Nguồn KH",
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
                            {currentCustomers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                                    onMouseEnter={() => setHoveredRow(customer.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                        <span className={getTypeBadge(customer.type)}>{customer.type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{customer.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm text-gray-900">{customer.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm text-gray-900">{customer.industry}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm text-gray-900">{customer.source}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center w-32">
                                        <span className={getStatusBadge(customer.status)}>
                                            {customer.status === "Active" ? "Hoạt động" : "Không hoạt động"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center w-36">
                                        <div
                                            className={`flex justify-center gap-1 transition-all duration-200 ${
                                                hoveredRow === customer.id
                                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                                    : "opacity-0 translate-y-1 pointer-events-none"
                                            }`}
                                        >
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
                                            <Button
                                                variant="actionDelete"
                                                size="icon"
                                                onClick={() => handleDelete(customer.id)}
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

            {/* Customer Dialog */}
            <CustomerDialog
                modal={modal}
                closeModal={closeModal}
                handleSave={handleSave}
                handleDelete={handleDelete}
            />
        </div>
    );
}