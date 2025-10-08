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
  animatedData = null,      // { startCount, endCount, startTotal, endTotal }
  initialAnimate = false,   // animate from 0 on initial load
  isDraggingBoard = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef(null);

  // compute totals
  const totalValue = cards.reduce((sum, c) => sum + (c.value || 0), 0);

  // Determine animation sources
  const shouldAnimateCount = Boolean(animatedData) || initialAnimate;
  const shouldAnimateTotal = Boolean(animatedData) || initialAnimate;

  const countStart = animatedData ? animatedData.startCount : (initialAnimate ? 0 : cards.length);
  const countEnd = animatedData ? animatedData.endCount : cards.length;

  const totalStart = animatedData ? animatedData.startTotal : (initialAnimate ? 0 : totalValue);
  const totalEnd = animatedData ? animatedData.endTotal : totalValue;

  // Drag handlers for column container (kept from original)
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
        data-column-header
        className={`${column.headerColor} text-white p-2 rounded-t-lg flex-shrink-0 ${
          isDraggingBoard ? 'cursor-grabbing' : 'cursor-grab'
        } select-none`}
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
        className={`flex-1 p-1 space-y-2 overflow-y-auto rounded-b-lg border ${isDragOver ? "bg-blue-50 border-2 border-blue-300 border-dashed" : "border-transparent"}`}
        style={{ height: "calc(100vh - 280px)", scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 #F1F5F9", scrollBehavior: "smooth" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {cards.map(card => (
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

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-xs">
            Kéo deal vào đây
          </div>
        )}
      </div>
    </div>
  );
}
