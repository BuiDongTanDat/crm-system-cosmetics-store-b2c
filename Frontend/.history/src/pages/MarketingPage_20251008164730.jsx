import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingCard from '@/components/cards/MarketingCard';
import AppDialog from '@/components/dialogs/AppDialog';
import MarketingForm from '@/components/forms/MarketingForm';
import AppPagination from '@/components/pagination/AppPagination';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { mockCampaigns } from '@/lib/data';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', campaign: null });
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 6;

  // Field mapping for CSV export/import
  const campaignFieldMapping = {
    name: 'Tên chiến dịch',
    type: 'Loại chiến dịch',
    budget: 'Ngân sách',
    startDate: 'Ngày bắt đầu',
    endDate: 'Ngày kết thúc',
    targetAudience: 'Đối tượng mục tiêu',
    dataSource: 'Nguồn dữ liệu',
    status: 'Trạng thái',
    assignee: 'Người phụ trách',
    expectedKPI: 'KPI mong đợi'
  };

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

  // Updated import handler for CSV
  const handleImportSuccess = (importedData) => {
    try {
      const processedCampaigns = importedData.map((item, index) => ({
        id: Math.max(...campaigns.map(c => c.id), 0) + index + 1,
        name: item['Tên chiến dịch'] || item.name || 'Untitled',
        type: item['Loại chiến dịch'] || item.type || 'Email',
        budget: parseFloat(item['Ngân sách'] || item.budget || 0),
        startDate: item['Ngày bắt đầu'] || item.startDate || '',
        endDate: item['Ngày kết thúc'] || item.endDate || '',
        targetAudience: item['Đối tượng mục tiêu'] || item.targetAudience || '',
        dataSource: item['Nguồn dữ liệu'] || item.dataSource || 'Customers',
        status: item['Trạng thái'] || item.status || 'Draft',
        assignee: item['Người phụ trách'] || item.assignee || '',
        assigneeId: item.assigneeId || 1,
        expectedKPI: item['KPI mong đợi'] || item.expectedKPI || '',
        performance: item.performance || null
      }));

      setCampaigns(prev => [...prev, ...processedCampaigns]);
      alert(`Đã nhập thành công ${processedCampaigns.length} chiến dịch!`);
    } catch (error) {
      console.error('Lỗi xử lý dữ liệu nhập:', error);
      alert('Có lỗi xảy ra khi xử lý dữ liệu nhập');
    }
  };

  const handleImportError = (errorMessage) => {
    alert(`Lỗi nhập file: ${errorMessage}`);
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

          {/* Import/Export Dropdown */}
          <ImportExportDropdown
            data={campaigns}
            filename="campaigns"
            fieldMapping={campaignFieldMapping}
            onImportSuccess={handleImportSuccess}
            onImportError={handleImportError}
            trigger="icon"
            variant="actionNormal"
          />
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