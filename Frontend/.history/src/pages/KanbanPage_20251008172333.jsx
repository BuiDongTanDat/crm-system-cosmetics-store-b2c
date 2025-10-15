import React, { useState, useEffect, useRef } from 'react';
import { Plus, Filter, Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/components/forms/DealForm';
import CountUp from 'react-countup';
import { kanbanColumns as initialColumns, kanbanCards as initialCards } from '@/lib/data';

export default function KanbanPage() {
  const [cards, setCards] = useState(initialCards);
  const [columns, setColumns] = useState(initialColumns);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);
  const [prevStats, setPrevStats] = useState({ totalDeals: 0, totalValue: 0, conversionRate: 0, activeDeals: 0 });
  const [animatedColumns, setAnimatedColumns] = useState({}); // { colId: {startCount,endCount,startTotal,endTotal} }

  const kanbanBoardRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const resetTimersRef = useRef({}); // store timers per column to avoid duplicates
  const isInitialLoadRef = useRef(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      isInitialLoadRef.current = false;
      setIsInitialLoad(false);
      setShouldAnimateStats(false);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Calculate statistics
  const stats = {
    totalDeals: cards.length,
    totalValue: cards.reduce((sum, card) => sum + (card.value || 0), 0),
    conversionRate: (cards.filter(card => card.stage === 'closed-won').length / Math.max(cards.length, 1)) * 100,
    activeDeals: cards.filter(card => !['closed-won', 'closed-lost'].includes(card.stage)).length
  };

  // Smooth CountUp control (debounced updates)
  useEffect(() => {
    const hasChanged =
      prevStats.totalDeals !== stats.totalDeals ||
      prevStats.totalValue !== stats.totalValue ||
      prevStats.conversionRate !== stats.conversionRate ||
      prevStats.activeDeals !== stats.activeDeals;

    if (hasChanged) {
      setShouldAnimateStats(true);

      const updatePrev = setTimeout(() => {
        setPrevStats(stats);
        setShouldAnimateStats(false);
      }, 600);

      return () => clearTimeout(updatePrev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]); // intentionally not depending on prevStats

  // Update column counts
  useEffect(() => {
    const updatedColumns = columns.map(column => ({
      ...column,
      count: cards.filter(card => (card.status || card.stage) === column.id).length
    }));
    setColumns(updatedColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  // Auto-scroll while dragging (board)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !kanbanBoardRef.current) return;
      const board = kanbanBoardRef.current;
      const boardRect = board.getBoundingClientRect();
      const scrollThreshold = 150;
      const scrollSpeed = 15;

      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      const mouseX = e.clientX;
      const isWithinBoard = mouseX >= boardRect.left && mouseX <= boardRect.right;
      if (!isWithinBoard) return;

      if (mouseX - boardRect.left < scrollThreshold && board.scrollLeft > 0) {
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft -= scrollSpeed;
          if (board.scrollLeft <= 0) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }, 16);
      } else if (boardRect.right - mouseX < scrollThreshold && board.scrollLeft < board.scrollWidth - board.clientWidth) {
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft += scrollSpeed;
          if (board.scrollLeft >= board.scrollWidth - board.clientWidth) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }, 16);
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

  // Helpers
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);

  const getCardsByStage = (stageId, list = cards) => list.filter(card => (card.status || card.stage) === stageId);

  // Column drag handlers
  const handleColumnDragStart = (e, columnId) => {
    setIsDraggingColumn(true);
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setIsDraggingColumn(false);
      setDraggedColumnId(null);
      return;
    }

    const draggedIndex = columns.findIndex(col => col.id === draggedColumnId);
    const targetIndex = columns.findIndex(col => col.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setIsDraggingColumn(false);
      setDraggedColumnId(null);
      return;
    }

    const newColumns = [...columns];
    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);

    setColumns(newColumns);
    setIsDraggingColumn(false);
    setDraggedColumnId(null);
  };

  const handleColumnDragEnd = () => {
    setIsDraggingColumn(false);
    setDraggedColumnId(null);
  };

  // Handlers for modal etc.
  const handleCardView = (card) => setModal({ open: true, mode: 'view', deal: card });
  const handleCardEdit = (card) => setModal({ open: true, mode: 'edit', deal: card });
  const handleCreateDeal = () => setModal({ open: true, mode: 'edit', deal: null });
  const closeModal = () => setModal({ open: false, mode: 'view', deal: null });

  const handleSave = (dealData) => {
    if (dealData.id) {
      setCards(prev => prev.map(card => card.id === dealData.id ? { ...card, ...dealData, stage: dealData.status || dealData.stage } : card));
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
    console.log("Deal saved:", dealData);
  };

  const handleCardDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa deal này?")) {
      setCards(prev => prev.filter(card => card.id !== id));
      closeModal();
    }
  };
  const handleDrop = (cardId, newStage) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const oldStage = card.stage;
    if (oldStage === newStage) return;

    // compute previous counts and totals
    const prevOldCount = getCardsByStage(oldStage).length;
    const prevNewCount = getCardsByStage(newStage).length;
    const prevOldTotal = getCardsByStage(oldStage).reduce((s, c) => s + (c.value || 0), 0);
    const prevNewTotal = getCardsByStage(newStage).reduce((s, c) => s + (c.value || 0), 0);

    // compute new counts/totals after move
    const newOldCount = Math.max(0, prevOldCount - 1);
    const newNewCount = prevNewCount + 1;
    const newOldTotal = prevOldTotal - (card.value || 0);
    const newNewTotal = prevNewTotal + (card.value || 0);

    // set animated data for both columns
    setAnimatedColumns(prev => {
      const next = { ...(prev || {}) };
      next[oldStage] = {
        startCount: prevOldCount,
        endCount: newOldCount,
        startTotal: prevOldTotal,
        endTotal: newOldTotal
      };
      next[newStage] = {
        startCount: prevNewCount,
        endCount: newNewCount,
        startTotal: prevNewTotal,
        endTotal: newNewTotal
      };
      return next;
    });

    // clear existing timers for those columns (if any) then set new ones
    if (!resetTimersRef.current) resetTimersRef.current = {};
    [oldStage, newStage].forEach((colId) => {
      if (resetTimersRef.current[colId]) {
        clearTimeout(resetTimersRef.current[colId]);
      }
      resetTimersRef.current[colId] = setTimeout(() => {
        setAnimatedColumns(prev => {
          if (!prev) return {};
          const next = { ...prev };
          delete next[colId];
          return next;
        });
        delete resetTimersRef.current[colId];
      }, 900);
    });

    // finally update cards
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, stage: newStage, status: newStage, lastActivity: new Date().toISOString().split('T')[0] } : c
    ));

    setIsDragging(false);
  };

  const handleDragStart = () => setIsDragging(true);

  return (
    <div className="p-0 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline B2C</h1>
        <div className="flex gap-3">
          <Button variant="actionNormal" className="gap-2">
            <Filter className="w-4 h-4" /> Lọc
          </Button>
          <Button onClick={handleCreateDeal} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" /> Thêm Deal
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tổng số deals</p>
              {shouldAnimateStats ? (
                <CountUp end={stats.totalDeals} start={prevStats.totalDeals} duration={0.5} className="text-lg font-bold text-gray-900" />
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
                <CountUp end={stats.totalValue} start={prevStats.totalValue} duration={0.6}
                  formattingFn={(value) => formatCurrency(Math.floor(value))}
                  className="text-sm font-bold text-gray-900" />
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
                <CountUp end={stats.conversionRate} start={prevStats.conversionRate} decimals={1} suffix="%" duration={0.6} className="text-lg font-bold text-gray-900" />
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
                <CountUp end={stats.activeDeals} start={prevStats.activeDeals} duration={0.6} className="text-lg font-bold text-gray-900" />
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
        style={{ height: 'calc(100vh - 200px)', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 #F1F5F9' }}
      >
        {columns.map(column => (
          <div 
            key={column.id} 
            className={`flex-shrink-0 w-64 ${isDraggingColumn && draggedColumnId === column.id ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleColumnDragStart(e, column.id)}
            onDragOver={handleColumnDragOver}
            onDrop={(e) => handleColumnDrop(e, column.id)}
            onDragEnd={handleColumnDragEnd}
          >
            <KanbanColumn
              column={column}
              cards={getCardsByStage(column.id)}
              onCardView={handleCardView}
              onCardEdit={handleCardEdit}
              onCardDelete={handleCardDelete}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              animatedData={animatedColumns[column.id]}
              initialAnimate={isInitialLoad}
              isDraggingColumn={isDraggingColumn}
              draggedColumnId={draggedColumnId}
            />
          </div>
        ))}
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
        onDelete={handleCardDelete}
        maxWidth="sm:max-w-3xl"
      />
    </div>
  );
}
