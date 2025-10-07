import React, { useRef, useState, useEffect } from "react";

export default function AutoScrollDrag() {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollSpeed = 10; // px per frame
  const edgeThreshold = 50; // px from edge

  useEffect(() => {
    if (!isDragging) return;

    let animationFrame;

    const handleAutoScroll = (e) => {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const y = e.clientY;
      const x = e.clientX;

      // Tính toán hướng cuộn
      let scrollX = 0;
      let scrollY = 0;

      if (y - rect.top < edgeThreshold) scrollY = -scrollSpeed;
      else if (rect.bottom - y < edgeThreshold) scrollY = scrollSpeed;

      if (x - rect.left < edgeThreshold) scrollX = -scrollSpeed;
      else if (rect.right - x < edgeThreshold) scrollX = scrollSpeed;

      container.scrollBy(scrollX, scrollY);
      animationFrame = requestAnimationFrame(() => handleAutoScroll(e));
    };

    const handleMove = (e) => {
      cancelAnimationFrame(animationFrame);
      handleAutoScroll(e);
    };

    const handleUp = () => {
      cancelAnimationFrame(animationFrame);
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="w-[600px] h-[400px] overflow-auto border p-4"
      style={{ position: "relative", whiteSpace: "nowrap" }}
    >
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setIsDragging(true)}
          className="inline-block w-[150px] h-[150px] bg-blue-100 border rounded-lg mx-2 cursor-grab active:cursor-grabbing"
        >
          Card {i + 1}
        </div>
      ))}
    </div>
  );
}
