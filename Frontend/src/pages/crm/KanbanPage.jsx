import React, { useState, useEffect, useRef } from 'react';
import { Plus, Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanColumn from '@/pages/crm/components/KanbanColumn';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/pages/crm/components/DealForm';
import CountUp from 'react-countup';
import { formatCurrency } from '@/utils/helper';
import { toast } from 'sonner';
import {
  getPipelineSummary,
  getPipelineColumns,
  updateLeadStatus as apiUpdateLeadStatus,
} from '@/services/leads';
// Map giữa status backend và id cột UI
const BE2UI = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  NURTURING: 'nurturing',
  CONVERTED: 'converted',
  LOST: 'closed_lost',
  CLOSED_LOST: 'closed_lost',
};
const UI2BE = Object.entries(BE2UI).reduce((acc, [be, ui]) => {
  acc[ui] = be;
  return acc;
}, {});

export default function KanbanPage() {
  // Bỏ dữ liệu mẫu → bắt đầu rỗng
  const [cards, setCards] = useState([]);
  const [columns, setColumns] = useState([]); // [{id,title,count}]
  const [order, setOrder] = useState([]);

  const [summary, setSummary] = useState([]); // [{status,count}]
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [boardScrollLeft, setBoardScrollLeft] = useState(0);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);
  const [prevStats, setPrevStats] = useState({ totalDeals: 0, totalValue: 0, conversionRate: 0, activeDeals: 0 });
  const [animatedColumns, setAnimatedColumns] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const kanbanBoardRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const resetTimersRef = useRef({});
  const isInitialLoadRef = useRef(true);
  const PRIORITY_WEIGHT = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  const getPriorityWeight = (p) => PRIORITY_WEIGHT[(p || '').toLowerCase()] || 0;
  const sortCardsInColumn = (list) => {
    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);

    return [...list].sort((a, b) => {
      // 1) Priority (desc)
      const pa = getPriorityWeight(a.priority);
      const pb = getPriorityWeight(b.priority);
      if (pb !== pa) return pb - pa;

      // 2) Lead score (desc)
      const sa = num(a.leadScore, -Infinity);
      const sb = num(b.leadScore, -Infinity);
      if (sb !== sa) return sb - sa;

      // 3) Conversion prob (desc)
      const ca = num(a.conversionProb, -Infinity);
      const cb = num(b.conversionProb, -Infinity);
      if (cb !== ca) return cb - ca;

      // 4) Value (desc)
      const va = num(a.value, -Infinity);
      const vb = num(b.value, -Infinity);
      if (vb !== va) return vb - va;

      // 5) Ngày tạo (desc)
      const da = new Date(a.createdDate || 0).getTime();
      const db = new Date(b.createdDate || 0).getTime();
      return db - da;
    });
  };
  // Null-safe helpers
  // ---------- Load data từ API ----------
  useEffect(() => {
    const load = async () => {
      try {
        const colRes = await getPipelineColumns();
        // colRes có thể là { ok, data: {...} } hoặc { data: { ok, data } } tùy wrapper
        const payload = colRes?.data?.data ?? colRes?.data ?? colRes ?? {};
        const columnsObj = payload.columns ?? {};
        const orderArr = payload.order ?? Object.keys(columnsObj);

        // Map trạng thái BE -> UI (BE đã dùng lowercase: new/contacted/…)
        const normalizeStatus = (s) => {
          const v = (s || '').toLowerCase();
          return ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'].includes(v) ? v : 'new';
        };


        // Nếu CHƯA có sẵn asNumber trong file, thêm helper ngắn gọn:
        const asNumber = (x, fallback = 0) => {
          if (x === null || x === undefined) return fallback;
          const n = typeof x === 'string' ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fallback;
        };

        const toCard = (lead) => {
          const statusUI = normalizeStatus(lead?.status);

          return {
            id: lead?.lead_id,

            // ✅ Tiêu đề: ưu tiên deal_name, nếu null dùng "Chiến dịch A"
            title: lead?.deal_name || 'Chiến dịch A',

            // ✅ Tên khách hàng (lead)
            customer: lead?.name || 'Khách lẻ',

            email: lead?.email || '',
            phone: lead?.phone || '',
            source: lead?.source || 'Inbound',

            stage: statusUI,
            status: statusUI,

            createdDate: (lead?.created_at || '').slice(0, 10),
            lastActivity: (lead?.created_at || '').slice(0, 10),

            // ✅ Giá trị tiền lấy từ predicted_value (+ đơn vị)
            value: asNumber(lead?.predicted_value, 0),
            currency: lead?.predicted_value_currency || 'VND',

            // Priority + điểm/ xác suất
            priority: lead?.priority || 'medium',
            leadScore: asNumber(lead?.lead_score, 0),
            conversionProb: lead?.conversion_prob != null ? Number(lead.conversion_prob) : null, // 0..1 hoặc null

            // ✅ Tags + sản phẩm
            tags: Array.isArray(lead?.tags) ? lead.tags : [],
            productInterest: lead?.product_interest || 'Chưa chọn sản phẩm',

            // ✅ Assignee
            assignee: lead?.assignee_name || lead?.assigned_to_name || 'Chưa phân công',
            assigneeId: lead?.assigned_to || null,
          };
        };

        const uiCards = Object.values(columnsObj).flatMap((arr) => (arr || []).map(toCard));

        const titleMap = {
          new: 'New',
          contacted: 'Contacted',
          qualified: 'Qualified',
          nurturing: 'Nurturing',
          converted: 'Converted',
          closed_lost: 'Closed Lost',
        };
        const colorMap = {
          new: 'bg-blue-600',
          contacted: 'bg-sky-600',
          qualified: 'bg-violet-600',
          nurturing: 'bg-amber-600',
          converted: 'bg-emerald-600',
          closed_lost: 'bg-red-600',
        };
        const cols = orderArr.map((id) => ({
          id,
          key: id,
          status: id,
          slug: id,
          title: titleMap[id] || id,
          headerColor: colorMap[id] || 'bg-red-600',
          count: (columnsObj[id] || []).length,
        }));

        setOrder(orderArr);
        setColumns(cols);
        setCards(uiCards);

        const sumRes = await getPipelineSummary();
        const sumPayload = sumRes?.data?.data ?? sumRes?.data ?? sumRes ?? {};
        setSummary(sumPayload?.rows ?? []);
      } catch (e) {
        console.error(e);
        toast.error(e.message || 'Không tải được dữ liệu pipeline');
      } finally {
        setTimeout(() => {
          isInitialLoadRef.current = false;
          setIsInitialLoad(false);
          setShouldAnimateStats(false);
        }, 300);
      }
    };
    load();
  }, []);

  // ---------- Stats từ summary ----------
  const statsFromSummary = (() => {
    const totalDeals = summary.reduce((s, r) => s + (r.count || 0), 0);
    const converted = summary.find((r) => r.status === 'CONVERTED')?.count || 0;
    const lost = (summary.find((r) => r.status === 'LOST')?.count || 0) +
      (summary.find((r) => r.status === 'CLOSED_LOST')?.count || 0);
    const activeDeals = totalDeals - converted - lost;
    const conversionRate = totalDeals ? (converted / totalDeals) * 100 : 0;
    return { totalDeals, totalValue: 0, conversionRate, activeDeals };
  })();

  // Giữ animation cho stats
  useEffect(() => {
    const s = statsFromSummary;
    const hasChanged =
      prevStats.totalDeals !== s.totalDeals ||
      prevStats.totalValue !== s.totalValue ||
      prevStats.conversionRate !== s.conversionRate ||
      prevStats.activeDeals !== s.activeDeals;

    if (hasChanged) {
      setShouldAnimateStats(true);
      const t = setTimeout(() => {
        setPrevStats(s);
        setShouldAnimateStats(false);
      }, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]); // dùng summary làm nguồn sự thật

  // ---------- Tính count per column khi cards đổi (dùng cho hiển thị cột) ----------
  useEffect(() => {
    if (!columns?.length) return;
    const updated = columns.map((c) => ({
      ...c,
      count: cards.filter((card) => (card.status || card.stage) === c.id).length,
    }));
    setColumns(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  // ---------- Auto-scroll & drag-to-scroll (giữ nguyên code của bạn) ----------
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !kanbanBoardRef.current) return;
      const board = kanbanBoardRef.current;
      const rect = board.getBoundingClientRect();
      const threshold = 150;
      const speed = 15;

      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      const x = e.clientX;
      const inside = x >= rect.left && x <= rect.right;
      if (!inside) return;

      if (x - rect.left < threshold && board.scrollLeft > 0) {
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft -= speed;
          if (board.scrollLeft <= 0) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }, 16);
      } else if (rect.right - x < threshold && board.scrollLeft < board.scrollWidth - board.clientWidth) {
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft += speed;
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

  useEffect(() => {
    const board = kanbanBoardRef.current;
    if (!board) return;

    const handleMouseDown = (e) => {
      const columnHeader = e.target.closest('[data-column-header]');
      if (!columnHeader) return;
      setIsDraggingBoard(true);
      setDragStartX(e.clientX);
      setBoardScrollLeft(board.scrollLeft);
      e.preventDefault();

    };

    const handleMouseMove = (e) => {
      if (!isDraggingBoard) return;
      e.preventDefault();

      const deltaX = e.clientX - dragStartX;
      board.scrollLeft = Math.max(0, Math.min(boardScrollLeft - deltaX * 1.2, board.scrollWidth - board.clientWidth));
    };

    const handleMouseUp = () => setIsDraggingBoard(false);

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBoard, dragStartX, boardScrollLeft]);

  const getCardsByStage = (stageId, list = cards) => {
    const filtered = list.filter((c) => (c.status || c.stage) === stageId);
    return sortCardsInColumn(filtered);
  };

  // ---------- Modal handlers (giữ logic cũ) ----------
  const handleCardView = (card) => setModal({ open: true, mode: 'view', deal: card });
  const handleCardEdit = (card) => setModal({ open: true, mode: 'edit', deal: card });
  const handleCreateDeal = () => setModal({ open: true, mode: 'edit', deal: null });
  const closeModal = () => setModal({ open: false, mode: 'view', deal: null });

  // Lưu tại chỗ (chưa có API tạo/sửa lead → giữ local)
  const handleSave = (dealData) => {
    if (dealData.id) {
      setCards((prev) =>
        prev.map((c) => (c.id === dealData.id ? { ...c, ...dealData, stage: dealData.status || dealData.stage } : c))
      );
      setModal((prev) => ({ ...prev, mode: 'view', deal: { ...dealData, stage: dealData.status || dealData.stage } }));
      toast.success('Cập nhật deal thành công!');
    } else {
      const newDeal = {
        ...dealData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().slice(0, 10),
        lastActivity: new Date().toISOString().slice(0, 10),
        stage: dealData.status || dealData.stage || 'new',
        status: dealData.status || dealData.stage || 'new',
        value: dealData.value || 0,
      };
      setCards((prev) => [...prev, newDeal]);
      closeModal();
      toast.success('Thêm deal thành công!');
    }
  };

  const handleCardDelete = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    closeModal();
    toast.success('Xóa deal thành công!');
  };

  // ---------- Drag & Drop đổi trạng thái → PATCH API ----------
  const handleDrop = async (cardId, newStageUI) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const oldStageUI = card.stage;
    if (oldStageUI === newStageUI) return;

    // Tính animate cột (giữ nguyên như bạn có)
    const prevOldCount = getCardsByStage(oldStageUI).length;
    const prevNewCount = getCardsByStage(newStageUI).length;
    const prevOldTotal = getCardsByStage(oldStageUI).reduce((s, c) => s + (c.value || 0), 0);
    const prevNewTotal = getCardsByStage(newStageUI).reduce((s, c) => s + (c.value || 0), 0);

    const newOldCount = Math.max(0, prevOldCount - 1);
    const newNewCount = prevNewCount + 1;
    const newOldTotal = prevOldTotal - (card.value || 0);
    const newNewTotal = prevNewTotal + (card.value || 0);

    setAnimatedColumns((prev) => {
      const next = { ...(prev || {}) };
      next[oldStageUI] = { startCount: prevOldCount, endCount: newOldCount, startTotal: prevOldTotal, endTotal: newOldTotal };
      next[newStageUI] = { startCount: prevNewCount, endCount: newNewCount, startTotal: prevNewTotal, endTotal: newNewTotal };
      return next;
    });

    [oldStageUI, newStageUI].forEach((colId) => {
      if (resetTimersRef.current[colId]) clearTimeout(resetTimersRef.current[colId]);
      resetTimersRef.current[colId] = setTimeout(() => {
        setAnimatedColumns((prev) => {
          const next = { ...(prev || {}) };
          delete next[colId];
          return next;
        });
        delete resetTimersRef.current[colId];
      }, 900);
    });

    // Optimistic update UI
    const prevCards = cards;
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, stage: newStageUI, status: newStageUI, lastActivity: new Date().toISOString().slice(0, 10) } : c))
    );

    // Gọi API PATCH
    try {
      const beStatus = UI2BE[newStageUI] || 'new';
      await apiUpdateLeadStatus(cardId, beStatus);

      const sumRes = await getPipelineSummary();
      setSummary(sumRes?.data?.rows ?? []);
    } catch (err) {
      setCards(prevCards); // rollback
      toast.error('Cập nhật trạng thái thất bại!');
    }

    setIsDragging(false);
  };

  const handleDragStart = () => setIsDragging(true);

  // ---------- Stats hiển thị ----------
  const stats = statsFromSummary;

  return (
    <div className="p-0 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-col items-center justify-between z-20 gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Pipeline B2C</h1>
          <div className="flex gap-3">
            <Button onClick={handleCreateDeal} variant="actionCreate" className="gap-2 mb-2">
              <Plus className="w-4 h-4" /> Thêm Deal
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-3">
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
      </div>

      {/* Kanban Board */}
      <div
        ref={kanbanBoardRef}
        data-kanban-board
        className="flex-1 min-h-0 flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 #F1F5F9', scrollbarGutter: 'stable' }}
      >
        {order.map((colId) => {
          const column = columns.find((c) => c.id === colId) || { id: colId, title: colId, count: 0 };
          return (
            <div key={colId} className="flex-shrink-0 w-64">
              <KanbanColumn
                column={column}
                cards={getCardsByStage(colId)}
                onCardView={handleCardView}
                onCardEdit={handleCardEdit}
                onCardDelete={handleCardDelete}
                onDrop={handleDrop}
                onDragStart={() => setIsDragging(true)}
                animatedData={animatedColumns[colId]}
                initialAnimate={isInitialLoad}
                isDraggingBoard={isDraggingBoard}
              />
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <AppDialog
        open={modal.open}
        onClose={closeModal}
        title={{
          view: `Chi tiết deal - ${modal.deal?.title || ''}`,
          edit: modal.deal ? `Chỉnh sửa deal - ${modal.deal.title}` : 'Thêm deal mới',
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
