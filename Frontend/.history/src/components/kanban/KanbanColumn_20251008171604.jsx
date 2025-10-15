// KanbanColumn.jsx
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
}) {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedCard, setDraggedCard] = useState(null);
  const [prevTotalValue, setPrevTotalValue] = useState(0);
  const [shouldAnimateValue, setShouldAnimateValue] = useState(false);

  // Tổng giá trị cột
  const totalValue = cards.reduce((sum, c) => sum + (c.value || 0), 0);

  // Track value changes for animation
  useEffect(() => {
    if (prevTotalValue !== totalValue && prevTotalValue !== 0) {
      setShouldAnimateValue(true);
      // Reset animation flag after animation completes
      const timer = setTimeout(() => setShouldAnimateValue(false), 1500);
      return () => clearTimeout(timer);
    }
    setPrevTotalValue(totalValue);
  }, [totalValue, prevTotalValue]);

  // Auto scroll cho việc kéo thả thẻ trong cột
  useEffect(() => {
    if (!isDragOver) return;

    const container = containerRef.current;
    if (!container) return;

    let animationFrame;

    const handleAutoScroll = (e) => {
      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY;
      const scrollSpeed = 50;
      const edgeThreshold = 1000;

      // Only handle vertical scrolling within this column
      if (mouseY < rect.top + edgeThreshold && container.scrollTop > 0) {
        container.scrollTop -= scrollSpeed;
      } else if (
        mouseY > rect.bottom - edgeThreshold &&
        container.scrollTop < container.scrollHeight - container.clientHeight
      ) {
        container.scrollTop += scrollSpeed;
      }

      animationFrame = requestAnimationFrame(() => handleAutoScroll(e));
    };

    const handleMove = (e) => {
      // Only trigger if mouse is within column bounds
      const rect = container.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right) {
        cancelAnimationFrame(animationFrame);
        handleAutoScroll(e);
      }
    };

    const handleEnd = () => {
      cancelAnimationFrame(animationFrame);
    };

    document.addEventListener("dragover", handleMove);
    document.addEventListener("dragend", handleEnd);
    document.addEventListener("drop", handleEnd);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("dragover", handleMove);
      document.removeEventListener("dragend", handleEnd);
      document.removeEventListener("drop", handleEnd);
    };
  }, [isDragOver]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (
      rect &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");
    onDrop(cardId, column.id);
    setIsDragOver(false);
  };

  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.setData("text/plain", card.id);
    if (onDragStart) {
      onDragStart();
    }
  };

  const handleHeaderDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const kanbanBoard = document.querySelector('[data-kanban-board]');
    if (!kanbanBoard) return;

    let startX = e.clientX;
    let scrollLeft = kanbanBoard.scrollLeft;

    const handleMouseMove = (e) => {
      const x = e.clientX - startX;
      kanbanBoard.scrollLeft = scrollLeft - x;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "grabbing";
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div
        ref={headerRef}
        className={`${column.headerColor} text-white p-2 rounded-t-lg flex-shrink-0 cursor-grab active:cursor-grabbing`}
        onMouseDown={handleHeaderDragStart}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-xs uppercase tracking-wide">
            {column.title}
          </h3>

          <span className="bg-white/20 px-2 py-[1px] rounded-full text-[10px]">
            <CountUp
              end={cards.length}
              duration={0.5}
              preserveValue
            />
          </span>
        </div>
        <p className="text-end text-[13px] opacity-80 truncate">
          {shouldAnimateValue ? (
            <CountUp
              end={totalValue}
              start={prevTotalValue}
              duration={0.5}
              formattingFn={(value) => formatCurrency(Math.floor(value))}
              preserveValue
            />
          ) : (
            formatCurrency(totalValue)
          )}
        </p>
      </div>

      {/* Cards Container */}
      <div
        ref={containerRef}
        className={`flex-1 p-1 space-y-2 overflow-y-auto rounded-b-lg border  ${isDragOver
          ? "bg-blue-50  border-2 border-blue-300 border-dashed"
          : "border-transparent"
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
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            isRecentlyMoved={recentlyMovedCards?.has(card.id)}
            onView={onCardView}
            onEdit={onCardEdit}
            onDelete={onCardDelete}
            onDragStart={(e) => handleDragStart(e, card)}
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
