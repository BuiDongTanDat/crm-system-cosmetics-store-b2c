import React from "react";
import Toggle from "./Toggle";

export default function InspectorHeader({ selected, currentTrigger, currentAction, toggleTrigger }) {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-3">
        {currentTrigger?.icon && selected?.type === "trigger" && (
          <currentTrigger.icon className="w-5 h-5 text-brand-600" />
        )}
        {currentAction?.icon && selected?.type === "action" && (
          <currentAction.icon className="w-5 h-5 text-brand-600" />
        )}
        <div>
          <div className="font-medium text-gray-900 line-clamp-1">
            {selected?.type === "trigger"
              ? currentTrigger?.label || "Chưa chọn Trigger"
              : selected?.type === "action"
              ? currentAction?.label || "Chưa chọn Hành động"
              : "Chưa chọn mục nào"}
          </div>
          <div className="text-xs text-gray-500 line-clamp-1">
            {selected?.type
              ? "Cấu hình chi tiết"
              : "Hãy thêm và chọn một Trigger/Hành động để cấu hình"}
          </div>
        </div>
      </div>
      {selected?.type === "trigger" && currentTrigger && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Kích hoạt</span>
          <Toggle
            checked={!!currentTrigger?.enabled}
            onChange={() => toggleTrigger(currentTrigger.key)}
          />
        </div>
      )}
    </div>
  );
}
