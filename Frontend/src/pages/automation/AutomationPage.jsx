import React, { useState, useEffect } from 'react';
import { Search, Plus, Play, Pause, Mail, Settings, Users, Calendar, List, Square, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/common/DropdownOptions';
import AppDialog from '@/components/dialogs/AppDialog';
import AutomationForm from '@/pages/automation/components/AutomationForm';
import AutomationCard from '@/pages/automation/components/AutomationCard';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import AppPagination from '@/components/pagination/AppPagination';
import { mockAutomations, triggerOptions, actionOptions } from '@/lib/data';
import { useNavigate } from 'react-router-dom'; // Nếu dùng react-router
import { formatDate } from '@/utils/helper';
import { Input } from '@/components/ui/input';

export default function AutomationPage() {
  const [automations, setAutomations] = useState(mockAutomations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', automation: null });
  const [currentPage, setCurrentPage] = useState(1);
  const automationsPerPage = 3;

  // view mode (card | list)
  const [viewMode, setViewMode] = useState('card');
  const [hoveredRow, setHoveredRow] = useState(null);

  // Filtered automations
  const filtered = automations.filter(a => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || (a.name || '').toLowerCase().includes(term) || (a.type || '').toLowerCase().includes(term);
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
  const navigate = useNavigate();

  // Thay đổi nút tạo automation để chuyển hướng
  const openAdd = () => {
    navigate('/automation/flow/new');
  };

  // Khi bấm Edit, chuyển hướng sang FlowEditorPage với id
  const openEdit = (a) => {
    navigate(`/automation/flow/${a.flow_id}`);
  };

  const closeModal = () => setModal({ open: false, mode: 'view', automation: null });

  const handleSave = (automationData) => {
    if (modal.mode === 'edit' && !automationData.id) {
      // Create new
      const newAutomation = {
        ...automationData,
        id: Math.max(...automations.map(a => a.id)) + 1,
        createdAt: new Date().toISOString(),
        stats: { sent: 0, opened: 0, clicked: 0, bounced: 0 }
      };
      setAutomations(prev => [newAutomation, ...prev]);
      closeModal();
      toast.success('Thêm automation thành công!');
    } else if (modal.mode === 'edit') {
      // Update existing
      setAutomations(prev => prev.map(a => a.id === automationData.id ? { ...a, ...automationData } : a));
      setModal(prev => ({
        ...prev,
        mode: 'view',
        automation: { ...automationData }
      }));
      toast.success('Cập nhật automation thành công!');
    }
  };

  const handleDelete = (id) => {
    // deletion executed after ConfirmDialog confirm
    setAutomations(prev => prev.filter(a => a.id !== id));
    closeModal();
    toast.success('Xóa automation thành công!');
  };

  const handleStatusChange = (id, newStatus) => {
    setAutomations(prev => prev.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    ));
  };

  // Pagination handlers
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  // Stats
  const stats = {
    total: automations.length,
    active: automations.filter(a => a.status === 'ACTIVE').length,
    paused: automations.filter(a => a.status === 'INACTIVE').length,
    draft: automations.filter(a => a.status === 'DRAFT').length
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Đang chạy' },
    { value: 'DRAFT', label: 'Bản nháp' },
    { value: 'INACTIVE', label: 'Ngưng hoạt động' }
  ];


  const getStatusBadge = (status) => {
    let color = 'bg-gray-100 text-gray-700';
    let text = status ? status : 'UNDEFINED';
    if (status === 'ACTIVE') {
      color = 'bg-green-100 text-green-700';
    } else if (status === 'DRAFT') {
      color = 'bg-gray-100 text-gray-700';
    } else if (status === 'INACTIVE') {
      color = 'bg-red-100 text-red-700';
    }
    return (
      <span className={`inline-block px-1 py-1 rounded-full w-[80px] text-center text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="flex flex-col  min-h-screen">
      {/* Sticky header: title + view toggles + search + status filter + actions */}
      <div
        className="sticky top-[70px] z-20 flex flex-col gap-3 px-6 py-3 bg-brand/10 rounded-md mb-4 w-full"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        <div className="flex items-center justify-between mb-4">
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
              <Input
                type="text"
                placeholder="Tìm kiếm automation..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
      <div className="flex-1 overflow-auto pt-6 px-6">
        {/* Automations view */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {currentAutomations.map(automation => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onView={openView}
                onEdit={openEdit} //Hàm edit chỗ này sẽ chuyển trang nha
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
                    {['Tên Flow', 'Loại', 'Tags', 'Người tạo', 'Triggers', 'Actions', 'Tạo lúc', 'Trạng thái', 'Kích hoạt', 'Tác vụ'].map(h => (
                      <th key={h} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAutomations.map(a => (
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
                      <td className="text-center text-sm text-gray-800">{a.type}</td>
                      <td className="text-center text-xs">{(a.tags || []).join(', ')}</td>
                      <td className="text-center text-xs">{a.created_by}</td>
                      <td className="text-center text-xs">{a.triggers?.length || 0}</td>
                      <td className="text-center text-xs">{a.actions?.length || 0}</td>
                      <td className="text-center text-sm">{a.created_at ? formatDate(a.created_at) : '-'}</td>
                      <td className="text-center text-sm">
                        {getStatusBadge(a.status)}
                      </td>
                      <td className="text-center text-sm">
                        <Button
                          variant={a.status === 'active' ? 'actionUpdate' : 'actionCreate'}
                          size="sm"
                          onClick={() =>
                            handleStatusChange(a.id, a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                          }
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          {a.status === 'ACTIVE' ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span className=" font-medium">Tạm dừng</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 " />
                              <span className=" font-medium">Kích hoạt</span>
                            </>
                          )}
                        </Button>
                      </td>


                      <td className="text-center w-44">
                        <div className={`flex justify-center gap-1 transition-opacity duration-200 ${hoveredRow === a.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          <Button variant="actionRead" size="icon" onClick={() => openView(a)}><Eye className="w-4 h-4" /></Button>
                          <Button variant="actionUpdate" size="icon" onClick={() => openEdit(a)}><Edit className="w-4 h-4" /></Button>
                          <ConfirmDialog
                            title="Xác nhận xóa"
                            description={<>Bạn có chắc chắn muốn xóa automation <span className="font-semibold">{a.name}</span>?</>}
                            confirmText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => handleDelete(a.id)}
                          >
                            <Button variant="actionDelete" size="icon"><Trash2 className="w-4 h-4" /></Button>
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
          handlePageChange={handlePageChange}
          handleNext={handleNext}
          handlePrev={handlePrev}
        />

        <AppDialog
          open={modal.open}
          onClose={closeModal}
          title={{
            view: `Chi tiết Automation - ${modal.automation?.name || ''}`,
            edit: modal.automation ? `Chỉnh sửa Automation - ${modal.automation.name}` : 'Tạo Automation mới'
          }}
          mode={modal.mode}
          FormComponent={(props) => (
            <AutomationForm
              {...props}
              mode={modal.mode}
              data={modal.automation}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={closeModal}
            />
          )}
          data={modal.automation}
          onSave={handleSave}
          onDelete={handleDelete}
          maxWidth="sm:max-w-2xl"
        />
      </div>
    </div>
  );
}