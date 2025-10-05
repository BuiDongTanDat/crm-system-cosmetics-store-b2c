import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter, MoreVertical } from "lucide-react";
import EmployeeDialog from "@/components/dialogs/EmployeeDialog";
import AppPagination from "@/components/pagination/AppPagination";
import { mockEmployees, mockRoles } from "@/lib/data";

export default function EmployeePage() {
    const [employees, setEmployees] = useState(mockEmployees);
    const [roles, setRoles] = useState(mockRoles);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: 'view', employee: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 6;

    const filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    useEffect(() => setCurrentPage(1), [searchTerm]);
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeesPerPage));
    const indexOfLast = currentPage * employeesPerPage;
    const indexOfFirst = indexOfLast - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);

    // Pagination handlers
    const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handlePageChange = (page) => setCurrentPage(page);

    // Handlers
    const handleView = (employee) => {
        setModal({ open: true, mode: 'view', employee });
    };

    const handleEdit = (employee) => {
        setModal({ open: true, mode: 'edit', employee });
    };

    const handleCreate = () => {
        setModal({ open: true, mode: 'edit', employee: null });
    };

    const closeModal = () => {
        setModal({ open: false, mode: 'view', employee: null });
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
            setEmployees(prev => prev.filter(emp => emp.id !== id));
            closeModal();
        }
    };

    const handleSave = (employeeData) => {
        if (employeeData.id) {
            // Update existing
            setEmployees(prev => prev.map(emp =>
                emp.id === employeeData.id ? { ...emp, ...employeeData } : emp
            ));
        } else {
            // Create new
            const newEmployee = {
                ...employeeData,
                id: Math.max(...employees.map(e => e.id)) + 1
            };
            setEmployees(prev => [...prev, newEmployee]);
        }
        console.log("Employee saved:", employeeData);
    };

    // Import/Export functions
    const exportEmployees = () => {
        const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employees.json';
        a.click();
        URL.revokeObjectURL(url);
        setMenuOpen(false);
    };

    const importEmployees = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (Array.isArray(json)) {
                    setEmployees(json.map((item, i) => ({
                        id: item.id || Date.now() + i,
                        name: item.name || 'Untitled',
                        email: item.email || '',
                        phone: item.phone || '',
                        role: item.role || 'Sales',
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
        const baseClass = "px-2 py-1  text-xs font-medium w-[100px] text-center inline-block";
        return status === "Active"
            ? `${baseClass} text-green-800`
            : `${baseClass}  text-red-800`;
    };

    const getRoleBadge = (role) => {
        const baseClass = "px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center inline-block";
        const colorMap = {
            Admin: "bg-purple-100 text-purple-800",
            Sales: "bg-blue-100 text-blue-800",
            Marketing: "bg-orange-100 text-orange-800",
            Support: "bg-gray-100 text-gray-800"
        };
        return `${baseClass} ${colorMap[role] || colorMap.Support}`;
    };

    return (
        <div className="p-6">
            {/* Header theo định dạng ProductPage */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý Nhân viên ({filteredEmployees.length})
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
                    <Button
                        variant="actionNormal"
                        className="gap-2"
                    >
                        <Filter className="w-5 h-5" />
                        Lọc
                    </Button>

                    {/* Add Employee */}
                    <Button
                        onClick={handleCreate}
                        variant="actionCreate"
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm NV
                    </Button>

                    {/* Menu */}
                    <div className="relative">
                        <Button
                            variant="actionNormal"
                            onClick={() => setMenuOpen(prev => !prev)}
                        >
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
                                    onClick={exportEmployees}
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
                            onChange={(e) => importEmployees(e.target.files?.[0])}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "Nhân viên",
                                    "Email", 
                                    "SĐT",
                                    "Vai trò",
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
                            {currentEmployees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                                    onMouseEnter={() => setHoveredRow(employee.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{employee.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm text-gray-900">{employee.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={getRoleBadge(employee.role)}>{employee.role}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center w-32">
                                        <span className={getStatusBadge(employee.status)}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center w-36">
                                        <div
                                            className={`flex justify-center gap-1 transition-all duration-200 ${
                                                hoveredRow === employee.id
                                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                                    : "opacity-0 translate-y-1 pointer-events-none"
                                            }`}
                                        >
                                            <Button
                                                variant="actionRead"
                                                size="icon"
                                                onClick={() => handleView(employee)}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="actionUpdate"
                                                size="icon"
                                                onClick={() => handleEdit(employee)}
                                                className="h-8 w-8"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="actionDelete"
                                                size="icon"
                                                onClick={() => handleDelete(employee.id)}
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

            {/* Employee Dialog */}
            <EmployeeDialog
                modal={modal}
                closeModal={closeModal}
                handleSave={handleSave}
                handleDelete={handleDelete}
                availableRoles={roles.filter(role => role.status === "Active")}
            />
        </div>
    );
}


