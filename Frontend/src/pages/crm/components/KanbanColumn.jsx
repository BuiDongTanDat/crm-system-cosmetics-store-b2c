import React, { useRef, useEffect, useState } from "react";
import KanbanCard from "./KanbanCard";
import { formatCurrency } from "@/utils/helper";
import CountUp from "react-countup";

export default function KanbanColumn({
  column,
  cards,
  recentlyMovedCards,
  onCardView,
  onCardEdit,
  onCardDelete,
  onDrop,
  onDragStart,
  animatedData = null, // { startCount, endCount, startTotal, endTotal }
  initialAnimate = false, // animate from 0 on initial load
  isDraggingBoard = false,
  isCardDragging = false, // new prop from parent: đang kéo card hay không
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAll, setShowAll] = useState(false); // 👈 toggle hiển thị thêm
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const draggingState = useRef({ active: false, startX: 0, startScroll: 0, boardEl: null });

  // tìm phần tử scrollable ngang (board) từ node hiện tại
  const findHorizontalScrollParent = (node) => {
    let el = node;
    while (el) {
      try {
        const style = window.getComputedStyle(el);
        const overflowX = style && style.overflowX;
        if ((overflowX === "auto" || overflowX === "scroll" || el.scrollWidth > el.clientWidth) && el.scrollWidth > el.clientWidth) {
          return el;
        }
      } catch (e) {}
      el = el.parentElement;
    }
    return null;
  };

  const stopHeaderDrag = () => {
    if (!draggingState.current.active) return;
    draggingState.current.active = false;
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onHeaderMouseMove);
    window.removeEventListener("mouseup", onHeaderMouseUp);
    window.removeEventListener("touchmove", onHeaderTouchMove);
    window.removeEventListener("touchend", onHeaderTouchEnd);
  };

  const onHeaderMouseMove = (e) => {
    if (!draggingState.current.active) return;
    const dx = e.clientX - draggingState.current.startX;
    const board = draggingState.current.boardEl;
    if (board) board.scrollLeft = Math.max(0, Math.min(board.scrollWidth - board.clientWidth, draggingState.current.startScroll - dx));
  };
  const onHeaderMouseUp = () => stopHeaderDrag();

  const onHeaderTouchMove = (e) => {
    if (!draggingState.current.active) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = t.clientX - draggingState.current.startX;
    const board = draggingState.current.boardEl;
    if (board) board.scrollLeft = Math.max(0, Math.min(board.scrollWidth - board.clientWidth, draggingState.current.startScroll - dx));
  };
  const onHeaderTouchEnd = () => stopHeaderDrag();

  const startHeaderDrag = (clientX, originNode) => {
    if (isCardDragging) return; // không bắt drag header khi đang kéo card
    const board = findHorizontalScrollParent(originNode);
    if (!board) return;
    draggingState.current = { active: true, startX: clientX, startScroll: board.scrollLeft, boardEl: board };
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onHeaderMouseMove);
    window.addEventListener("mouseup", onHeaderMouseUp);
    window.addEventListener("touchmove", onHeaderTouchMove, { passive: false });
    window.addEventListener("touchend", onHeaderTouchEnd);
  };

  useEffect(() => {
    return () => {
      stopHeaderDrag();
    };
  }, []);

  // 1️⃣ Sắp xếp khác nhau theo loại cột
  const sortCards = (cards) => {
    const isClosedCol = ["converted", "closed_lost"].includes(column.id);

    if (isClosedCol) {
      // Sắp xếp mới nhất (closedAt hoặc createdDate giảm dần)
      return [...cards].sort((a, b) => {
        const da = new Date(a.closedAt || a.lastActivity || a.createdDate || 0).getTime();
        const db = new Date(b.closedAt || b.lastActivity || b.createdDate || 0).getTime();
        return db - da; // mới nhất trước
      });
    } else {
      // Giữ logic sắp xếp cũ (priority, leadScore, conversionProb, value, date)
      const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 };
      const getPriorityWeight = (p) => PRIORITY_WEIGHT[(p || "").toLowerCase()] || 0;
      const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);

      return [...cards].sort((a, b) => {
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
    }
  };

  // 2️⃣ Giới hạn hiển thị tối đa 7 deal nếu là cột closed/converted
  const MAX_VISIBLE = 7;
  const sortedCards = sortCards(cards);
  const isClosedCol = ["converted", "closed_lost"].includes(column.id);
  const visibleCards = isClosedCol && !showAll ? sortedCards.slice(0, MAX_VISIBLE) : sortedCards;

  // 3️⃣ Tổng giá trị và count
  const totalValue = sortedCards.reduce((sum, c) => sum + (c.value || 0), 0);
  const countEnd = sortedCards.length;

  const shouldAnimateCount = Boolean(animatedData) || initialAnimate;
  const shouldAnimateTotal = Boolean(animatedData) || initialAnimate;
  const countStart = animatedData ? animatedData.startCount : initialAnimate ? 0 : countEnd;
  const totalStart = animatedData ? animatedData.startTotal : initialAnimate ? 0 : totalValue;
  const totalEnd = animatedData ? animatedData.endTotal : totalValue;

  // Drag handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
      setIsDragOver(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cardId = e.dataTransfer.getData("text/plain");
    onDrop(cardId, column.id);
    setIsDragOver(false);
  };
  const handleDragStartLocal = (e, card) => {
    e.dataTransfer.setData("text/plain", card.id);
    if (onDragStart) onDragStart();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div
        ref={headerRef}
        data-column-header
        className={`${column.headerColor} text-white p-2 rounded-t-lg flex-shrink-0 ${isDraggingBoard ? "cursor-grabbing" : "cursor-grab"
          } select-none`}
        onMouseDown={(e) => {
          if (e.button && e.button !== 0) return;
          startHeaderDrag(e.clientX, e.target);
        }}
        onTouchStart={(e) => {
          const t = e.touches && e.touches[0];
          if (!t) return;
          startHeaderDrag(t.clientX, e.target);
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-xs uppercase tracking-wide">{column.title}</h3>
          <span className="bg-white/20 px-2 py-[1px] rounded-full text-[10px]">
            {shouldAnimateCount && countStart !== countEnd ? (
              <CountUp start={countStart} end={countEnd} duration={0.45} redraw={true} />
            ) : (
              countEnd
            )}
          </span>
        </div>
        <p className="text-end text-[13px] opacity-80 truncate">
          {shouldAnimateTotal && totalStart !== totalEnd ? (
            <CountUp
              start={totalStart}
              end={totalEnd}
              duration={0.8}
              redraw={true}
              formattingFn={(value) => formatCurrency(Math.floor(value))}
            />
          ) : (
            formatCurrency(totalEnd)
          )}
        </p>
      </div>

      {/* Cards Container */}
      <div
        ref={containerRef}
        className={`flex-1 p-1 space-y-2 overflow-y-auto rounded-b-lg border ${isDragOver ? "bg-blue-50 border-2 border-blue-300 border-dashed" : "border-transparent"
          }`}
        style={{
          height: "calc(100vh - 280px)",
          scrollbarWidth: "thin",
          scrollbarColor: "#CBD5E1 #F1F5F9",
          scrollBehavior: "smooth",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {visibleCards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            isRecentlyMoved={recentlyMovedCards?.has(card.id)}
            onView={onCardView}
            onEdit={onCardEdit}
            onDelete={onCardDelete}
            onDragStart={(e) => handleDragStartLocal(e, card)}
          />
        ))}

        {sortedCards.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-xs">
            Kéo deal vào đây
          </div>
        )}

        {/* Nút xem thêm / ẩn bớt */}
        {isClosedCol && sortedCards.length > MAX_VISIBLE && (
          <div className="flex justify-center mt-2">
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll
                ? "Ẩn bớt"
                : `Xem thêm (${sortedCards.length - MAX_VISIBLE})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
