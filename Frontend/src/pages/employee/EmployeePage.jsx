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
import { Input } from "@/components/ui/input";
import { getInitials } from "@/utils/helper";
import { useAuthStore } from "@/store/useAuthStore";
import PermissionGuard from "@/components/auth/PermissionGuard";

export default function EmployeePage() {
    const { user } = useAuthStore(); 
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [modal, setModal] = useState({ open: false, mode: 'view', employee: null });
    const [hoveredRow, setHoveredRow] = useState(null);
    const [filterRole, setFilterRole] = useState(""); // Lọc theo vai trò
    const [filterStatus, setFilterStatus] = useState(""); // Lọc theo trạng thái

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 8;

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
            // Chuyển đổi dữ liệu cho phù hợp với UI, thêm avatar_url
            setEmployees(data.map(u => ({
                id: u.user_id,
                name: u.full_name,
                email: u.email,
                phone: u.phone,
                role: u.role_name,
                status: u.status,
                avatar_url: u.avatar_url
            })));
        } catch (err) {
            console.error("Lỗi tải danh sách nhân viên:", err);
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
            setModal({
                open: true, mode: 'view', employee: {
                    id: res.user_id,
                    email: res.email,
                    phone: res.phone,
                    role: res.role_name,
                    status: res.status,
                    avatar_url: res.avatar_url
                }
            });
        } catch (err) {
            toast.error("Không thể lấy chi tiết nhân viên!");
        }
    };

    const handleEdit = (employee) => {
        setModal({
            open: true,
            mode: 'edit',
            employee: { ...employee } // tạo object mới
        });
    };

    const handleCreate = () => {
        setModal({ open: true, mode: 'create', employee: null });
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

                // Update employee list (include avatar_url)
                setEmployees(prev => prev.map(emp =>
                    emp.id === savedItem.user_id
                        ? {
                            id: savedItem.user_id,
                            name: savedItem.full_name,
                            email: savedItem.email,
                            phone: savedItem.phone,
                            role: savedItem.role_name,
                            status: savedItem.status,
                            avatar_url: savedItem.avatar_url
                        }
                        : emp
                ));

                // Luôn chuyển sang view sau khi lưu thành công
                setModal(prev => ({
                    ...prev,
                    mode: 'view',
                    employee: {
                        id: savedItem.user_id,
                        name: savedItem.full_name,
                        email: savedItem.email,
                        phone: savedItem.phone,
                        role: savedItem.role_name,
                        status: savedItem.status,
                        avatar_url: savedItem.avatar_url
                    }
                }));
                toast.success("Cập nhật nhân viên thành công!");
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

                setEmployees(prev => [{
                    id: savedItem.user_id,
                    name: savedItem.full_name,
                    email: savedItem.email,
                    phone: savedItem.phone,
                    role: savedItem.role_name,
                    status: savedItem.status,
                    avatar_url: savedItem.avatar_url
                }, ...prev]);

                toast.success("Thêm nhân viên thành công!");
                closeModal();
            }
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err?.message || "Lỗi khi lưu nhân viên!";
            toast.error(errorMessage);

            // Giữ modal ở edit để sửa tiếp
            setModal(prev => ({ ...prev, mode: 'edit' }));
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



    const handleImportSuccess = (importedData) => {
        try {
            const processedEmployees = importedData.map((item, index) => ({
                id: Math.max(...employees.map(e => e.id), 0) + index + 1,
                name: item['Tên nhân viên'] || item.name || 'Untitled',
                email: item['Email'] || item.email || '',
                phone: item['Số điện thoại'] || item.phone || '',
                role: item['Vai trò'] || item.role || 'Sales',
                status: item['Trạng thái'] || item.status || 'Active',
                avatar_url: null
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
                className="flex-col sticky top-[70px] z-20 flex gap-3 p-3 bg-brand/10 backdrop-blur-lg rounded-md"
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
                            <Input
                                type="text"
                                placeholder="Tìm kiếm nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10" // ensure search text doesn't overlap icon
                            />
                        </div>

                        {/* Add Employee */}
                        <PermissionGuard module="user" action="create">
                            <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Thêm Nhân viên
                            </Button>
                        </PermissionGuard>
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
            <div className="flex-1 pt-4">
                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
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
                                {currentEmployees.map((employee) => {
                                    const isCurrentUser = user.user_id === employee.id; // check row hiện tại có phải chính user đăng nhập không
                                    console.log('Current User ID:', user.user_id, 'Employee ID:', employee.id);
                                    return (
                                        <tr
                                            key={employee.id}
                                            className={`group relative transition-colors cursor-pointer
                                                    ${hoveredRow === employee.id ? "bg-gray-50" : ""}
                                                    ${user.user_id === employee.id ? "bg-blue-50 hover:bg-blue-100" : ""}`
                                            }
                                            onMouseEnter={() => setHoveredRow(employee.id)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                        >

                                            <td className="px-6 py-2 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {employee.avatar_url ? (
                                                        <img
                                                            src={employee.avatar_url}
                                                            alt={employee.name}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xs font-semibold uppercase">
                                                            {getInitials(employee.name)}
                                                        </div>
                                                    )}
                                                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{employee.email}</div>
                                            </td>

                                            <td className="px-6 py-2 whitespace-nowrap text-center">
                                                <div className="text-sm text-gray-900">{employee.phone}</div>
                                            </td>

                                            <td className="px-6 py-2 whitespace-nowrap text-center">
                                                <span>{employee.role}</span>
                                            </td>

                                            <td className="px-6 py-2 whitespace-nowrap text-center w-32 uppercase">
                                                <span className={getStatusBadge(employee.status)}>
                                                    {employee.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2 text-center w-36">
                                                {!isCurrentUser && (
                                                    <div
                                                        className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === employee.id
                                                            ? "opacity-100 translate-y-0 pointer-events-auto"
                                                            : "opacity-0 translate-y-1 pointer-events-none"
                                                            }`}
                                                    >
                                                        <PermissionGuard module="user" action="read">
                                                            <Button
                                                                variant="actionRead"
                                                                size="icon"
                                                                onClick={() => handleView(employee)}
                                                                className="h-8 w-8"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </PermissionGuard>
                                                        <PermissionGuard module="user" action="update">
                                                            <Button
                                                                variant="actionUpdate"
                                                                size="icon"
                                                                onClick={() => handleEdit(employee)}
                                                                className="h-8 w-8"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </PermissionGuard>
                                                        <PermissionGuard module="user" action="delete">
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
                                                        </PermissionGuard>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }
                                )
                                }
                                {/* Trạng thái rỗng */}
                                {currentEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">Không có Nhân viên</td>
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

                {/* Employee Dialog */}
                <AppDialog
                    open={modal.open}
                    onClose={closeModal}
                    mode={modal.mode}
                    title={{
                    view: `Thông tin nhân viên`,
                    edit: `Chỉnh sửa thông tin nhân viên`,
                    create: "Thêm nhân viên mới",
                }}
                    // THÊM: Truyền hàm setMode để EmployeeForm có thể tự chuyển mode (view <-> edit)
                    setMode={(newMode) => setModal(prev => ({
                        ...prev,
                        mode: newMode === 'close' ? prev.mode : newMode // 'close' để xử lý đóng modal
                    }))}
                    FormComponent={EmployeeForm}
                    data={modal.employee}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    availableRoles={roles}
                // ...
                />
            </div>
        </div>
    );
}



