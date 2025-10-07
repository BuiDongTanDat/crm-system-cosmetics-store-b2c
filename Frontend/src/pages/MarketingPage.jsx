import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingCard from '@/components/cards/MarketingCard';
import AppDialog from '@/components/dialogs/AppDialog';
import MarketingForm from '@/components/forms/MarketingForm';
import AppPagination from '@/components/pagination/AppPagination';
import { mockCampaigns } from '@/lib/data';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', campaign: null });
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 6;
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Filtered campaigns
  const filtered = campaigns.filter(c => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || c.name.toLowerCase().includes(term) || c.type.toLowerCase().includes(term);
    const matchesType = selectedType === 'all' || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Pagination
  useEffect(() => setCurrentPage(1), [searchTerm, selectedType]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / campaignsPerPage));
  const indexOfLast = currentPage * campaignsPerPage;
  const indexOfFirst = indexOfLast - campaignsPerPage;
  const currentCampaigns = filtered.slice(indexOfFirst, indexOfLast);

  // Handlers
  const openView = (c) => setModal({ open: true, mode: 'view', campaign: c });
  const openEdit = (c) => setModal({ open: true, mode: 'edit', campaign: c });
  const openAdd = () => setModal({ open: true, mode: 'edit', campaign: null });
  const closeModal = () => setModal({ open: false, mode: 'view', campaign: null });

  const handleSave = (campaignData) => {
    if (modal.mode === 'edit' && !campaignData.id) {
      // Create new
      const newCampaign = { 
        ...campaignData, 
        id: Math.max(...campaigns.map(c => c.id)) + 1,
        performance: null
      };
      setCampaigns(prev => [newCampaign, ...prev]);
      closeModal();
    } else if (modal.mode === 'edit') {
      // Update existing
      setCampaigns(prev => prev.map(c => c.id === campaignData.id ? { ...c, ...campaignData } : c));
      
      // Cập nhật dữ liệu trong modal và chuyển về view mode
      setModal(prev => ({
        ...prev,
        mode: 'view', // Chuyển về view mode
        campaign: { ...campaignData }
      }));
    }
    console.log("Campaign saved:", campaignData);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa chiến dịch này?')) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      closeModal();
    }
  };

  // Import/Export
  const exportCampaigns = () => {
    const blob = new Blob([JSON.stringify(campaigns, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns.json';
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const importCampaigns = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (Array.isArray(json)) {
          setCampaigns(json.map((item, i) => ({ 
            id: item.id || Date.now() + i, 
            name: item.name || 'Untitled',
            type: item.type || 'Email',
            budget: item.budget || 0,
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            targetAudience: item.targetAudience || '',
            dataSource: item.dataSource || 'Customers',
            status: item.status || 'Draft',
            assignee: item.assignee || '',
            assigneeId: item.assigneeId || 1,
            expectedKPI: item.expectedKPI || '',
            performance: item.performance || null
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

  // Pagination handlers
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Chiến dịch Marketing ({filtered.length})
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
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <Button variant="actionNormal" className="gap-2">
            <Filter className="w-5 h-5" />
            Lọc
          </Button>

          {/* Add Campaign */}
          <Button onClick={openAdd} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" />
            Thêm chiến dịch
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
                  onClick={exportCampaigns}
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
              onChange={(e) => importCampaigns(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      {/* Campaigns grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {currentCampaigns.map(campaign => (
          <MarketingCard
            key={campaign.id}
            campaign={campaign}
            onView={openView}
            onEdit={openEdit}
            onDelete={handleDelete}
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
          view: `Chi tiết chiến dịch - ${modal.campaign?.name || ''}`,
          edit: modal.campaign ? `Chỉnh sửa chiến dịch - ${modal.campaign.name}` : 'Thêm chiến dịch mới'
        }}
        mode={modal.mode}
        FormComponent={MarketingForm}
        data={modal.campaign}
        onSave={handleSave}
        onDelete={handleDelete}
        maxWidth="sm:max-w-4xl"
      />
    </div>
  );
}