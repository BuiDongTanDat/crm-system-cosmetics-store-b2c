import React, { useState, useEffect, useRef } from 'react';
import { Plus, Filter, Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/components/forms/DealForm';
import CountUp from 'react-countup';
import { kanbanColumns, kanbanCards } from '@/lib/data';

export default function KanbanPage() {
  const [cards, setCards] = useState(kanbanCards);
  const [columns, setColumns] = useState(kanbanColumns);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const kanbanBoardRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  // Update column counts
  useEffect(() => {
    const updatedColumns = columns.map(column => ({
      ...column,
      count: cards.filter(card => card.stage === column.id).length
    }));
    setColumns(updatedColumns);
  }, [cards]);

  // Handle initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
      setShouldAnimateStats(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Improved auto-scroll functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !kanbanBoardRef.current) return;

      const board = kanbanBoardRef.current;
      const boardRect = board.getBoundingClientRect();
      const scrollThreshold = 150; // Increased threshold for easier triggering
      const scrollSpeed = 15; // Increased speed for better UX

      // Clear existing scroll interval
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      const mouseX = e.clientX;
      const isWithinBoard = mouseX >= boardRect.left && mouseX <= boardRect.right;

      if (!isWithinBoard) return;

      // Check if mouse is near left edge
      if (mouseX - boardRect.left < scrollThreshold && board.scrollLeft > 0) {
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft -= scrollSpeed;
          if (board.scrollLeft <= 0) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }, 16); // ~60fps
      }
      // Check if mouse is near right edge
      else if (boardRect.right - mouseX < scrollThreshold && 
               board.scrollLeft < board.scrollWidth - board.clientWidth) {
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft += scrollSpeed;
          if (board.scrollLeft >= board.scrollWidth - board.clientWidth) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }, 16); // ~60fps
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };

    if (isDragging) {
      document.addEventListener('dragover', handleMouseMove);
      document.addEventListener('dragend', handleDragEnd);
      document.addEventListener('drop', handleDragEnd);
    }

    return () => {
      document.removeEventListener('dragover', handleMouseMove);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isDragging]);

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

  const handleSave = (dealData) => {
    // Enable animation for new deals or updates
    setShouldAnimateStats(true);
    
    if (dealData.id) {
      // Update existing
      setCards(prev => prev.map(card =>
        card.id === dealData.id ? { 
          ...card, 
          ...dealData,
          stage: dealData.status || dealData.stage // Ensure stage matches status
        } : card
      ));
      
      // Cập nhật dữ liệu trong modal và chuyển về view mode
      setModal(prev => ({
        ...prev,
        mode: 'view', // Chuyển về view mode
        deal: { ...dealData, stage: dealData.status || dealData.stage }
      }));
    } else {
      // Create new
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

    // Reset animation flag after animation completes
    setTimeout(() => setShouldAnimateStats(false), 1200);
    console.log("Deal saved:", dealData);
  };

  const handleCardDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa deal này?")) {
      setShouldAnimateStats(true);
      setCards(prev => prev.filter(card => card.id !== id));
      closeModal();
      
      // Reset animation flag after animation completes
      setTimeout(() => setShouldAnimateStats(false), 1200);
    }
  };

  const handleDrop = (cardId, newStage) => {
    // Don't animate when just moving cards between columns
    setCards(prev => prev.map(card => 
      card.id === cardId 
        ? { 
            ...card, 
            stage: newStage, 
            status: newStage, // Update status to match stage
            lastActivity: new Date().toISOString().split('T')[0] 
          }
        : card
    ));
    setIsDragging(false);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCardsByStage = (stageId) => {
    return cards.filter(card => (card.status || card.stage) === stageId);
  };

  return (
    <div className="p-0 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Statistics with conditional animation */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tổng số deals</p>
              {shouldAnimateStats ? (
                <CountUp 
                  end={stats.totalDeals}
                  duration={0.5}
                  className="text-lg font-bold text-gray-900"
                />
              ) : (
                <p className="text-lg font-bold text-gray-900">{stats.totalDeals}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tổng giá trị</p>
              {shouldAnimateStats ? (
                <CountUp 
                  end={stats.totalValue}
                  duration={0.5}
                  formattingFn={(value) => formatCurrency(Math.floor(value))}
                  className="text-sm font-bold text-gray-900"
                />
              ) : (
                <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tỷ lệ chuyển đổi</p>
              {shouldAnimateStats ? (
                <CountUp 
                  end={stats.conversionRate}
                  decimals={1}
                  suffix="%"
                  duration={0.5}
                  className="text-lg font-bold text-gray-900"
                />
              ) : (
                <p className="text-lg font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Deals đang xử lý</p>
              {shouldAnimateStats ? (
                <CountUp 
                  end={stats.activeDeals}
                  duration={0.6}
                  className="text-lg font-bold text-gray-900"
                />
              ) : (
                <p className="text-lg font-bold text-gray-900">{stats.activeDeals}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div 
        ref={kanbanBoardRef}
        data-kanban-board
        className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth" 
        style={{ 
          height: 'calc(100vh - 200px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9' 
        }}
      >
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-64">
            <KanbanColumn
              column={column}
              cards={getCardsByStage(column.id)}
              onCardView={handleCardView}
              onCardEdit={handleCardEdit}
              onCardDelete={handleCardDelete}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              shouldAnimate={isInitialLoad}
            />
          </div>
        ))}
      </div>

      {/* Deal Dialog */}
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
        onDelete={handleCardDelete}
        maxWidth="sm:max-w-3xl"
      />
    </div>
  );
}
