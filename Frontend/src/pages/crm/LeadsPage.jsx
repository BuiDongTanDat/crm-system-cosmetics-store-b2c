import React, { useState, useEffect, useCallback } from 'react';
import { Target, Eye, Edit, Trash2, DollarSign, TrendingUp, Users, Filter, Plus } from 'lucide-react';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/pages/crm/components/DealForm';
import { kanbanCards as initialCards, kanbanColumns as initialColumns } from '@/lib/data';
import { formatCurrency, getPriorityColor, getPriorityLabel, getInitials, formatDate } from '@/utils/helper';
import DropdownOptions from '@/components/common/DropdownOptions';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import AppPagination from '@/components/pagination/AppPagination';
 
export default function LeadsPage() {
  // KanbanPage-like states
  const [cards, setCards] = useState(initialCards || []);
  const [columns, setColumns] = useState(initialColumns || []);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const dealsPerPage = 8;
  const [columnCounts, setColumnCounts] = useState({});
  const [prevStats, setPrevStats] = useState({ totalDeals: 0, totalValue: 0, conversionRate: 0, activeDeals: 0 });
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filterStage, setFilterStage] = useState('');
  const FILTER_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    ...columns.map(col => ({ value: col.id, label: col.title }))
  ];
 
  // reset page when filter changes
  useEffect(() => setCurrentPage(1), [filterStage, cards.length]);
 
  // Stats calculation (KanbanPage logic)
  const stats = {
    totalDeals: cards.length,
    totalValue: cards.reduce((s, c) => s + (c.value || 0), 0),
    conversionRate: (cards.filter(c => c.stage === 'closed-won').length / Math.max(cards.length, 1)) * 100,
    activeDeals: cards.filter(c => !['closed-won', 'closed-lost'].includes(c.stage)).length
  };

  // Animation control (KanbanPage logic)
  useEffect(() => {
    const t = setTimeout(() => setShouldAnimateStats(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const changed =
      prevStats.totalDeals !== stats.totalDeals ||
      prevStats.totalValue !== stats.totalValue ||
      prevStats.conversionRate !== stats.conversionRate ||
      prevStats.activeDeals !== stats.activeDeals;
    if (changed) {
      setShouldAnimateStats(true);
      const t = setTimeout(() => {
        setPrevStats(stats);
        setShouldAnimateStats(false);
      }, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  // Column count update (KanbanPage logic)
  useEffect(() => {
    const counts = {};
    columns.forEach(col => {
      counts[col.id] = cards.filter(card => card.stage === col.id).length;
    });
    setColumnCounts(counts);
  }, [cards, columns]);

  // Handlers (KanbanPage logic)
  const handleView = (deal) => setModal({ open: true, mode: 'view', deal });
  const handleEdit = (deal) => setModal({ open: true, mode: 'edit', deal });
  const handleCreate = () => setModal({ open: true, mode: 'edit', deal: null });
  const closeModal = () => setModal({ open: false, mode: 'view', deal: null });

  const handleSave = (dealData) => {
    if (dealData.id) {
      setCards(prev => prev.map(d => d.id === dealData.id ? { ...d, ...dealData, stage: dealData.status || dealData.stage } : d));
      setModal(prev => ({ ...prev, mode: 'view', deal: { ...dealData, stage: dealData.status || dealData.stage } }));
      toast.success('Cập nhật deal thành công!');
    } else {
      const newDeal = {
        ...dealData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString().split('T')[0],
        stage: dealData.status || dealData.stage || 'leads',
        status: dealData.status || dealData.stage || 'leads'
      };
      setCards(prev => [...prev, newDeal]);
      closeModal();
      toast.success('Thêm deal thành công!');
    }
  };

  const handleDelete = (id) => {
    // actual deletion executed after confirm in ConfirmDialog where used
    setCards(prev => prev.filter(d => d.id !== id));
    closeModal();
    toast.success("Xóa deal thành công!");
  };


  // Status badge helper
  const getStatusBadge = (stage) => {
    const col = columns.find(c => c.id === stage);
    if (!col) return <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs">-</span>;
    // Lấy màu bg-100 tương ứng từ col.color, text màu theo trạng thái
    let textColor = 'text-gray-700';
    switch (col.id) {
      case 'leads':
        textColor = 'text-blue-700';
        break;
      case 'contacted':
        textColor = 'text-yellow-700';
        break;
      case 'qualified':
        textColor = 'text-purple-700';
        break;
      case 'nurturing ':
        textColor = 'text-orange-700';
        break;
      case 'converted':
        textColor = 'text-green-700';
        break;
      case 'closed-lost':
        textColor = 'text-red-700';
        break;
      default:
        textColor = 'text-gray-700';
    }
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full w-[90px] text-center inline-block ${col.color} ${textColor}`}
      >
        {col.title}
      </span>
    );
  };

  // Filtered cards by stage
  const filteredCards = filterStage
    ? cards.filter(card => (card.stage || card.status) === filterStage)
    : cards;
 
  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / dealsPerPage));
  const currentCards = filteredCards.slice(
    (currentPage - 1) * dealsPerPage,
    currentPage * dealsPerPage
  );
  const handlePageChange = (p) => setCurrentPage(p);
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
 
  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-[70px] z-20 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <div className="flex items-center gap-3 mb-2 justify-between">
          <h1 className="text-xl font-bold text-gray-900">Khách hàng tiềm năng</h1>
          <div className="flex gap-3">
            <DropdownOptions
              options={FILTER_OPTIONS}
              value={filterStage}
              onChange={setFilterStage}
              width="w-44"
              placeholder="Lọc trạng thái"
            />
            <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
              <Plus className="w-4 h-4" /> Thêm Deal
            </Button>
          </div>
        </div>
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Tổng Lead</p>
                {shouldAnimateStats ? (
                  <CountUp end={stats.totalDeals} start={prevStats.totalDeals} duration={0.5} className="text-lg font-bold text-gray-900" />
                ) : (
                  <p className="text-lg font-bold text-gray-900">{stats.totalDeals}</p>
                )}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Tổng giá trị</p>
                {shouldAnimateStats ? (
                  <CountUp end={stats.totalValue} start={prevStats.totalValue} duration={0.6}
                    formattingFn={(value) => formatCurrency(Math.floor(value))}
                    className="text-sm font-bold text-gray-900" />
                ) : (
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                )}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Tỷ lệ chuyển đổi</p>
                {shouldAnimateStats ? (
                  <CountUp end={stats.conversionRate} start={prevStats.conversionRate} decimals={1} suffix="%" duration={0.6} className="text-lg font-bold text-gray-900" />
                ) : (
                  <p className="text-lg font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                )}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Deals đang xử lý</p>
                {shouldAnimateStats ? (
                  <CountUp end={stats.activeDeals} start={prevStats.activeDeals} duration={0.6} className="text-lg font-bold text-gray-900" />
                ) : (
                  <p className="text-lg font-bold text-gray-900">{stats.activeDeals}</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Scrollable content: deals list and dialog */}
      <div className="flex-1  pt-4">
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoạt động cuối</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentCards.map(card => (
                  <tr
                    key={card.id}
                    className="group hover:bg-gray-50 transition-colors"
                    onMouseEnter={() => setHoveredRow(card.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >

                    <td className="px-6 py-2 text-sm font-medium text-gray-900 truncate">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full w-[80px] text-center inline-block ${getPriorityColor(card.priority)}`}>
                          {getPriorityLabel(card.priority)}
                        </span>
                        {card.title}
                      </div>


                    </td>
                    <td className="px-6 py-2 text-sm text-gray-700 truncate">{card.customer}</td>
                    <td className="px-6 py-2 text-sm text-emerald-600 font-semibold">{formatCurrency(card.value || 0)}</td>
                    <td className="px-6 py-2">

                      <span className="truncate max-w-20 text-xs">{card.assignee}</span>

                    </td>

                    <td className="px-6 py-2 text-xs text-gray-500">{formatDate(card.lastActivity) || '-'}</td>
                    <td className="px-6 py-2">
                      {getStatusBadge(card.stage)}
                    </td>
                    <td className="px-6 py-2 text-center w-36">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transform group-hover:-translate-y-1 transition-all duration-200">
                        <Button variant="actionRead" size="icon" onClick={() => handleView(card)} className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        <Button variant="actionUpdate" size="icon" onClick={() => handleEdit(card)} className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        <ConfirmDialog
                          title="Xác nhận xóa"
                          description={<>Bạn có chắc chắn muốn xóa deal <span className="font-semibold">{card.title}</span>?</>}
                          confirmText="Xóa"
                          cancelText="Hủy"
                          onConfirm={() => handleDelete(card.id)}
                        >
                          <Button variant="actionDelete" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </td>

                  </tr>
                ))}
                {filteredCards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">Không có deal nào.</td>
                  </tr>
                )}
               </tbody>
             </table>
           </div>
         </div>
 
         {/* Pagination */}
         <div className="mt-4">
           <AppPagination
             totalPages={totalPages}
             currentPage={currentPage}
             handleNext={handleNext}
             handlePrev={handlePrev}
             handlePageChange={handlePageChange}
           />
         </div>
       </div>
 
      {/* Dialog */}
      <AppDialog
        open={modal.open}
        onClose={closeModal}
        title={{
          view: `Chi tiết deal - ${modal.deal?.title || ''}`,
          edit: modal.deal ? `Chỉnh sửa deal - ${modal.deal.title}` : 'Thêm deal mới'
        }}
        mode={modal.mode}
        FormComponent={DealForm}
        data={modal.deal}
        onSave={handleSave}
        onDelete={handleDelete}
        maxWidth="sm:max-w-3xl"
      />
    </div>
  );
}