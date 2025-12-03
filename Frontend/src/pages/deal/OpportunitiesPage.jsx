import React, { useState, useEffect } from 'react';
import { Handshake, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/pages/deal/components/DealForm';
import { kanbanCards as initialCards } from '@/lib/data';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);

export default function OpportunitiesPage() {
  const [allCards, setAllCards] = useState(initialCards || []);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [prevStats, setPrevStats] = useState({ totalDeals: 0, totalValue: 0, conversionRate: 0, activeDeals: 0 });
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShouldAnimateStats(false), 800);
    return () => clearTimeout(t);
  }, []);

  // filtered closed deals
  const cards = allCards.filter(c => ['closed-won', 'closed-lost'].includes(c.stage));

  const stats = {
    totalDeals: cards.length,
    totalValue: cards.reduce((s, c) => s + (c.value || 0), 0),
    conversionRate: (cards.filter(c => c.stage === 'closed-won').length / Math.max(cards.length, 1)) * 100,
    activeDeals: cards.filter(c => !['closed-won', 'closed-lost'].includes(c.stage)).length
  };

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

  const handleView = (deal) => setModal({ open: true, mode: 'view', deal });
  const handleEdit = (deal) => setModal({ open: true, mode: 'edit', deal });
  const handleCreate = () => setModal({ open: true, mode: 'edit', deal: null });
  const closeModal = () => setModal({ open: false, mode: 'view', deal: null });

  const handleSave = (dealData) => {
    if (dealData.id) {
      setAllCards(prev => prev.map(d => d.id === dealData.id ? { ...d, ...dealData, stage: dealData.status || dealData.stage } : d));
      setModal(prev => ({ ...prev, mode: 'view', deal: { ...dealData, stage: dealData.status || dealData.stage } }));
    } else {
      const newDeal = {
        ...dealData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString().split('T')[0],
        stage: dealData.status || dealData.stage || 'leads',
        status: dealData.status || dealData.stage || 'leads'
      };
      setAllCards(prev => [...prev, newDeal]);
      closeModal();
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa deal này?")) {
      setAllCards(prev => prev.filter(d => d.id !== id));
      closeModal();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky top: header + action buttons + stats */}
      <div className=" sticky top-[70px] flex-col items-center justify-between z-20  gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <div className="flex items-center justify-between mb-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Handshake className="w-8 h-8 text-brand" />
            <h1 className="text-xl font-bold text-gray-900">Cơ hội bán hàng</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="actionNormal" className="gap-2"><Filter className="w-4 h-4" /> Lọc</Button>
            <Button onClick={handleCreate} variant="actionCreate" className="gap-2"><Plus className="w-4 h-4" /> Thêm</Button>
          </div>
        </div>

        {/* Stats area */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Tổng cơ hội</p>
            {shouldAnimateStats ? (
              <CountUp end={stats.totalDeals} start={prevStats.totalDeals} duration={0.5} className="text-lg font-bold text-gray-900" />
            ) : (
              <p className="text-lg font-bold text-gray-900">{stats.totalDeals}</p>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Tổng giá trị</p>
            {shouldAnimateStats ? (
              <CountUp end={stats.totalValue} start={prevStats.totalValue} duration={0.6}
                formattingFn={(value) => formatCurrency(Math.floor(value))}
                className="text-sm font-bold text-gray-900" />
            ) : (
              <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Tỷ lệ thành công</p>
            {shouldAnimateStats ? (
              <CountUp end={stats.conversionRate} start={prevStats.conversionRate} decimals={1} suffix="%" duration={0.6} className="text-lg font-bold text-gray-900" />
            ) : (
              <p className="text-lg font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Deals closed</p>
            {shouldAnimateStats ? (
              <CountUp end={stats.totalDeals} start={prevStats.totalDeals} duration={0.6} className="text-lg font-bold text-gray-900" />
            ) : (
              <p className="text-lg font-bold text-gray-900">{stats.totalDeals}</p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable list area */}
      <div className="flex-1 overflow-auto p-4">
        {/* List view */}
        <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border p-4 overflow-auto">
          <h2 className="text-xl font-semibold mb-4">Danh sách cơ hội (Converted / Lost)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  {["Tiêu đề", "Công ty", "Giá trị", "Giai đoạn", "Hoạt động cuối", ""].map(h => (
                    <th key={h} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cards.map(card => (
                  <tr
                    key={card.id}
                    className="group relative hover:bg-gray-50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredRow(card.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{card.title}</div>
                      <div className="text-xs text-gray-500">{card.contact || card.owner || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-center">{card.company || '-'}</td>
                    <td className="px-6 py-4 text-center">{formatCurrency(card.value || 0)}</td>
                    <td className="px-6 py-4 text-center capitalize">{card.stage || card.status}</td>
                    <td className="px-6 py-4 text-center">{card.lastActivity || card.createdDate || '-'}</td>
                    <td className="px-6 py-4 text-center w-36">
                      <div className={`flex justify-center gap-1 transition-all duration-200 ${hoveredRow === card.id ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"}`}>
                        <Button variant="actionRead" size="icon" onClick={() => handleView(card)} className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        <Button variant="actionUpdate" size="icon" onClick={() => handleEdit(card)} className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        <Button variant="actionDelete" size="icon" onClick={() => handleDelete(card.id)} className="h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog stays at root (AppDialog doesn't need to be inside scroller) */}
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