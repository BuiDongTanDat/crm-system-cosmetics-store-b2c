import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter, History } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import EmployeeForm from "@/pages/employee/components/EmployeeForm";
import AppPagination from "@/components/pagination/AppPagination";
import ImportExportDropdown from "@/components/common/ImportExportDropdown";
import DropdownOptions from '@/components/common/DropdownOptions';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "@/services/users";
import { getRoles } from "@/services/roles";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";

export default function EmployeePage() {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: 'view', employee: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const [filterRole, setFilterRole] = useState(""); // Lọc theo vai trò
    const [filterStatus, setFilterStatus] = useState(""); // Lọc theo trạng thái

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 6;

    // Field mapping for CSV export/import
    const employeeFieldMapping = {
        name: 'Tên nhân viên',
        email: 'Email',
        phone: 'Số điện thoại',
        role: 'Vai trò',
        status: 'Trạng thái'
    };

    // Fetch employees từ API
    const fetchEmployees = async () => {
        try {
            const res = await getUsers();
            let data = Array.isArray(res) ? res : res?.data;
            if (!data) data = [];
            // Chuyển đổi dữ liệu cho phù hợp với UI
            setEmployees(data.map(u => ({
                id: u.user_id,
                name: u.full_name,
                email: u.email,
                phone: u.phone,
                role: u.role_name,
                status: u.status
            })));
        } catch (err) {
            console.error("Lỗi tải danh sách nhân viên:", err);
            toast.error("Không thể tải danh sách nhân viên.");
        }
    };

    // Fetch roles từ API
    const fetchRoles = async () => {
        try {
            const res = await getRoles(); //Call api lấy roles
            let data = Array.isArray(res) ? res : res?.data;
            if (!data) data = [];
            // Chỉ lấy các role đang active và có role_name
            setRoles(
                data.map(role => ({
                        value: role.role_name,
                        label: role.role_name
                    }))
            );
        } catch (err) {
            console.error("Lỗi tải danh sách vai trò:", err);
            toast.error("Không thể tải danh sách vai trò.");
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchRoles();
    }, []);

    const filteredEmployees = employees.filter(employee =>
        (employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRole ? employee.role === filterRole : true) &&
        (filterStatus ? employee.status === filterStatus.toLowerCase() : true)
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
    const handleView = async (employee) => {
        // Lấy chi tiết user từ API nếu cần
        try {
            const res = await getUserById(employee.id);
            setModal({ open: true, mode: 'view', employee: {
                id: res.user_id,
                name: res.full_name,
                email: res.email,
                phone: res.phone,
                role: res.role_name,
                status: res.status
            }});
        } catch (err) {
            toast.error("Không thể lấy chi tiết nhân viên!");
        }
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

    const handleSave = async (employeeData) => {
        try {
            let savedItem;
            if (employeeData.id) {
                // Update
                const payload = {
                    full_name: employeeData.name,
                    email: employeeData.email,
                    phone: employeeData.phone,
                    role_name: employeeData.role,
                    status: employeeData.status,
                    password: employeeData.password
                };
                await updateUser(employeeData.id, payload);
                savedItem = await getUserById(employeeData.id);
                if (savedItem && savedItem.user_id) {
                    setEmployees(prev => {
                        const idx = prev.findIndex(e => e.id === employeeData.id);
                        if (idx !== -1) {
                            const newArr = [...prev];
                            newArr[idx] = {
                                id: savedItem.user_id,
                                name: savedItem.full_name,
                                email: savedItem.email,
                                phone: savedItem.phone,
                                role: savedItem.role_name,
                                status: savedItem.status
                            };
                            return newArr;
                        }
                        return [...prev, {
                            id: savedItem.user_id,
                            name: savedItem.full_name,
                            email: savedItem.email,
                            phone: savedItem.phone,
                            role: savedItem.role_name,
                            status: savedItem.status
                        }];
                    });
                    setModal({ open: true, mode: 'view', employee: {
                        id: savedItem.user_id,
                        name: savedItem.full_name,
                        email: savedItem.email,
                        phone: savedItem.phone,
                        role: savedItem.role_name,
                        status: savedItem.status
                    }});
                    toast.success("Cập nhật nhân viên thành công!");
                } else {
                    await fetchEmployees();
                    setModal({ open: true, mode: 'view', employee: employeeData });
                }
            } else {
                // Create
                const payload = {
                    full_name: employeeData.name,
                    email: employeeData.email,
                    phone: employeeData.phone,
                    role_name: employeeData.role,
                    status: employeeData.status,
                    password: employeeData.password
                };
                savedItem = await createUser(payload);
                if (savedItem && savedItem.user_id) {
                    setEmployees(prev => [{
                        id: savedItem.user_id,
                        name: savedItem.full_name,
                        email: savedItem.email,
                        phone: savedItem.phone,
                        role: savedItem.role_name,
                        status: savedItem.status
                    }, ...prev]);
                    toast.success("Thêm nhân viên thành công.");
                    closeModal();
                } else {
                    await fetchEmployees();
                    closeModal();
                }
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || err?.message || "Lỗi khi lưu nhân viên!";
            toast.error(String(msg));
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteUser(id);
            setEmployees(prev => prev.filter(emp => emp.id !== id));
            closeModal();
            toast.success("Xóa nhân viên thành công!");
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || err?.message || "Lỗi khi xóa nhân viên!";
            toast.error(String(msg));
        }
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
        toast.success("Xuất nhân viên thành công.");
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
                    toast.success("Nhập file thành công.");
                } else {
                    toast.error('File import không hợp lệ (cần mảng JSON)');
                }
            } catch (err) {
                toast.error('Không thể đọc file JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    const handleImportSuccess = (importedData) => {
        try {
            const processedEmployees = importedData.map((item, index) => ({
                id: Math.max(...employees.map(e => e.id), 0) + index + 1,
                name: item['Tên nhân viên'] || item.name || 'Untitled',
                email: item['Email'] || item.email || '',
                phone: item['Số điện thoại'] || item.phone || '',
                role: item['Vai trò'] || item.role || 'Sales',
                status: item['Trạng thái'] || item.status || 'Active'
            }));

            setEmployees(prev => [...prev, ...processedEmployees]);
            toast.success(`Đã nhập thành công ${processedEmployees.length} nhân viên!`);
        } catch (error) {
            console.error('Lỗi xử lý dữ liệu nhập:', error);
            toast.error('Có lỗi xảy ra khi xử lý dữ liệu nhập');
        }
    };

    const handleImportError = (errorMessage) => {
        toast.error(`Lỗi nhập file: ${errorMessage}`);
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-2 py-1  text-xs font-medium w-[100px] text-center inline-block rounded-full";
        return status === "active"
            ? `${baseClass} text-green-800 bg-green-100 `
            : `${baseClass}  text-red-800 bg-red-100`;
    };

    

    return (
        <div className="flex flex-col">
            {/* Sticky header */}
            <div
                className="flex-col sticky top-[70px] z-20 flex gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md"
                style={{ backdropFilter: 'blur' }}
            >
                <div className="flex justify-between">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">
                            Quản lý Nhân viên({filteredEmployees.length})
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all border-gray-200 bg-white/90 dark:bg-gray-800/90"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        

                        {/* Add Employee */}
                        <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Thêm Nhân viên
                        </Button>

                        {/* Import/Export Dropdown */}
                        <ImportExportDropdown
                            data={employees}
                            filename="employees"
                            fieldMapping={employeeFieldMapping}
                            onImportSuccess={handleImportSuccess}
                            onImportError={handleImportError}
                            trigger="icon"
                            variant="actionNormal"
                        />
                    </div>
                </div>
                <div className="flex gap-3 items-center justify-end w-full">
                    {/* Filter by Role */}
                        <DropdownOptions
                            options={[
                                { value: "", label: "Tất cả vai trò" },
                                ...roles
                            ]}
                            value={filterRole}
                            onChange={setFilterRole}
                            width="w-40"
                        />

                        {/* Filter by Status */}
                        <DropdownOptions
                            options={[
                                { value: "", label: "Tất cả trạng thái" },
                                { value: "active", label: "ACTIVE" },
                                { value: "inactive", label: "INACTIVE" }
                            ]}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            width="w-40"
                        />
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
                                            <span >{employee.role}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center w-32 uppercase">
                                            <span className={getStatusBadge(employee.status)}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center w-36">
                                            <div
                                                className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === employee.id
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

                                                {/* Dùng ConfirmDialog cho hành động xóa ở table */}
                                                <ConfirmDialog
                                                    title="Xác nhận xóa"
                                                    description={
                                                        <>
                                                            Bạn có chắc chắn muốn xóa nhân viên{" "}
                                                            <span className="font-semibold text-black">{employee.name}</span>?
                                                        </>
                                                    }
                                                    confirmText="Xóa"
                                                    cancelText="Hủy"
                                                    onConfirm={() => handleDelete(employee.id)}
                                                >
                                                    <Button
                                                        variant="actionDelete"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </ConfirmDialog>

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
                <AppDialog
                    open={modal.open}
                    onClose={closeModal}
                    title={{
                        view: `Chi tiết nhân viên - ${modal.employee?.name || ''}`,
                        edit: modal.employee ? `Chỉnh sửa nhân viên - ${modal.employee.name}` : 'Thêm nhân viên mới'
                    }}
                    mode={modal.mode}
                    FormComponent={EmployeeForm}
                    data={modal.employee}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    availableRoles={roles}
                    maxWidth="sm:max-w-2xl"
                />
            </div>
        </div>
    );
}



