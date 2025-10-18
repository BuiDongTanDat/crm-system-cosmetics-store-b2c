import React, { useState, useEffect } from 'react';
import { Target, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/pages/crm/components/DealForm';
import { kanbanCards as initialCards } from '@/lib/data';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);

export default function LeadsPage() {
  const [cards, setCards] = useState(initialCards || []);
  const [prevStats, setPrevStats] = useState({ totalDeals: 0, totalValue: 0, conversionRate: 0, activeDeals: 0 });
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setShouldAnimateStats(false), 900);
    return () => clearTimeout(t);
  }, []);

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
      setCards(prev => prev.map(d => d.id === dealData.id ? { ...d, ...dealData, stage: dealData.status || dealData.stage } : d));
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
      setCards(prev => [...prev, newDeal]);
      closeModal();
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa deal này?")) {
      setCards(prev => prev.filter(d => d.id !== id));
      closeModal();
    }
  };

  return (
    <div className="p-0 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Khách hàng tiềm năng</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Quản lý Lead</h2>
        <p className="text-gray-600 mb-4">
          Theo dõi và quản lý các khách hàng tiềm năng từ nhiều nguồn khác nhau.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-cyan-50 p-4 rounded-lg">
            <h3 className="font-semibold text-cyan-900">Tổng Lead</h3>
            <p className="text-2xl font-bold text-cyan-700">456</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Lead mới</h3>
            <p className="text-2xl font-bold text-yellow-700">89</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Đang liên hệ</h3>
            <p className="text-2xl font-bold text-blue-700">234</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Chuyển đổi</h3>
            <p className="text-2xl font-bold text-green-700">133</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border p-4 mt-4 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Danh sách deals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
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