// ...existing code...
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, List, Square, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingCard from '@/pages/marketing/components/MarketingCard';
import AppDialog from '@/components/dialogs/AppDialog';
import MarketingForm from '@/pages/marketing/components/MarketingForm';
import AppPagination from '@/components/pagination/AppPagination';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { mockCampaigns } from '@/lib/data';
import DropdownOptions from '@/components/common/DropdownOptions';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', campaign: null });
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 6;

  // view mode (card | list)
  const [viewMode, setViewMode] = useState('card');
  const [hoveredRow, setHoveredRow] = useState(null);

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

  // Dropdown options for campaign types
  const CAMPAIGN_TYPE_OPTIONS = [
    { value: 'all', label: 'Loại chiến dịch' },
    { value: 'Email', label: 'Email' },
    { value: 'Social', label: 'Social' },
    { value: 'Paid', label: 'Paid' },
  ];

  // Filtered campaigns
  const filtered = campaigns.filter(c => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || (c.name || '').toLowerCase().includes(term) || (c.type || '').toLowerCase().includes(term);
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
    <div className="h-screen flex flex-col">
      {/* Sticky header: two-row (title/actions) like ProductPage */}
      <div
        className="sticky top-[70px] z-20 flex flex-col gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md"
        style={{ backdropFilter: 'blur' }}
      >
        {/* First row: title (left) and search/add/import (right) */}
        <div className="flex items-center justify-between">
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
                className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 transition-all border-gray-200 bg-white/90"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <Button onClick={openAdd} variant="actionCreate" className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm chiến dịch
            </Button>

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

        {/* Second row: view toggles (left) and filters/actions (right) */}
        <div className="flex items-center justify-between">
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

          <div className="flex items-center gap-3">
            {/* Keep existing filter button (you can replace with a dropdown later) */}
            <Button variant="actionNormal" className="gap-2">
              <Filter className="w-5 h-5" />
              Lọc
            </Button>

            {/* Type selector using DropdownOptions */}
            <DropdownOptions
              options={CAMPAIGN_TYPE_OPTIONS}
              value={selectedType}
              onChange={(val) => setSelectedType(val)}
              width="w-40"
              placeholder="Loại chiến dịch"
            />
          </div>
        </div>
      </div>

      {/* Scrollable content: campaigns list/cards, pagination, dialog */}
      <div className="flex-1 overflow-auto p-6">
        {/* View modes */}
        {viewMode === 'card' ? (
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
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    {['Chiến dịch', 'Loại', 'Ngân sách', 'Thời gian', 'Trạng thái', 'Người phụ trách', ''].map(h => (
                      <th key={h} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCampaigns.map(c => (
                    <tr
                      key={c.id}
                      onMouseEnter={() => setHoveredRow(c.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="flex items-center">
                          <div className="font-medium text-gray-900 truncate max-w-[220px]">{c.name}</div>
                          <div className="text-xs text-gray-500 ml-3 truncate max-w-[220px]">{c.targetAudience}</div>
                        </div>
                      </td>
                      <td className="text-center text-sm text-gray-800">{c.type}</td>
                      <td className="text-center font-semibold">{c.budget ? Number(c.budget).toLocaleString('vi-VN') + '₫' : '-'}</td>
                      <td className="text-center text-sm text-gray-700">
                        {c.startDate ? c.startDate : '-'}{c.endDate ? ` → ${c.endDate}` : ''}
                      </td>
                      <td className="text-center text-sm">{c.status || 'Draft'}</td>
                      <td className="text-center text-sm">{c.assignee || '-'}</td>
                      <td className="text-center w-36">
                        <div
                          className={`flex justify-center gap-1 ${hoveredRow === c.id ? 'opacity-100 animate-fade-in duration-200' : 'opacity-0 pointer-events-none'}`}
                        >
                          <Button variant="actionRead" size="icon" onClick={() => openView(c)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="actionUpdate" size="icon" onClick={() => openEdit(c)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="actionDelete" size="icon" onClick={() => handleDelete(c.id)}>
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
        )}

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
    </div>
  );
}
// ...existing code...