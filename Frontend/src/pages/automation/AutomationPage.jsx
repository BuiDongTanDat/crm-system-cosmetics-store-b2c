// ...existing code...
import React, { useState, useEffect } from 'react';
import { Search, Plus, Play, Pause, Mail, Settings, Users, Calendar, List, Square, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/common/DropdownOptions';
import AppDialog from '@/components/dialogs/AppDialog';
import AutomationForm from '@/pages/automation/components/AutomationForm';
import AutomationCard from '@/pages/automation/components/AutomationCard';
import AppPagination from '@/components/pagination/AppPagination';
import { mockAutomations } from '@/lib/data';
import { useNavigate } from 'react-router-dom'; // Nếu dùng react-router

export default function AutomationPage() {
  const [automations, setAutomations] = useState(mockAutomations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', automation: null });
  const [currentPage, setCurrentPage] = useState(1);
  const automationsPerPage = 6;

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
  const openEdit = (a) => setModal({ open: true, mode: 'edit', automation: a });
  const navigate = useNavigate(); // Nếu không dùng react-router, dùng window.location

  // Thay đổi nút tạo automation để chuyển hướng
  const openAdd = () => {
    navigate('/automation/create');
    // Nếu không dùng react-router: window.location.href = '/automation/create';
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
    } else if (modal.mode === 'edit') {
      // Update existing
      setAutomations(prev => prev.map(a => a.id === automationData.id ? { ...a, ...automationData } : a));
      setModal(prev => ({
        ...prev,
        mode: 'view',
        automation: { ...automationData }
      }));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa automation này?')) {
      setAutomations(prev => prev.filter(a => a.id !== id));
      closeModal();
    }
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
    active: automations.filter(a => a.status === 'active').length,
    paused: automations.filter(a => a.status === 'paused').length,
    draft: automations.filter(a => a.status === 'draft').length
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang chạy' },
    { value: 'paused', label: 'Tạm dừng' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'completed', label: 'Hoàn thành' }
  ];

  // Hiển thị trigger/action trên AutomationCard
  // Sửa AutomationCard truyền thêm prop trigger/action nếu có

  // Modal xem chi tiết: bổ sung các step/tab để xem toàn bộ nội dung
  const [detailStep, setDetailStep] = useState(1);
  const detailSteps = [
    { id: 1, label: 'Thông tin' },
    { id: 2, label: 'Trigger' },
    { id: 3, label: 'Action' },
    { id: 4, label: 'Lịch gửi' },
    { id: 5, label: 'Nội dung Email' }
  ];

  const renderAutomationDetail = (automation) => (
    <div>
      <div className="flex gap-2 mb-4">
        {detailSteps.map(step => (
          <Button
            key={step.id}
            variant={detailStep === step.id ? 'actionCreate' : 'outline'}
            onClick={() => setDetailStep(step.id)}
            className="text-xs"
          >
            {step.label}
          </Button>
        ))}
      </div>
      <div>
        {detailStep === 1 && (
          <div>
            <div className="mb-2"><strong>Tên:</strong> {automation.name}</div>
            <div className="mb-2"><strong>Mô tả:</strong> {automation.description}</div>
            <div className="mb-2"><strong>Trạng thái:</strong> {automation.status}</div>
            <div className="mb-2"><strong>Loại:</strong> {automation.type}</div>
            <div className="mb-2"><strong>Đối tượng:</strong> {automation.targetAudience}</div>
          </div>
        )}
        {detailStep === 2 && (
          <div>
            <strong>Trigger:</strong>
            <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(automation.trigger, null, 2)}</pre>
          </div>
        )}
        {detailStep === 3 && (
          <div>
            <strong>Action:</strong>
            <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(automation.action, null, 2)}</pre>
          </div>
        )}
        {detailStep === 4 && (
          <div>
            <strong>Lịch gửi:</strong>
            <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(automation.schedule, null, 2)}</pre>
          </div>
        )}
        {detailStep === 5 && (
          <div>
            <strong>Nội dung Email:</strong>
            <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(automation.emailContent, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className=" flex flex-col">
      {/* Sticky header: title + view toggles + search + status filter + actions */}
      <div className=" sticky top-[70px] flex-col items-center justify-between z-20  gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md">
         <div className="flex items-center justify-between mb-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              Automation Flow ({filtered.length})
            </h1>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'card' ? 'actionCreate' : 'actionNormal'}
                onClick={() => setViewMode('card')}
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'actionCreate' : 'actionNormal'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm automation..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 transition-all border-gray-200 bg-white/90"
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
              Tạo Automation flow mới
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Tổng số</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Play className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Đang chạy</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Pause className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Tạm dừng</p>
                <p className="text-2xl font-bold text-orange-600">{stats.paused}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Bản nháp</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable automations list */}
      <div className="flex-1 overflow-auto p-6">
        {/* Automations view */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6 duration-150 animate-fade-in group">
            {currentAutomations.map(automation => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onView={openView}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    {['Flow', 'Loại', 'Trạng thái', 'Tạo lúc', 'Tác vụ'].map(h => (
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
                      <td className="text-center text-sm">{a.status}</td>
                      <td className="text-center text-sm">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
                      <td className="text-center w-44">
                        <div className={`flex justify-center gap-1 ${hoveredRow === a.id ? 'opacity-100 animate-fade-in duration-200' : 'opacity-0 pointer-events-none'}`}>
                          <Button variant="actionRead" size="icon" onClick={() => openView(a)}><Eye className="w-4 h-4" /></Button>
                          <Button variant="actionUpdate" size="icon" onClick={() => openEdit(a)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="actionDelete" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4" /></Button>
                          {/* Quick status toggle */}
                          <Button
                            variant={a.status === 'active' ? 'actionNormal' : 'actionCreate'}
                            size="icon"
                            onClick={() => handleStatusChange(a.id, a.status === 'active' ? 'paused' : 'active')}
                          >
                            {a.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
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
            edit: modal.automation ? `Chỉnh sửa Automation - ${modal.automation.name}` : 'Tạo Automation flow mới'
          }}
          mode={modal.mode}
          FormComponent={modal.mode === 'view'
            ? (props) => <AutomationForm {...props} data={modal.automation} onDelete={handleDelete} onClose={closeModal} />
            : AutomationForm}
          data={modal.automation}
          onSave={handleSave}
          onDelete={handleDelete}
          maxWidth="sm:max-w-6xl"
        />
      </div>
    </div>
  );
}
// ...existing code...