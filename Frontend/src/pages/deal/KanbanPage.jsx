import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Columns3,
  List,
  Search,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import KanbanColumn from "@/pages/deal/components/KanbanColumn";
import AppDialog from "@/components/dialogs/AppDialog";
import DealForm from "@/pages/deal/components/DealForm";
import CountUp from "react-countup";
import OrderForm from "@/pages/order/components/OrderForm";
import { formatCurrency } from "@/utils/helper";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import {
  createOrder,
  updateOrder,
  updateOrderStatus,
  getOrder,
} from "@/services/orders";
import {
  getPipelineSummary,
  getPipelineColumns,
  updateLeadStatus as apiUpdateLeadStatus,
  getPipelineMetrics,
  getLeadDetailsById,
  rescoreLead,
} from "@/services/leads";
import { getProducts } from "@/services/products";
import LeadsPage from "@/pages/deal/LeadsPage";
import DropdownOptions from "@/components/common/DropdownOptions"; // added
import { getRecommendedProducts } from "@/services/leads";
import { Input } from "@/components/ui/input";

// Map giữa status backend và id cột UI
const BE2UI = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  NURTURING: "nurturing",
  CONVERTED: "converted",
  LOST: "closed_lost",
  CLOSED_LOST: "closed_lost",
};
const UI2BE = Object.entries(BE2UI).reduce((acc, [be, ui]) => {
  acc[ui] = be;
  return acc;
}, {});
const STAGES_OPEN_ORDER = new Set(["converted", "qualified"]);
export default function KanbanPage() {
  // State chính
  const [cards, setCards] = useState([]);
  const [columns, setColumns] = useState([]);
  const [order, setOrder] = useState([]);
  const [summary, setSummary] = useState([]);
  const [modal, setModal] = useState({
    open: false,
    mode: "view",
    deal: null,
    loading: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [animatedColumns, setAnimatedColumns] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [orderModal, setOrderModal] = useState({
    open: false,
    lead: null,
    preset: null,
  });
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [products, setProducts] = useState([]); // Thêm state cho danh sách products
  const [isLoading, setIsLoading] = useState(true); // loading state

  // Thêm state riêng cho metrics
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    conversionRate: 0,
    activeDeals: 0,
  });
  const [prevStats, setPrevStats] = useState(stats);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'list' | 'card'

  // new: filter state for list view
  const [filterStatus, setFilterStatus] = useState("");

  // new: search state
  const [searchQuery, setSearchQuery] = useState("");

  // local FILTER_OPTIONS (same as LeadsPage)
  const FILTER_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "new", label: "NEW" },
    { value: "contacted", label: "CONTACTED" },
    { value: "qualified", label: "QUALIFIED" },
    { value: "nurturing", label: "NURTURING" },
    { value: "converted", label: "CONVERTED" },
    { value: "closed_lost", label: "CLOSED_LOST" },
  ];

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
      board.scrollTo({ left: newLeft, behavior: "smooth" });
    } else if (colRect.right > boardRect.right - padding) {
      const offset = colRect.right - (boardRect.right - padding);
      const newLeft = Math.min(
        board.scrollWidth - board.clientWidth,
        board.scrollLeft + offset
      );
      board.scrollTo({ left: newLeft, behavior: "smooth" });
    }
  };

  const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 };
  const getPriorityWeight = (p) =>
    PRIORITY_WEIGHT[(p || "").toLowerCase()] || 0;

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
      setIsLoading(true); // Bắt đầu loading
      try {
        // Load products first
        const productsRes = await getProducts();
        const productsData =
          productsRes?.data?.data ?? productsRes?.data ?? productsRes ?? [];
        setProducts(productsData);

        const colRes = await getPipelineColumns();
        const payload = colRes?.data?.data ?? colRes?.data ?? colRes ?? {};
        const columnsObj = payload.columns ?? {};
        const orderArr = payload.order ?? Object.keys(columnsObj);

        const normalizeStatus = (s) => {
          const v = (s || "").toLowerCase();
          return [
            "new",
            "contacted",
            "qualified",
            "nurturing",
            "converted",
            "closed_lost",
          ].includes(v)
            ? v
            : "new";
        };

        const asNumber = (x, fb = 0) => {
          if (x === null || x === undefined) return fb;
          const n = typeof x === "string" ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fb;
        };

        const toCard = (lead) => ({
          id: lead?.lead_id,
          title: lead?.deal_name || lead?.name || "Chiến dịch A",
          name: lead?.name || "Khách lẻ",
          email: lead?.email || "",
          phone: lead?.phone || "",
          source: lead?.source || "Inbound",
          stage: normalizeStatus(lead?.status),
          status: normalizeStatus(lead?.status),
          createdDate: (lead?.created_at || "").slice(0, 10),
          lastActivity: (lead?.updated_at || lead?.created_at || "").slice(
            0,
            10
          ),
          value: asNumber(lead?.predicted_value, 0),
          currency: lead?.predicted_value_currency || "VND",
          priority: lead?.priority || "medium",
          leadScore: asNumber(lead?.lead_score, 0),
          conversionProb: lead?.conversion_prob ?? 0,
          tags: Array.isArray(lead?.tags) ? lead.tags : [],
          productInterest: lead?.product_interest || "Chưa chọn sản phẩm",
          assignee: lead?.assignee_name || "Chưa phân công",
          assigneeId: lead?.assigned_to || null,
          notes: lead?.notes || "",
          aiReason: lead?.ai_reason || "",
          predictedProb: lead?.predicted_prob ?? 0,
          mlConversionProb: lead?.ml_conversion_prob ?? 0,
          mlPredictedValue: asNumber(lead?.ml_predicted_value, 0),
          mlLastScoredAt: lead?.ml_last_scored_at || null,
          mlModelVersion: lead?.ml_model_version || null,
        });

        const uiCards = Object.values(columnsObj).flatMap((arr) =>
          (arr || []).map(toCard)
        );

        const titleMap = {
          new: "New",
          contacted: "Contacted",
          qualified: "Qualified",
          nurturing: "Nurturing",
          converted: "Converted",
          closed_lost: "Closed Lost",
        };
        const colorMap = {
          new: "bg-blue-600",
          contacted: "bg-sky-600",
          qualified: "bg-violet-600",
          nurturing: "bg-amber-600",
          converted: "bg-emerald-600",
          closed_lost: "bg-red-600",
        };
        const cols = orderArr.map((id) => ({
          id,
          key: id,
          status: id,
          slug: id,
          title: titleMap[id] || id,
          headerColor: colorMap[id] || "bg-gray-600",
          count: (columnsObj[id] || []).length,
        }));

        setOrder(orderArr);
        setColumns(cols);
        setCards(uiCards);

        const sumRes = await getPipelineSummary();
        const sumPayload = sumRes?.data?.data ?? sumRes?.data ?? sumRes ?? {};
        setSummary(sumPayload?.rows ?? []);
      } catch (e) {
        toast.error(e.message || "Không tải được dữ liệu pipeline");
      } finally {
        setTimeout(() => {
          setIsInitialLoad(false);
          setShouldAnimateStats(false);
          setIsLoading(false); // Kết thúc loading
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
        console.error("Load metrics failed", e);
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
        count: cards.filter((card) => (card.status || card.stage) === c.id)
          .length,
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
      if (dir === "left") {
        board.scrollLeft = Math.max(0, board.scrollLeft - maxSpeed);
      } else if (dir === "right") {
        board.scrollLeft = Math.min(
          board.scrollWidth - board.clientWidth,
          board.scrollLeft + maxSpeed
        );
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
        const draggedCard = document.querySelector(
          '[draggable].dragging, .dragging, [data-dragging="true"]'
        );
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
        doScroll("left", intensity);
      } else if (
        rightDist >= 0 &&
        rightDist < threshold &&
        board.scrollLeft < board.scrollWidth - board.clientWidth
      ) {
        const intensity = Math.min(1, (threshold - rightDist) / threshold);
        doScroll("right", intensity);
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      stopScroll();
    };

    document.addEventListener("dragover", handleMove);
    document.addEventListener("drag", handleMove);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDragEnd);

    return () => {
      stopScroll();
      document.removeEventListener("dragover", handleMove);
      document.removeEventListener("drag", handleMove);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDragEnd);
    };
  }, [isDragging]);

  // ---------- Modal ----------
  const handleCardView = async (card) => {
    setModal({ open: true, mode: "view", deal: card, loading: true });

    try {
      const res = await getLeadDetailsById(card.id);
      const detailData = res?.data?.data ?? res?.data ?? res;

      if (detailData) {
        const normalizeStatus = (s) => {
          const v = (s || "").toLowerCase();
          return [
            "new",
            "contacted",
            "qualified",
            "nurturing",
            "converted",
            "closed_lost",
          ].includes(v)
            ? v
            : "new";
        };

        const asNumber = (x, fb = 0) => {
          if (x === null || x === undefined) return fb;
          const n = typeof x === "string" ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fb;
        };

        const enrichedDeal = {
          id: detailData.lead_id,
          title: detailData.deal_name || detailData.name || card.title,
          name: detailData.name || card.name,
          email: detailData.email || card.email,
          phone: detailData.phone || card.phone,
          source: detailData.source || card.source,
          stage: normalizeStatus(detailData.status),
          status: normalizeStatus(detailData.status),
          createdDate: (detailData.created_at || card.createdDate || "").slice(
            0,
            10
          ),
          lastActivity: (
            detailData.updated_at ||
            detailData.created_at ||
            card.lastActivity ||
            ""
          ).slice(0, 10),
          value: asNumber(detailData.predicted_value, card.value || 0),
          currency:
            detailData.predicted_value_currency || card.currency || "VND",
          priority: detailData.priority || card.priority || "medium",
          leadScore: asNumber(detailData.lead_score, card.leadScore || 0),
          conversionProb:
            detailData.conversion_prob ?? card.conversionProb ?? 0,
          tags: Array.isArray(detailData.tags)
            ? detailData.tags
            : card.tags || [],
          productInterest: detailData.product_interest || card.productInterest,
          assignee:
            detailData.assignee_name || card.assignee || "Chưa phân công",
          assigneeId: detailData.assigned_to || card.assigneeId || null,
          notes: detailData.notes || card.notes || "",
          aiReason: detailData.ai_reason || card.aiReason || "",
          predictedProb: detailData.predicted_prob ?? card.predictedProb ?? 0,
          mlConversionProb:
            detailData.ml_conversion_prob ?? card.mlConversionProb ?? 0,
          mlPredictedValue: asNumber(
            detailData.ml_predicted_value,
            card.mlPredictedValue || 0
          ),
          mlLastScoredAt:
            detailData.ml_last_scored_at || card.mlLastScoredAt || null,
          mlModelVersion:
            detailData.ml_model_version || card.mlModelVersion || null,
          productInterests: detailData.product_interests || [],
          interactions: detailData.interactions || [],
          anonId: detailData.anon_id || null,
          campaignId: detailData.campaign_id || null,
        };

        setModal({
          open: true,
          mode: "view",
          deal: enrichedDeal,
          loading: false,
        });
      } else {
        setModal({ open: true, mode: "view", deal: card, loading: false });
      }
    } catch (err) {
      console.error("Failed to load lead details:", err);
      setModal({ open: true, mode: "view", deal: card, loading: false });
    }
  };

  const handleCardEdit = async (card) => {
    setModal({ open: true, mode: "edit", deal: card, loading: true });

    try {
      const res = await getLeadDetailsById(card.id);
      const detailData = res?.data?.data ?? res?.data ?? res;

      if (detailData) {
        const normalizeStatus = (s) => {
          const v = (s || "").toLowerCase();
          return [
            "new",
            "contacted",
            "qualified",
            "nurturing",
            "converted",
            "closed_lost",
          ].includes(v)
            ? v
            : "new";
        };

        const asNumber = (x, fb = 0) => {
          if (x === null || x === undefined) return fb;
          const n = typeof x === "string" ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fb;
        };

        const enrichedDeal = {
          id: detailData.lead_id,
          title: detailData.deal_name || detailData.name || card.title,
          name: detailData.name || card.name,
          email: detailData.email || card.email,
          phone: detailData.phone || card.phone,
          source: detailData.source || card.source,
          stage: normalizeStatus(detailData.status),
          status: normalizeStatus(detailData.status),
          createdDate: (detailData.created_at || card.createdDate || "").slice(
            0,
            10
          ),
          lastActivity: (
            detailData.updated_at ||
            detailData.created_at ||
            card.lastActivity ||
            ""
          ).slice(0, 10),
          value: asNumber(detailData.predicted_value, card.value || 0),
          currency:
            detailData.predicted_value_currency || card.currency || "VND",
          priority: detailData.priority || card.priority || "medium",
          leadScore: asNumber(detailData.lead_score, card.leadScore || 0),
          conversionProb:
            detailData.conversion_prob ?? card.conversionProb ?? 0,
          tags: Array.isArray(detailData.tags)
            ? detailData.tags
            : card.tags || [],
          productInterest: detailData.product_interest || card.productInterest,
          assignee:
            detailData.assignee_name || card.assignee || "Chưa phân công",
          assigneeId: detailData.assigned_to || card.assigneeId || null,
          notes: detailData.notes || card.notes || "",
          aiReason: detailData.ai_reason || card.aiReason || "",
          predictedProb: detailData.predicted_prob ?? card.predictedProb ?? 0,
          mlConversionProb:
            detailData.ml_conversion_prob ?? card.mlConversionProb ?? 0,
          mlPredictedValue: asNumber(
            detailData.ml_predicted_value,
            card.mlPredictedValue || 0
          ),
          mlLastScoredAt:
            detailData.ml_last_scored_at || card.mlLastScoredAt || null,
          mlModelVersion:
            detailData.ml_model_version || card.mlModelVersion || null,
          productInterests: detailData.product_interests || [],
          interactions: detailData.interactions || [],
          anonId: detailData.anon_id || null,
          campaignId: detailData.campaign_id || null,
        };

        setModal({
          open: true,
          mode: "edit",
          deal: enrichedDeal,
          loading: false,
        });
      } else {
        setModal({ open: true, mode: "edit", deal: card, loading: false });
      }
    } catch (err) {
      console.error("Failed to load lead details:", err);
      setModal({ open: true, mode: "edit", deal: card, loading: false });
    }
  };

  const handleCreateDeal = () =>
    setModal({ open: true, mode: "edit", deal: null, loading: false });
  const closeModal = () =>
    setModal({ open: false, mode: "view", deal: null, loading: false });
  // ---------- Order Form Handlers ----------
  const openOrderForLead = async (leadCard) => {
    if (orderModal.open) return;

    try {
      // Lấy chi tiết lead để có danh sách product_id quan tâm
      const res = await getLeadDetailsById(leadCard.id || leadCard.lead_id);
      const detailData = res?.data?.data ?? res?.data ?? res;

      // Lấy danh sách product_id từ productInterests
      const productInterests = detailData?.product_interests || [];
      const productIds = productInterests.map((pi) => {
        return String(pi.product_id || pi);
      });

      console.log("Product IDs from lead details:", productIds);
      console.log("Available products:", products);

      // Lọc sản phẩm từ danh sách products dựa trên productIds
      const recommendedProducts = products
        .filter((p) => {
          const pid = String(p.product_id || p.id);
          return productIds.includes(pid);
        })
        .map((p) => ({
          product_id: p.product_id || p.id,
          name: p.product_name || p.name,
          price_current: Number(p.price_current || 0),
          price_original: Number(p.price_original || 0),
          discount_percent: Number(p.discount_percent || 0),
          description: p.description || "",
          category: p.category || "",
          stock: p.stock || 0,
        }));

      console.log(
        "Recommended products for lead",
        leadCard.id,
        recommendedProducts
      );
      setRecommendedProducts(recommendedProducts);
    } catch (err) {
      console.warn(
        "Failed to load recommended products from lead details",
        err
      );
      setRecommendedProducts([]);
    }

    setOrderModal({
      open: true,
      lead: leadCard,
      preset: {
        lead_id: leadCard.id || leadCard.lead_id || null,
        customer_id: leadCard.customer_id || null,
        customer_name: leadCard.name,
        channel: (leadCard.source || "inbound").toLowerCase(),
        notes: `Deal ${leadCard.title} — tạo từ pipeline`,
        status: "pending",
      },
    });
  };

  const closeOrderModal = () => {
    setOrderModal({ open: false, lead: null, preset: null });
    setRecommendedProducts([]);
  };

  const handleOrderSave = async (payload) => {
    if (payload.order_id) {
      await updateOrder(payload.order_id, payload);
    } else {
      await createOrder(payload);
    }
    toast.success("Đã lưu đơn hàng!");
    closeOrderModal();
  };

  const handleOrderSaveDraft = async (payload) => {
    const draft = { ...payload, status: "pending" };
    if (draft.order_id) {
      await updateOrder(draft.order_id, draft);
    } else {
      await createOrder(draft);
    }
    toast.info("Đã lưu giỏ hàng (nháp).");
  };

  const handleSendToCustomer = async (payload) => {
    if (payload.order_id) {
      await updateOrderStatus(payload.order_id, { status: "processing" });
    } else {
      await createOrder({ ...payload, status: "processing" });
    }
    toast.success("Đã gửi link xác nhận cho khách!");
    closeOrderModal();
  };
  const handleSave = async (dealData) => {
    if (dealData.id && !dealData.shouldRefresh) {
      // Updated existing lead - refresh data and switch to view mode
      try {
        // Fetch updated lead details
        const res = await getLeadDetailsById(dealData.id);
        const detailData = res?.data?.data ?? res?.data ?? res;

        if (detailData) {
          const normalizeStatus = (s) => {
            const v = (s || "").toLowerCase();
            return [
              "new",
              "contacted",
              "qualified",
              "nurturing",
              "converted",
              "closed_lost",
            ].includes(v)
              ? v
              : "new";
          };

          const asNumber = (x, fb = 0) => {
            if (x === null || x === undefined) return fb;
            const n = typeof x === "string" ? parseFloat(x) : x;
            return Number.isFinite(n) ? n : fb;
          };

          const enrichedDeal = {
            id: detailData.lead_id,
            title: detailData.deal_name || detailData.name || dealData.title,
            name: detailData.name || dealData.name,
            email: detailData.email || dealData.email,
            phone: detailData.phone || dealData.phone,
            source: detailData.source || dealData.source,
            stage: normalizeStatus(detailData.status),
            status: normalizeStatus(detailData.status),
            createdDate: (
              detailData.created_at ||
              dealData.createdDate ||
              ""
            ).slice(0, 10),
            lastActivity: (
              detailData.updated_at ||
              detailData.created_at ||
              dealData.lastActivity ||
              ""
            ).slice(0, 10),
            value: asNumber(detailData.predicted_value, dealData.value || 0),
            currency:
              detailData.predicted_value_currency || dealData.currency || "VND",
            priority: detailData.priority || dealData.priority || "medium",
            leadScore: asNumber(detailData.lead_score, dealData.leadScore || 0),
            conversionProb:
              detailData.conversion_prob ?? dealData.conversionProb ?? 0,
            tags: Array.isArray(detailData.tags)
              ? detailData.tags
              : dealData.tags || [],
            productInterest:
              detailData.product_interest || dealData.productInterest,
            assignee:
              detailData.assignee_name || dealData.assignee || "Chưa phân công",
            assigneeId: detailData.assigned_to || dealData.assigneeId || null,
            notes: detailData.notes || dealData.notes || "",
            aiReason: detailData.ai_reason || dealData.aiReason || "",
            predictedProb:
              detailData.predicted_prob ?? dealData.predictedProb ?? 0,
            mlConversionProb:
              detailData.ml_conversion_prob ?? dealData.mlConversionProb ?? 0,
            mlPredictedValue: asNumber(
              detailData.ml_predicted_value,
              dealData.mlPredictedValue || 0
            ),
            mlLastScoredAt:
              detailData.ml_last_scored_at || dealData.mlLastScoredAt || null,
            mlModelVersion:
              detailData.ml_model_version || dealData.mlModelVersion || null,
            productInterests: detailData.product_interests || [],
            interactions: detailData.interactions || [],
            anonId: detailData.anon_id || null,
            campaignId: detailData.campaign_id || null,
          };

          // Update cards in background
          setCards((prev) =>
            prev.map((c) =>
              c.id === dealData.id
                ? { ...c, ...enrichedDeal, stage: enrichedDeal.status }
                : c
            )
          );

          // Đổi chế độ modal sang view với dữ liệu mới
          setModal({
            open: true,
            mode: "view",
            deal: enrichedDeal,
            loading: false,
          });
        } else {
          // Fallback: update with form data and switch to view mode
          setCards((prev) =>
            prev.map((c) =>
              c.id === dealData.id
                ? {
                    ...c,
                    ...dealData,
                    stage: dealData.status || dealData.stage,
                  }
                : c
            )
          );
          setModal({
            open: true,
            mode: "view",
            deal: dealData,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Failed to refresh lead details:", err);
        // Fallback: update with form data and switch to view mode
        setCards((prev) =>
          prev.map((c) =>
            c.id === dealData.id
              ? { ...c, ...dealData, stage: dealData.status || dealData.stage }
              : c
          )
        );
        setModal({ open: true, mode: "view", deal: dealData, loading: false });
      }
    } else if (dealData.shouldRefresh) {
      // New lead created with API, refresh the pipeline and close modal
      closeModal();
      try {
        const colRes = await getPipelineColumns();
        const payload = colRes?.data?.data ?? colRes?.data ?? colRes ?? {};
        const columnsObj = payload.columns ?? {};

        const normalizeStatus = (s) => {
          const v = (s || "").toLowerCase();
          return [
            "new",
            "contacted",
            "qualified",
            "nurturing",
            "converted",
            "closed_lost",
          ].includes(v)
            ? v
            : "new";
        };

        const asNumber = (x, fb = 0) => {
          if (x === null || x === undefined) return fb;
          const n = typeof x === "string" ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fb;
        };

        const toCard = (lead) => ({
          id: lead?.lead_id,
          title: lead?.deal_name || lead?.name || "Chiến dịch A",
          name: lead?.name || "Khách lẻ",
          email: lead?.email || "",
          phone: lead?.phone || "",
          source: lead?.source || "Inbound",
          stage: normalizeStatus(lead?.status),
          status: normalizeStatus(lead?.status),
          createdDate: (lead?.created_at || "").slice(0, 10),
          lastActivity: (lead?.updated_at || lead?.created_at || "").slice(
            0,
            10
          ),
          value: asNumber(lead?.predicted_value, 0),
          currency: lead?.predicted_value_currency || "VND",
          priority: lead?.priority || "medium",
          leadScore: asNumber(lead?.lead_score, 0),
          conversionProb: lead?.conversion_prob ?? 0,
          tags: Array.isArray(lead?.tags) ? lead.tags : [],
          productInterest: lead?.product_interest || "Chưa chọn sản phẩm",
          assignee: lead?.assignee_name || "Chưa phân công",
          assigneeId: lead?.assigned_to || null,
          notes: lead?.notes || "",
          aiReason: lead?.ai_reason || "",
          predictedProb: lead?.predicted_prob ?? 0,
          mlConversionProb: lead?.ml_conversion_prob ?? 0,
          mlPredictedValue: asNumber(lead?.ml_predicted_value, 0),
          mlLastScoredAt: lead?.ml_last_scored_at || null,
          mlModelVersion: lead?.ml_model_version || null,
        });

        const uiCards = Object.values(columnsObj).flatMap((arr) =>
          (arr || []).map(toCard)
        );
        setCards(uiCards);
      } catch (err) {
        console.error("Failed to refresh pipeline after creating lead:", err);
      }
    } else {
      // Fallback: old client-side only creation (should not happen now)
      const newDeal = {
        ...dealData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().slice(0, 10),
        lastActivity: new Date().toISOString().slice(0, 10),
        stage: dealData.status || dealData.stage || "new",
        status: dealData.status || dealData.stage || "new",
        value: dealData.value || 0,
      };
      setCards((prev) => [...prev, newDeal]);
      toast.success("Thêm deal thành công!");
      closeModal();
    }
  };

  const handleCardDelete = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    closeModal();
    toast.success("Xóa deal thành công!");
  };

  // ---------- Drag & Drop ----------
  const getCardsByStage = (stageId, list = cards) => {
    const filtered = searchLeads(list, searchQuery);
    return sortCardsInColumn(filtered.filter((c) => c.stage === stageId));
  };
  const handleDrop = async (cardId, newStageUI) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const oldStageUI = card.stage;
    if (oldStageUI === newStageUI) return;

    // Optimistic UI
    const prevCards = cards;
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              stage: newStageUI,
              status: newStageUI,
              lastActivity: new Date().toISOString().slice(0, 10),
            }
          : c
      )
    );

    try {
      // 1) Đổi trạng thái trên BE
      const beStatus = UI2BE[newStageUI] || "NEW";
      await apiUpdateLeadStatus(cardId, beStatus);

      // Mở Order nếu cần
      if (STAGES_OPEN_ORDER.has(newStageUI) && !orderModal.open) {
        openOrderForLead({ ...card, stage: newStageUI });
      }
    } catch (err) {
      // Nếu API thất bại mới rollback + báo lỗi
      setCards(prevCards);
      toast.error("Cập nhật trạng thái thất bại!");
      setIsDragging(false);
      return; // DỪNG ở đây
    }

    try {
      // 2) Đồng bộ lại dữ liệu từ server (không coi là thất bại đổi trạng thái)
      const [colRes, sumRes] = await Promise.all([
        getPipelineColumns(),
        getPipelineSummary(),
      ]);

      const payload = colRes?.data?.data ?? colRes?.data ?? colRes ?? {};
      const columnsObj = payload.columns ?? {};

      const normalizeStatus = (s) => {
        const v = (s || "").toLowerCase();
        return [
          "new",
          "contacted",
          "qualified",
          "nurturing",
          "converted",
          "closed_lost",
        ].includes(v)
          ? v
          : "new";
      };

      const asNumber = (x, fb = 0) => {
        if (x === null || x === undefined) return fb;
        const n = typeof x === "string" ? parseFloat(x) : x;
        return Number.isFinite(n) ? n : fb;
      };

      const toCard = (lead) => ({
        id: lead?.lead_id,
        title: lead?.deal_name || lead?.name || "Chiến dịch A",
        name: lead?.name || "Khách lẻ",
        email: lead?.email || "",
        phone: lead?.phone || "",
        source: lead?.source || "Inbound",
        stage: normalizeStatus(lead?.status),
        status: normalizeStatus(lead?.status),
        createdDate: (lead?.created_at || "").slice(0, 10),
        lastActivity: (lead?.updated_at || lead?.created_at || "").slice(0, 10),
        value: asNumber(lead?.predicted_value, 0),
        currency: lead?.predicted_value_currency || "VND",
        priority: lead?.priority || "medium",
        leadScore: asNumber(lead?.lead_score, 0),
        conversionProb: lead?.conversion_prob ?? 0,
        tags: Array.isArray(lead?.tags) ? lead.tags : [],
        productInterest: lead?.product_interest || "Chưa chọn sản phẩm",
        assignee: lead?.assignee_name || "Chưa phân công",
        assigneeId: lead?.assigned_to || null,
        notes: lead?.notes || "",
        aiReason: lead?.ai_reason || "",
        predictedProb: lead?.predicted_prob ?? 0,
        mlConversionProb: lead?.ml_conversion_prob ?? 0,
        mlPredictedValue: asNumber(lead?.ml_predicted_value, 0),
        mlLastScoredAt: lead?.ml_last_scored_at || null,
        mlModelVersion: lead?.ml_model_version || null,
      });

      const uiCards = Object.values(columnsObj).flatMap((arr) =>
        (arr || []).map(toCard)
      );
      setCards(uiCards);

      // LƯU Ý: summary trả về dạng nào thì lấy đúng dạng đó
      const sumPayload = sumRes?.data?.data ?? sumRes?.data ?? sumRes ?? {};
      setSummary(sumPayload?.rows ?? []);
    } catch (err) {
      // Đồng bộ lỗi thì chỉ cảnh báo nhẹ
      console.warn("Refresh pipeline failed", err);
      toast.info("Đổi trạng thái thành công, nhưng chưa đồng bộ lại bảng.");
    } finally {
      setIsDragging(false);
    }
  };

  const handleDragStart = () => setIsDragging(true);

  // Hiển thị Loading khi đang tải
  if (isLoading) {
    return <Loading text="Đang tải..." />;
  }

  // Hàm tìm kiếm lead
  const searchLeads = (list, query) => {
    if (!query.trim()) return list;

    const lowerQuery = query.toLowerCase().trim();
    return list.filter((card) => {
      const searchableFields = [
        card.title,
        card.name,
        card.email,
        card.phone,
        card.productInterest,
        card.assignee,
        card.notes,
        ...(card.tags || []),
      ].filter(Boolean);

      return searchableFields.some((field) =>
        String(field).toLowerCase().includes(lowerQuery)
      );
    });
  };

  const handleRescore = async (card) => {
    try {
      toast.info("Đang tính điểm lại...");
      const res = await rescoreLead(card.id, { trigger: "manual" });
      console.log("Rescore response:", res);
      
      if (res?.ok) {
        const newScore = Number(res.data?.prediction?.raw_score || 0).toFixed(2);
        toast.success(`Rescore thành công! (Điểm mới: ${newScore})`);
        
        // Reload pipeline columns to get updated data
        try {
          const colRes = await getPipelineColumns();
          const payload = colRes?.data?.data ?? colRes?.data ?? colRes ?? {};
          const columnsObj = payload.columns ?? {};

          const normalizeStatus = (s) => {
            const v = (s || "").toLowerCase();
            return [
              "new",
              "contacted",
              "qualified",
              "nurturing",
              "converted",
              "closed_lost",
            ].includes(v)
              ? v
              : "new";
          };

          const asNumber = (x, fb = 0) => {
            if (x === null || x === undefined) return fb;
            const n = typeof x === "string" ? parseFloat(x) : x;
            return Number.isFinite(n) ? n : fb;
          };

          const toCard = (lead) => ({
            id: lead?.lead_id,
            title: lead?.deal_name || lead?.name || "Chiến dịch A",
            name: lead?.name || "Khách lẻ",
            email: lead?.email || "",
            phone: lead?.phone || "",
            source: lead?.source || "Inbound",
            stage: normalizeStatus(lead?.status),
            status: normalizeStatus(lead?.status),
            createdDate: (lead?.created_at || "").slice(0, 10),
            lastActivity: (lead?.updated_at || lead?.created_at || "").slice(0, 10),
            value: asNumber(lead?.predicted_value, 0),
            currency: lead?.predicted_value_currency || "VND",
            priority: lead?.priority || "medium",
            leadScore: asNumber(lead?.lead_score, 0),
            conversionProb: lead?.conversion_prob ?? 0,
            tags: Array.isArray(lead?.tags) ? lead.tags : [],
            productInterest: lead?.product_interest || "Chưa chọn sản phẩm",
            assignee: lead?.assignee_name || "Chưa phân công",
            assigneeId: lead?.assigned_to || null,
            notes: lead?.notes || "",
            aiReason: lead?.ai_reason || "",
            predictedProb: lead?.predicted_prob ?? 0,
            mlConversionProb: lead?.ml_conversion_prob ?? 0,
            mlPredictedValue: asNumber(lead?.ml_predicted_value, 0),
            mlLastScoredAt: lead?.ml_last_scored_at || null,
            mlModelVersion: lead?.ml_model_version || null,
          });

          const uiCards = Object.values(columnsObj).flatMap((arr) =>
            (arr || []).map(toCard)
          );
          setCards(uiCards);
        } catch (refreshErr) {
          console.error("Failed to refresh after rescore:", refreshErr);
          toast.warning("Điểm đã được cập nhật nhưng chưa đồng bộ lại giao diện");
        }
      } else {
        toast.error(
          "Rescore thất bại: " + (res?.error?.message || "Lỗi không xác định")
        );
      }
    } catch (e) {
      console.error("Rescore error:", e);
      toast.error("Lỗi khi rescore: " + (e.message || "Không xác định"));
    }
  };

  return (
    <div className="p-0 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-col  z-20 gap-3 p-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <div className="gap-3 flex flex-col md:flex-row items-center md:justify-between">
          <div className="flex gap-2 justify-between md:w-auto w-full">
            <h1 className="text-xl font-bold text-gray-900">Pipeline B2C</h1>
            <div className="rounded-md bg-white">
              <Button
                variant={
                  viewMode === "kanban" ? "actionCreate" : "actionNormal"
                }
                onClick={() => setViewMode("kanban")}
                className="rounded-none rounded-tl-md rounded-bl-md size-8"
              >
                <Columns3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "actionCreate" : "actionNormal"}
                onClick={() => setViewMode("list")}
                className="rounded-none  size-8"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "actionCreate" : "actionNormal"}
                onClick={() => setViewMode("card")}
                className="rounded-none rounded-tr-md rounded-br-md size-8"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 md:w-auto w-full ">
            {/* Search bar */}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm deal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-full md:w-56"
              />
            </div>

            {/* Filter dropdown (only in list mode) */}
            {(viewMode === "list" || viewMode==="card") && (
              <div className="w-full items-center gap-3">
                <DropdownOptions
                  options={FILTER_OPTIONS}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  width="lg:w-44 w-full"
                  placeholder="Lọc trạng thái"
                />
              </div>
            )}

            <Button
              onClick={handleCreateDeal}
              variant="actionCreate"
              className="gap-2 flex-1 w-full md:ww-auto"
            >
              <Plus className="w-4 h-4" /> Thêm Lead
            </Button>
          </div>
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

      {/* Main content: toggle between Kanban board and Leads list */}
      {viewMode === "kanban" && (
        <>
          {/* Kanban board */}
          <div
            ref={kanbanBoardRef}
            className="flex-1 min-h-0 flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth"
          >
            {order.map((colId) => {
              const column = columns.find((c) => c.id === colId) || {
                id: colId,
                title: colId,
                count: 0,
              };
              return (
                <div key={colId} className="flex-shrink-0 w-64">
                  <KanbanColumn
                    column={column}
                    cards={getCardsByStage(colId)}
                    onCardView={handleCardView}
                    onCardEdit={handleCardEdit}
                    onCardDelete={handleCardDelete}
                    onCardRescore={handleRescore}
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

          {/* Dialogs used by Kanban */}
          <AppDialog
            open={modal.open}
            onClose={closeModal}
            title={{
              view: `Chi tiết deal - ${modal.deal?.title || ""}`,
              edit: modal.deal
                ? `Chỉnh sửa deal - ${modal.deal.title}`
                : "Thêm deal mới",
            }}
            mode={modal.mode}
            FormComponent={DealForm}
            data={modal.deal}
            loading={modal.loading}
            onSave={handleSave}
            onDelete={handleCardDelete}
            setMode={(newMode) => {
              setModal((prev) => ({ ...prev, mode: newMode }));
            }}
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
                onCancel={closeOrderModal}
                showRecommendations={true}
                recommendations={recommendedProducts}
                paymentLabels={{
                  credit_card: "Thẻ",
                  paypal: "PayPal",
                  bank_transfer: "Chuyển khoản",
                  cash_on_delivery: "COD",
                }}
                statusLabels={{
                  paid: "Đã thanh toán",
                  pending: "Chờ xử lý",
                  cancelled: "Đã hủy",
                  refunded: "Đã hoàn tiền",
                  failed: "Thanh toán thất bại",
                  processing: "Đang xử lý",
                  shipped: "Đã giao hàng",
                  completed: "Hoàn tất",
                }}
              />
            )}
            maxWidth="sm:max-w-5xl"
          />
        </>
      )}

      {viewMode === "list" && (
        // List view: render LeadsPage without its header, pass controlled props
        <div className="flex-1 overflow-auto">
          <LeadsPage
            showHeader={false}
            externalFilterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            externalSearchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            externalViewMode="table"
          />
        </div>
      )}
      {viewMode === "card" && (
        // List view: render LeadsPage without its header, pass controlled props
        <div className="flex-1 overflow-auto">
          <LeadsPage
            showHeader={false}
            externalFilterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            externalSearchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            externalViewMode="card"
          />
        </div>
      )}
      
    </div>
  );
}

//Tách riêng thẻ thống kê
const StatCard = ({ icon, bg, label, value, prev, animate, formatter }) => (
  <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
    <div
      className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      {animate ? (
        <CountUp
          end={value}
          start={prev}
          duration={0.6}
          formattingFn={formatter}
          className="text-lg font-bold text-gray-900"
        />
      ) : (
        <p className="text-lg font-bold text-gray-900">{formatter(value)}</p>
      )}
    </div>
  </div>
);
