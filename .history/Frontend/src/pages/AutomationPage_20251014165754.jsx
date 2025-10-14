import React, { useState, useEffect } from 'react';
import { Search, Plus, Play, Pause, Mail, Settings, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppDialog from '@/components/dialogs/AppDialog';
import AutomationForm from '@/components/forms/AutomationForm';
import AutomationCard from '@/components/cards/AutomationCard';
import AppPagination from '@/components/pagination/AppPagination';
import { mockAutomations } from '@/lib/data';

export default function AutomationPage() {
  const [automations, setAutomations] = useState(mockAutomations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', automation: null });
  const [currentPage, setCurrentPage] = useState(1);
  const automationsPerPage = 6;

  // Filtered automations
  const filtered = automations.filter(a => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || a.name.toLowerCase().includes(term) || a.type.toLowerCase().includes(term);
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
  const openAdd = () => setModal({ open: true, mode: 'edit', automation: null });
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

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Email Automation ({filtered.length})
          </h1>
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
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang chạy</option>
            <option value="paused">Tạm dừng</option>
            <option value="draft">Bản nháp</option>
            <option value="completed">Hoàn thành</option>
          </select>

          {/* Add Automation */}
          <Button onClick={openAdd} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo Automation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

      {/* Automations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
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

      {/* Pagination */}
      <AppPagination
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        handleNext={handleNext}
        handlePrev={handlePrev}
      />

      {/* Modal */}
      <AppDialog
        open={modal.open}
        onClose={closeModal}
        title={{
          view: `Chi tiết Automation - ${modal.automation?.name || ''}`,
          edit: modal.automation ? `Chỉnh sửa Automation - ${modal.automation.name}` : 'Tạo Automation mới'
        }}
        mode={modal.mode}
        FormComponent={AutomationForm}
        data={modal.automation}
        onSave={handleSave}
        onDelete={handleDelete}
        maxWidth="sm:max-w-6xl"
      />
    </div>
  );
}
