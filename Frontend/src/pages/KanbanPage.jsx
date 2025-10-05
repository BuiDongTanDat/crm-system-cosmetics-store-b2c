import React, { useState, useEffect } from 'react';
import { Plus, Filter, Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import DealDialog from '@/components/dialogs/DealDialog';
import { kanbanColumns, kanbanCards } from '@/lib/data';

export default function KanbanPage() {
  const [cards, setCards] = useState(kanbanCards);
  const [columns, setColumns] = useState(kanbanColumns);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Update column counts
  useEffect(() => {
    const updatedColumns = columns.map(column => ({
      ...column,
      count: cards.filter(card => card.stage === column.id).length
    }));
    setColumns(updatedColumns);
  }, [cards]);

  // Calculate statistics
  const stats = {
    totalDeals: cards.length,
    totalValue: cards.reduce((sum, card) => sum + card.value, 0),
    conversionRate: cards.filter(card => card.stage === 'closed-won').length / Math.max(cards.length, 1) * 100,
    activeDeals: cards.filter(card => !['closed-won', 'closed-lost'].includes(card.stage)).length
  };

  // Handlers
  const handleCardView = (card) => {
    setModal({ open: true, mode: 'view', deal: card });
  };

  const handleCardEdit = (card) => {
    setModal({ open: true, mode: 'edit', deal: card });
  };

  const handleCreateDeal = () => {
    setModal({ open: true, mode: 'edit', deal: null });
  };

  const closeModal = () => {
    setModal({ open: false, mode: 'view', deal: null });
  };

  const handleCardDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa deal này?")) {
      setCards(prev => prev.filter(card => card.id !== id));
      closeModal();
    }
  };

  const handleSave = (dealData) => {
    if (dealData.id) {
      // Update existing
      setCards(prev => prev.map(card =>
        card.id === dealData.id ? { ...card, ...dealData } : card
      ));
    } else {
      // Create new
      const newDeal = {
        ...dealData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString().split('T')[0]
      };
      setCards(prev => [...prev, newDeal]);
    }
    console.log("Deal saved:", dealData);
  };

  const handleDrop = (cardId, newStage) => {
    setCards(prev => prev.map(card => 
      card.id === cardId 
        ? { ...card, stage: newStage, lastActivity: new Date().toISOString().split('T')[0] }
        : card
    ));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCardsByStage = (stageId) => {
    return cards.filter(card => card.stage === stageId);
  };

  return (
    <div className="p-6 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline B2C</h1>
        <div className="flex gap-3">
          <Button variant="actionNormal" className="gap-2">
            <Filter className="w-4 h-4" />
            Lọc
          </Button>
          <Button onClick={handleCreateDeal} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" />
            Thêm Deal
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số deals</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalDeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng giá trị</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tỷ lệ chuyển đổi</p>
              <p className="text-xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deals đang xử lý</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeDeals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: 'calc(100vh - 280px)' }}>
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <KanbanColumn
              column={column}
              cards={getCardsByStage(column.id)}
              onCardView={handleCardView}
              onCardEdit={handleCardEdit}
              onCardDelete={handleCardDelete}
              onDrop={handleDrop}
            />
          </div>
        ))}
      </div>

      {/* Deal Dialog */}
      <DealDialog
        modal={modal}
        closeModal={closeModal}
        handleSave={handleSave}
        handleDelete={handleCardDelete}
      />
    </div>
  );
}
