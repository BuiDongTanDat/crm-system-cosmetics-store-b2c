import { GripVertical } from "lucide-react";
import React from "react";

export const Block = React.forwardRef(({
  icon: Icon,
  label,
  active,
  onClick,
  right,
  muted,
  attributes,
  listeners,
  style,
  isDragging
}, ref) => (
  <div
    ref={ref}
    style={style}
    onClick={onClick}
    className={
      "group relative w-full flex items-center justify-between px-3 py-3 mb-2 rounded-xl border text-left transition shadow-sm " +
      (active
        ? "border-brand-500 bg-brand-50/80 ring-1 ring-brand-500 "
        : "border-gray-200 hover:border-brand-300 hover:bg-gray-50 ") +
      (muted ? " opacity-60" : "") +
      (isDragging ? " z-50 opacity-50 shadow-lg cursor-grabbing" : " cursor-grab active:cursor-grabbing")
    }
    {...attributes}
    {...listeners}
  >
    <div className="flex items-center gap-3 pointer-events-none">
      {/* Visual hint only, no listeners here */}
      <div className="text-gray-400 group-hover:text-brand-500 transition-colors p-1">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900 line-clamp-1">
          {label}
        </div>
        <div className="text-[11px] text-gray-500 line-clamp-1">Hành động tự động</div>
      </div>
    </div>
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {right}
    </div>
  </div>
));