import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import AppDialog from "@/components/dialogs/AppDialog";
import RoleForm from "@/pages/role/components/RoleForm";
import AppPagination from "@/components/pagination/AppPagination";
// import { mockRoles } from "@/lib/data"; // Xóa dòng này
import {
  getRoles,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getModules,
} from "@/services/roles"; // Thêm dòng này
import { formatDate, formatDateTime } from "@/utils/helper";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import PermissionGuard from "@/components/auth/PermissionGuard";


export default function RolePage() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "view", role: null });
  const [hoveredRow, setHoveredRow] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rolesPerPage = 8;

  const filteredRoles = roles.filter(
    (role) =>
      (role.role_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (role.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  useEffect(() => setCurrentPage(1), [searchTerm]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRoles.length / rolesPerPage)
  );
  const indexOfLast = currentPage * rolesPerPage;
  const indexOfFirst = indexOfLast - rolesPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirst, indexOfLast);

  // Pagination handlers
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);



  // Fetch roles từ API
  const fetchRoles = async () => {
    try {
      const res = await getRoles();
      let data = Array.isArray(res) ? res : res?.data;
      if (!data) data = [];
      setRoles(data);
    } catch (err) {
      console.error("Lỗi tải danh sách vai trò:", err);
      // const msg =
      //   err?.response?.data?.error ||
      //   err?.message ||
      //   "Không thể tải danh sách vai trò.";
      // toast.error(msg);
    }
  };

  //Fetch module và permission
  const fetchModulesAndPermissions = async () => {
    try {
      const res = await getModules();
      const modules = res?.permissions;
      const actionList = res?.actions;
      setModules(modules);
      setActions(actionList);
    } catch (error) {
      
    }
  }

  useEffect(() => {
    fetchRoles();
    fetchModulesAndPermissions();
  }, []);

  // Handlers
  const handleView = async (role) => {
    setModal({ open: true, mode: "view", role });
  };

  const handleEdit = (role) => {
    setModal({ open: true, mode: "edit", role });
  };

  const handleCreate = () => {
    setModal({ open: true, mode: "create", role: null });
  };

  const closeModal = () => {
    setModal({ open: false, mode: "view", role: null });
  };

  const handleSave = async (roleData) => {
    try {
      let savedItem;

      if (roleData.mode === "edit" && modal.role?.role_name) {
        // Cập nhật
        await updateRole(modal.role.role_name, roleData);
        savedItem = await getRoleByName(modal.role.role_name);

        if (savedItem) {
          setRoles((prev) =>
            prev.map((r) =>
              r.role_name === modal.role.role_name ? savedItem : r
            )
          );
          toast.success("Cập nhật vai trò thành công!");
          setModal({ open: true, mode: "view", role: savedItem });
        } else {
          await fetchRoles();
          setModal({ open: true, mode: "view", role: roleData });
        }
      } else if (roleData.mode === "create") {
        // Tạo mới
        savedItem = await createRole(roleData);
        if (savedItem && savedItem.role_name) {
          setRoles((prev) => [savedItem, ...prev]);
          toast.success("Thêm vai trò thành công.");
          closeModal();
        } else {
          await fetchRoles();
          closeModal();
        }
      } else {
        console.warn("Không xác định được mode khi lưu vai trò:", roleData);
      }
    } catch (err) {
      console.error("Lỗi lưu vai trò:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Đã xảy ra lỗi không xác định.";
      toast.error(msg);
    }
  };

  const handleDelete = async (role_name) => {
    try {
      await deleteRole(role_name);
      setRoles((prev) => prev.filter((r) => r.role_name !== role_name));
      closeModal();
      toast.success("Xóa vai trò thành công!");
    } catch (err) {
      console.error("Lỗi xóa vai trò:", err);
      const msg =
        err?.response?.data?.error || err?.message || "Lỗi khi xóa vai trò!";
      toast.error(msg);
    }
  };

  return (
    <div className=" flex flex-col">
      {/* Sticky header */}
      <div
        className="my-3 z-20 flex  gap-3 p-3 bg-brand/10 backdrop-blur-lg rounded-md "
        style={{ backdropFilter: "blur" }}
      >
        <div className="flex md:justify-between w-full flex-col md:flex-row gap-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              Quản lý Vai trò ({filteredRoles.length})
            </h1>
          </div>

          <div className="flex flex-col md:flex-row w-full md:w-auto items-center gap-3">
            {/* Search */}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm vai trò..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Add Role */}
            <PermissionGuard module="role" action="create">
              <Button
                onClick={handleCreate}
                variant="actionCreate"
                className="gap-2 w-full md:w-auto"
              >
                <Plus className="w-4 h-4" />
                Thêm vai trò
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Scrollable content: table, pagination, dialog */}
      <div className="flex-1">
        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Tên vai trò",
                    "Mô tả",
                    "Ngày tạo",
                    "Cập nhật lần cuối",
                    "",
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
                {currentRoles.map((role) => (
                  <tr
                    key={role.role_name}
                    className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredRow(role.role_name)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {role.role_name}
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-start">
                      <div className="text-sm text-gray-900">
                        {role.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(role.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(role.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center w-36">
                      <div
                        className={`flex justify-center gap-1 transition-all duration-200 ${
                          hoveredRow === role.role_name
                            ? "opacity-100 translate-y-0 pointer-events-auto "
                            : "opacity-0 translate-y-1 pointer-events-none"
                        }`}
                      >
                        <PermissionGuard module="role" action="read">
                          <Button
                            variant="actionRead"
                            size="icon"
                            onClick={() => handleView(role)}
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard module="role" action="update">
                          <Button
                            variant="actionUpdate"
                            size="icon"
                            onClick={() => handleEdit(role)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard module="role" action="delete">
                          {/* Dùng ConfirmDialog cho hành động xóa */}
                          <ConfirmDialog
                            title="Xác nhận xóa"
                            description={
                              <>
                                Bạn có chắc chắn muốn xóa vai trò{" "}
                                <span className="font-semibold text-black">
                                  {role.role_name}
                                </span>
                                ?
                              </>
                            }
                            confirmText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => handleDelete(role.role_name)}
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
                {currentRoles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Không có Vai trò
                    </td>
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

        {/* Role Dialog */}
        <AppDialog
          open={modal.open}
          onClose={closeModal}
          title={{
            view: `Chi tiết vai trò - ${modal.role?.role_name || ""}`,
            edit: modal.role
              ? `Chỉnh sửa vai trò - ${modal.role.role_name}`
              : "Thêm vai trò mới",
            create: "Thêm vai trò mới", //Này thêm chế độ create tại có phân biết với edit trong việc được nhập role name hay không
          }}
          mode={modal.mode}
          FormComponent={RoleForm}
          data={modal.role}
          onSave={handleSave}
          onDelete={handleDelete}
          maxWidth="sm:max-w-2xl"
          permissionsList={modules}
          actionsList={actions}
          onCancel={closeModal}
        />
      </div>
    </div>
  );
}
