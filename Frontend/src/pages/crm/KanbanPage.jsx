import { useState, useEffect, useRef } from 'react';
import { Plus, Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanColumn from '@/pages/crm/components/KanbanColumn';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/pages/crm/components/DealForm';
import CountUp from 'react-countup';
import OrderForm from '@/pages/order/components/OrderForm';
import { formatCurrency } from '@/utils/helper';
import { toast } from 'sonner';
import {
  createOrder,
  updateOrder,
  updateOrderStatus,
  getOrder,
} from '@/services/orders';
// import { createOrder, saveOrderDraft, sendCheckoutLink } from '@/services/orders';
import {
  getPipelineSummary,
  getPipelineColumns,
  updateLeadStatus as apiUpdateLeadStatus,
  getPipelineMetrics,
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
const STAGES_OPEN_ORDER = new Set(['converted', 'qualified']);
export default function KanbanPage() {
  // State chính
  const [cards, setCards] = useState([]);
  const [columns, setColumns] = useState([]);
  const [order, setOrder] = useState([]);
  const [summary, setSummary] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [animatedColumns, setAnimatedColumns] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [orderModal, setOrderModal] = useState({ open: false, lead: null, preset: null });

  // Thêm state riêng cho metrics
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    conversionRate: 0,
    activeDeals: 0,
  });
  const [prevStats, setPrevStats] = useState(stats);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);

  const kanbanBoardRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const resetTimersRef = useRef({});
  const scrollRafRef = useRef(null);

  // Đảm bảo column nhìn thấy hoàn toàn khi kéo card vào column đó
  const ensureColumnVisible = (colEl) => {
    if (!colEl || !kanbanBoardRef.current) return;
    const board = kanbanBoardRef.current;
    const boardRect = board.getBoundingClientRect();
    const colRect = colEl.getBoundingClientRect();
    const padding = 12; // cho khoảng đệm nhỏ

    if (colRect.left < boardRect.left + padding) {
      const offset = boardRect.left + padding - colRect.left;
      const newLeft = Math.max(0, board.scrollLeft - offset);
      board.scrollTo({ left: newLeft, behavior: 'smooth' });
    } else if (colRect.right > boardRect.right - padding) {
      const offset = colRect.right - (boardRect.right - padding);
      const newLeft = Math.min(board.scrollWidth - board.clientWidth, board.scrollLeft + offset);
      board.scrollTo({ left: newLeft, behavior: 'smooth' });
    }
  };

  const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 };
  const getPriorityWeight = (p) => PRIORITY_WEIGHT[(p || '').toLowerCase()] || 0;

  const sortCardsInColumn = (list) => {
    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    return [...list].sort((a, b) => {
      const pa = getPriorityWeight(a.priority);
      const pb = getPriorityWeight(b.priority);
      if (pb !== pa) return pb - pa;
      const sa = num(a.leadScore, -Infinity);
      const sb = num(b.leadScore, -Infinity);
      if (sb !== sa) return sb - sa;
      const ca = num(a.conversionProb, -Infinity);
      const cb = num(b.conversionProb, -Infinity);
      if (cb !== ca) return cb - ca;
      const va = num(a.value, -Infinity);
      const vb = num(b.value, -Infinity);
      if (vb !== va) return vb - va;
      const da = new Date(a.createdDate || 0).getTime();
      const db = new Date(b.createdDate || 0).getTime();
      return db - da;
    });
  };

  // ---------- Load pipeline data ----------
  useEffect(() => {
    const load = async () => {
      try {
        const colRes = await getPipelineColumns();
        const payload = colRes?.data?.data ?? colRes?.data ?? colRes ?? {};
        const columnsObj = payload.columns ?? {};
        const orderArr = payload.order ?? Object.keys(columnsObj);

        const normalizeStatus = (s) => {
          const v = (s || '').toLowerCase();
          return ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'].includes(v)
            ? v
            : 'new';
        };

        const asNumber = (x, fb = 0) => {
          if (x === null || x === undefined) return fb;
          const n = typeof x === 'string' ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fb;
        };

        const toCard = (lead) => ({
          id: lead?.lead_id,
          title: lead?.deal_name || 'Chiến dịch A',
          customer: lead?.name || 'Khách lẻ',
          email: lead?.email || '',
          phone: lead?.phone || '',
          source: lead?.source || 'Inbound',
          stage: normalizeStatus(lead?.status),
          status: normalizeStatus(lead?.status),
          createdDate: (lead?.created_at || '').slice(0, 10),
          lastActivity: (lead?.created_at || '').slice(0, 10),
          value: asNumber(lead?.predicted_value, 0),
          currency: lead?.predicted_value_currency || 'VND',
          priority: lead?.priority || 'medium',
          leadScore: asNumber(lead?.lead_score, 0),
          conversionProb: lead?.conversion_prob ?? 0,
          tags: Array.isArray(lead?.tags) ? lead.tags : [],
          productInterest: lead?.product_interest || 'Chưa chọn sản phẩm',
          assignee: lead?.assignee_name || 'Chưa phân công',
          assigneeId: lead?.assigned_to || null,
        });

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
          headerColor: colorMap[id] || 'bg-gray-600',
          count: (columnsObj[id] || []).length,
        }));

        setOrder(orderArr);
        setColumns(cols);
        setCards(uiCards);

        const sumRes = await getPipelineSummary();
        const sumPayload = sumRes?.data?.data ?? sumRes?.data ?? sumRes ?? {};
        setSummary(sumPayload?.rows ?? []);
      } catch (e) {
        toast.error(e.message || 'Không tải được dữ liệu pipeline');
      } finally {
        setTimeout(() => {
          setIsInitialLoad(false);
          setShouldAnimateStats(false);
        }, 300);
      }
    };
    load();
  }, []);

  // ---------- Load metrics từ API ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getPipelineMetrics();
        const d = res?.data?.data ?? res?.data ?? res;
        if (!mounted || !d) return;
        const newStats = {
          totalDeals: d.totalDeals ?? 0,
          totalValue: d.totalValue ?? 0,
          conversionRate: d.conversionRate ?? 0,
          activeDeals: d.processingLeads ?? 0,
        };
        setStats(newStats);
        setShouldAnimateStats(true);
        setTimeout(() => {
          setPrevStats(newStats);
          setShouldAnimateStats(false);
        }, 600);
      } catch (e) {
        console.error('Load metrics failed', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------- Column count cập nhật theo cards ----------
  useEffect(() => {
    if (!columns?.length) return;
    setColumns((prev) =>
      prev.map((c) => ({
        ...c,
        count: cards.filter((card) => (card.status || card.stage) === c.id).length,
      }))
    );
  }, [cards]);

  // ---------- Drag scroll ----------
  useEffect(() => {
    if (!isDragging) return;
    const board = kanbanBoardRef.current;
    if (!board) return;

    let active = true;

    // Cấu hình scroll: trigger sớm hơn khi chỉ lệch một xíu
    const threshold = 300; // px from edge to start scrolling (increased)
    const maxSpeed = 500; // max px per frame

    const doScroll = (dir) => {
      if (!active) return;
      if (dir === 'left') {
        board.scrollLeft = Math.max(0, board.scrollLeft - maxSpeed);
      } else if (dir === 'right') {
        board.scrollLeft = Math.min(board.scrollWidth - board.clientWidth, board.scrollLeft + maxSpeed);
      }
      scrollRafRef.current = requestAnimationFrame(() => doScroll(dir));
    };


    const stopScroll = () => {
      active = false;
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };

    const handleMove = (e) => {
      if (!isDragging || !kanbanBoardRef.current) return;
      const board = kanbanBoardRef.current;

      // Lấy vị trí con trỏ (ưu tiên). Nếu không có (tùy event), fallback center của phần tử đang kéo.
      let clientX = 0;
      if (typeof e?.clientX === "number" && e.clientX > 0) {
        clientX = e.clientX;
      } else if (e?.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
      } else {
        // fallback: tìm phần tử đang kéo (nếu code khác set class/attr)
        const draggedCard = document.querySelector('[draggable].dragging, .dragging, [data-dragging="true"]');
        if (draggedCard) {
          const cardRect = draggedCard.getBoundingClientRect();
          clientX = cardRect.left + cardRect.width / 2;
        } else {
          return; // không có nguồn vị trí -> thoát
        }
      }

      const rect = board.getBoundingClientRect();
      const leftDist = clientX - rect.left;
      const rightDist = rect.right - clientX;

      // stop any ongoing rAF
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }

      if (leftDist >= 0 && leftDist < threshold && board.scrollLeft > 0) {
        const intensity = Math.min(1, (threshold - leftDist) / threshold);
        doScroll('left', intensity);
      } else if (rightDist >= 0 && rightDist < threshold && board.scrollLeft < board.scrollWidth - board.clientWidth) {
        const intensity = Math.min(1, (threshold - rightDist) / threshold);
        doScroll('right', intensity);
      }
    };


    const handleDragEnd = () => {
      setIsDragging(false);
      stopScroll();
    };

    document.addEventListener('dragover', handleMove);
    document.addEventListener('drag', handleMove);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDragEnd);

    return () => {
      stopScroll();
      document.removeEventListener('dragover', handleMove);
      document.removeEventListener('drag', handleMove);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
    };
  }, [isDragging]);


  // ---------- Modal ----------
  const handleCardView = (card) => setModal({ open: true, mode: 'view', deal: card });
  const handleCardEdit = (card) => setModal({ open: true, mode: 'edit', deal: card });
  const handleCreateDeal = () => setModal({ open: true, mode: 'edit', deal: null });
  const closeModal = () => setModal({ open: false, mode: 'view', deal: null });
  // ---------- Order Form Handlers ----------
  const openOrderForLead = (leadCard) => {
    if (orderModal.open) return;
    setOrderModal({
      open: true,
      lead: leadCard,
      preset: {
        customer_name: leadCard.customer,
        channel: (leadCard.source || 'inbound').toLowerCase(),
        notes: `Deal ${leadCard.title} — tạo từ pipeline`,
        status: 'pending',
      },
    });
  };

  const closeOrderModal = () => setOrderModal({ open: false, lead: null, preset: null });

  const handleOrderSave = async (payload) => {
    if (payload.order_id) {
      await updateOrder(payload.order_id, payload);
    } else {
      await createOrder(payload);
    }
    toast.success('Đã lưu đơn hàng!');
    closeOrderModal();
  };

  const handleOrderSaveDraft = async (payload) => {
    const draft = { ...payload, status: 'pending' };
    if (draft.order_id) {
      await updateOrder(draft.order_id, draft);
    } else {
      await createOrder(draft);
    }
    toast.info('Đã lưu giỏ hàng (nháp).');
  };

  const handleSendToCustomer = async (payload) => {
    if (payload.order_id) {
      await updateOrderStatus(payload.order_id, { status: 'processing' });
    } else {
      await createOrder({ ...payload, status: 'processing' });
    }
    toast.success('Đã gửi link xác nhận cho khách!');
    closeOrderModal();
  };
  const handleSave = (dealData) => {
    if (dealData.id) {
      setCards((prev) =>
        prev.map((c) => (c.id === dealData.id ? { ...c, ...dealData, stage: dealData.status || dealData.stage } : c))
      );
      toast.success('Cập nhật deal thành công!');
    } else {
      const newDeal = {
        ...dealData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().slice(0, 10),
        lastActivity: new Date().toISOString().slice(0, 10),
        stage: dealData.status || 'new',
        status: dealData.status || 'new',
        value: dealData.value || 0,
      };
      setCards((prev) => [...prev, newDeal]);
      toast.success('Thêm deal thành công!');
    }
    closeModal();

  };

  const handleCardDelete = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    closeModal();
    toast.success('Xóa deal thành công!');
  };

  // ---------- Drag & Drop ----------
  const getCardsByStage = (stageId, list = cards) => sortCardsInColumn(list.filter((c) => c.stage === stageId));
  const handleDrop = async (cardId, newStageUI) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const oldStageUI = card.stage;
    if (oldStageUI === newStageUI) return;

    const prevCards = cards;
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, stage: newStageUI, status: newStageUI, lastActivity: new Date().toISOString().slice(0, 10) }
          : c
      )
    );
    try {
      const beStatus = UI2BE[newStageUI] || 'NEW';
      await apiUpdateLeadStatus(cardId, beStatus);
      if (STAGES_OPEN_ORDER.has(newStageUI) && !orderModal.open) {
        openOrderForLead({ ...card, stage: newStageUI });
      }
      await refreshPipeline();
      // 🔹 Sau khi API thành công → reload cột & summary để đảm bảo đồng bộ
      const [colRes, sumRes] = await Promise.all([
        getPipelineColumns(),
        getPipelineSummary(),
      ]);

      const payload = colRes?.data?.data ?? colRes?.data ?? colRes ?? {};
      const columnsObj = payload.columns ?? {};
      const orderArr = payload.order ?? Object.keys(columnsObj);

      const normalizeStatus = (s) => {
        const v = (s || '').toLowerCase();
        return ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'].includes(v)
          ? v
          : 'new';
      };

      const asNumber = (x, fb = 0) => {
        if (x === null || x === undefined) return fb;
        const n = typeof x === 'string' ? parseFloat(x) : x;
        return Number.isFinite(n) ? n : fb;
      };

      const toCard = (lead) => ({
        id: lead?.lead_id,
        title: lead?.deal_name || 'Chiến dịch A',
        customer: lead?.name || 'Khách lẻ',
        email: lead?.email || '',
        phone: lead?.phone || '',
        source: lead?.source || 'Inbound',
        stage: normalizeStatus(lead?.status),
        status: normalizeStatus(lead?.status),
        createdDate: (lead?.created_at || '').slice(0, 10),
        lastActivity: (lead?.created_at || '').slice(0, 10),
        value: asNumber(lead?.predicted_value, 0),
        currency: lead?.predicted_value_currency || 'VND',
        priority: lead?.priority || 'medium',
        leadScore: asNumber(lead?.lead_score, 0),
        conversionProb: lead?.conversion_prob ?? 0,
        tags: Array.isArray(lead?.tags) ? lead.tags : [],
        productInterest: lead?.product_interest || 'Chưa chọn sản phẩm',
        assignee: lead?.assignee_name || 'Chưa phân công',
        assigneeId: lead?.assigned_to || null,
      });

      const uiCards = Object.values(columnsObj).flatMap((arr) => (arr || []).map(toCard));
      setCards(uiCards);
      setSummary(sumRes?.data?.rows ?? []);
    } catch (err) {
      // rollback
      setCards(prevCards);
      toast.error('Cập nhật trạng thái thất bại!');
    }

    setIsDragging(false);
  };


  const handleDragStart = () => setIsDragging(true);

  return (
    <div className="p-0 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-col items-center justify-between z-20 gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Pipeline B2C</h1>
          <Button onClick={handleCreateDeal} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" /> Thêm Deal
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <StatCard
            icon={<Target className="w-4 h-4 text-blue-600" />}
            bg="bg-blue-100"
            label="Tổng Lead"
            value={stats.totalDeals}
            prev={prevStats.totalDeals}
            animate={shouldAnimateStats}
            formatter={(v) => v}
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4 text-green-600" />}
            bg="bg-green-100"
            label="Tổng giá trị"
            value={stats.totalValue}
            prev={prevStats.totalValue}
            animate={shouldAnimateStats}
            formatter={(v) => formatCurrency(Math.floor(v))}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
            bg="bg-purple-100"
            label="Tỷ lệ chuyển đổi"
            value={stats.conversionRate}
            prev={prevStats.conversionRate}
            animate={shouldAnimateStats}
            formatter={(v) => `${v.toFixed(1)}%`}
          />
          <StatCard
            icon={<Users className="w-4 h-4 text-orange-600" />}
            bg="bg-orange-100"
            label="Leads đang xử lý"
            value={stats.activeDeals}
            prev={prevStats.activeDeals}
            animate={shouldAnimateStats}
            formatter={(v) => v}
          />
        </div>
      </div>

      {/* Kanban board */}
      <div
        ref={kanbanBoardRef}
        className="flex-1 min-h-0 flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth"
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
                onDragStart={handleDragStart}
                animatedData={animatedColumns[colId]}
                initialAnimate={isInitialLoad}
                isDraggingBoard={isDraggingBoard}
                isCardDragging={isDragging}
                onColumnDragOver={ensureColumnVisible}
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
      <AppDialog
        open={orderModal.open}
        onClose={closeOrderModal}
        title="Tạo đơn hàng"
        mode="edit"
        FormComponent={(props) => (
          <OrderForm
            mode="edit"
            data={orderModal.preset}
            onSave={handleOrderSave}
            onSaveDraft={handleOrderSaveDraft}
            onSendToCustomer={handleSendToCustomer}
            paymentLabels={{
              credit_card: 'Thẻ',
              paypal: 'PayPal',
              bank_transfer: 'Chuyển khoản',
              cash_on_delivery: 'COD',
            }}
            statusLabels={{
              paid: 'Đã thanh toán',
              pending: 'Chờ xử lý',
              cancelled: 'Đã hủy',
              refunded: 'Đã hoàn tiền',
              failed: 'Thanh toán thất bại',
              processing: 'Đang xử lý',
              shipped: 'Đã giao hàng',
              completed: 'Hoàn tất',
            }}
          />
        )}
        maxWidth="sm:max-w-3xl"
      />

    </div>
  );
}

//Tách riêng thẻ thống kê
const StatCard = ({ icon, bg, label, value, prev, animate, formatter }) => (
  <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
    <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      {animate ? (
        <CountUp end={value} start={prev} duration={0.6} formattingFn={formatter} className="text-lg font-bold text-gray-900" />
      ) : (
        <p className="text-lg font-bold text-gray-900">{formatter(value)}</p>
      )}
    </div>
  </div>
);
