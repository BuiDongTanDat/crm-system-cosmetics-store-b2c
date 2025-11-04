// pages/automation/AutomationPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Play, Pause, Mail, Settings, List, Square, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/common/DropdownOptions';
import AppDialog from '@/components/dialogs/AppDialog';
import AutomationForm from '@/pages/automation/components/AutomationForm';
import AutomationCard from '@/pages/automation/components/AutomationCard';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import AppPagination from '@/components/pagination/AppPagination';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/utils/helper';

import { request } from '@/utils/api';
import { getFlow } from '@/services/automation'; // ⬅️ dùng service đã unwrap

// ✅ Adapter: API -> UI
const adaptFlow = (f) => ({
  id: f.flow_id,                               // UI & Card đang dùng "id"
  name: f.name,
  description: f.description || '',
  status: (f.status || 'UNDEFINED').toUpperCase(), // API trả "active" → UI cần "ACTIVE"
  tags: Array.isArray(f.tags) ? f.tags : [],
  created_by: f.created_by || '—',
  created_at: f.created_at || null,
  updated_at: f.updated_at || null,
  triggers: Array.isArray(f.triggers) ? f.triggers : [],
  actions: Array.isArray(f.actions) ? f.actions : [],
  type: f.type || 'Flow',
});

// (giữ 2 hàm này tại đây cho gọn, nếu thích có thể dời sang services)
const deleteFlow = (id) => request(`/automation/flows/${id}`, { method: 'DELETE' });
const updateFlowStatus = (id, status) =>
  request(`/automation/flows/${id}/status`, { method: 'PATCH', body: { status } });

export default function AutomationPage() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', automation: null });
  const [currentPage, setCurrentPage] = useState(1);
  const automationsPerPage = 3;

  const [viewMode, setViewMode] = useState('card');
  const [hoveredRow, setHoveredRow] = useState(null);

  const navigate = useNavigate();

  // 🔄 Fetch data từ API (đã unwrap trong service)
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getFlow(); // <-- đã là array sạch
      setAutomations(items.map(adaptFlow));
    } catch (e) {
      setError(e?.message || 'Không thể tải danh sách flows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered automations
  const filtered = automations.filter((a) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (a.name || '').toLowerCase().includes(term) ||
      (a.description || '').toLowerCase().includes(term);
    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  useEffect(() => setCurrentPage(1), [searchTerm, selectedStatus]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / automationsPerPage));
  const indexOfLast = currentPage * automationsPerPage;
  const indexOfFirst = indexOfLast - automationsPerPage;
  const currentAutomations = filtered.slice(indexOfFirst, indexOfLast);

  // Handlers
  const openView = (a) => setModal({ open: true, mode: 'view', automation: a });
  const openAdd = () => navigate('/automation/flow/new');
  const openEdit = (a) => navigate(`/automation/flow/${a.id}`);
  const closeModal = () => setModal({ open: false, mode: 'view', automation: null });

  const handleSave = (automationData) => {
    setAutomations((prev) =>
      prev.map((x) => (x.id === automationData.id ? { ...x, ...automationData } : x))
    );
    toast.success('Cập nhật automation thành công!');
    closeModal();
  };

  const handleDelete = async (id) => {
    const prev = automations;
    setAutomations((list) => list.filter((a) => a.id !== id)); // optimistic
    try {
      await deleteFlow(id);
      toast.success('Xóa automation thành công!');
    } catch (e) {
      setAutomations(prev); // rollback
      toast.error('Xóa thất bại!');
    }
  };

  const handleStatusChange = async (id, nextUiStatus) => {
    const nextApiStatus = (nextUiStatus || '').toLowerCase();
    const prev = automations;
    setAutomations((arr) => arr.map((i) => (i.id === id ? { ...i, status: nextUiStatus } : i)));
    try {
      await updateFlowStatus(id, nextApiStatus);
      toast.success(nextUiStatus === 'ACTIVE' ? 'Đã kích hoạt flow' : 'Đã tạm dừng flow');
    } catch (e) {
      setAutomations(prev); // rollback
      toast.error('Đổi trạng thái thất bại!');
    }
  };

  // Stats
  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === 'ACTIVE').length,
    paused: automations.filter((a) => a.status === 'INACTIVE').length,
    draft: automations.filter((a) => a.status === 'DRAFT').length,
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Đang chạy' },
    { value: 'DRAFT', label: 'Bản nháp' },
    { value: 'INACTIVE', label: 'Ngưng hoạt động' },
  ];

  const getStatusBadge = (status) => {
    let color = 'bg-gray-100 text-gray-700';
    let text = status ? status : 'UNDEFINED';
    if (status === 'ACTIVE') color = 'bg-green-100 text-green-700';
    else if (status === 'DRAFT') color = 'bg-gray-100 text-gray-700';
    else if (status === 'INACTIVE') color = 'bg-red-100 text-red-700';
    return (
      <span className={`inline-block px-1 py-1 rounded-full w-[80px] text-center text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  if (loading) return <div className="p-6">Đang tải…</div>;
  if (error) return <div className="p-6 text-red-600">Lỗi: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-[70px] z-20 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <div className="flex items-center justify-between mb-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Automation Flow ({filtered.length})
            </h1>
            <div className="flex">
              <Button
                variant={viewMode === 'card' ? 'actionCreate' : 'actionNormal'}
                onClick={() => setViewMode('card')}
                size="icon"
                className="rounded-none rounded-tl-md rounded-bl-md"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'actionCreate' : 'actionNormal'}
                onClick={() => setViewMode('list')}
                size="icon"
                className="rounded-none rounded-tr-md rounded-br-md"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm automation..."
                className="h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 border-gray-200 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Status Filter */}
            <DropdownOptions
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              width="w-48"
            />
            {/* Add Automation */}
            <Button onClick={openAdd} variant="actionCreate" className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo Automation mới
            </Button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Tổng số</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <Play className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Đang chạy</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <Pause className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Tạm dừng</p>
              <p className="text-2xl font-bold text-orange-600">{stats.paused}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <Settings className="w-8 h-8 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Bản nháp</p>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable automations list */}
      <div className="flex-1 overflow-auto pt-4 px-6">
        {/* Automations view */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {currentAutomations.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onView={openView}
                onEdit={openEdit} // bấm Edit → navigate sang trang editor
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tên Flow', 'Loại', 'Tags', 'Người tạo', 'Triggers', 'Actions', 'Tạo lúc', 'Trạng thái', 'Kích hoạt', 'Tác vụ'].map((h) => (
                      <th key={h} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAutomations.map((a) => (
                    <tr
                      key={a.id}
                      onMouseEnter={() => setHoveredRow(a.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="font-medium text-gray-900 truncate max-w-[220px]">{a.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[220px]">{a.description || ''}</div>
                      </td>
                      <td className="text-center text-sm text-gray-800">{a.type || 'Flow'}</td>
                      <td className="text-center text-xs">{(a.tags || []).join(', ')}</td>
                      <td className="text-center text-xs">{a.created_by}</td>
                      <td className="text-center text-xs">{a.triggers?.length || 0}</td>
                      <td className="text-center text-xs">{a.actions?.length || 0}</td>
                      <td className="text-center text-sm">{a.created_at ? formatDate(a.created_at) : '-'}</td>
                      <td className="text-center text-sm">{getStatusBadge(a.status)}</td>
                      <td className="text-center text-sm">
                        <Button
                          variant={a.status === 'ACTIVE' ? 'actionUpdate' : 'actionCreate'}
                          size="sm"
                          onClick={() =>
                            handleStatusChange(a.id, a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                          }
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          {a.status === 'ACTIVE' ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span className="font-medium">Tạm dừng</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span className="font-medium">Kích hoạt</span>
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="text-center w-44">
                        <div
                          className={`flex justify-center gap-1 transition-opacity duration-200 ${hoveredRow === a.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                        >
                          <Button variant="actionRead" size="icon" onClick={() => openView(a)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="actionUpdate" size="icon" onClick={() => openEdit(a)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <ConfirmDialog
                            title="Xác nhận xóa"
                            description={
                              <>
                                Bạn có chắc chắn muốn xóa automation{' '}
                                <span className="font-semibold">{a.name}</span>?
                              </>
                            }
                            confirmText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => handleDelete(a.id)}
                          >
                            <Button variant="actionDelete" size="icon">
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
        )}

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
            view: `Chi tiết Automation - ${modal.automation?.name || ''}`,
            edit: modal.automation ? `Chỉnh sửa Automation - ${modal.automation.name}` : 'Tạo Automation mới',
          }}
          mode={modal.mode}
          FormComponent={(props) => (
            <AutomationForm
              {...props}
              mode={modal.mode}
              data={modal.automation}
              onSave={handleSave}
              onDelete={() => handleDelete(modal.automation?.id)}
              onClose={closeModal}
            />
          )}
          data={modal.automation}
          onSave={handleSave}
          onDelete={() => handleDelete(modal.automation?.id)}
          maxWidth="sm:max-w-2xl"
        />
      </div>
    </div>
  );
}
