import React from "react";
import EmailEditor from "./EmailEditor";

/**
 * Props:
 * - selected: { type: 'trigger'|'action', key: string } | null
 * - currentTrigger
 * - currentAction
 * - updateEmailConfig(patch)
 * - onGenEmailAI()   // optional
 */
export default function InspectorBody({
  selected,
  currentTrigger,
  currentAction,
  updateEmailConfig,
  onGenEmailAI,
}) {
  if (!selected) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Chọn một Trigger hoặc Action ở khung bên trái để cấu hình.
      </div>
    );
  }

  // ===== Trigger =====
  if (selected.type === "trigger") {
    return (
      <div className="p-4 space-y-3">
        <div className="text-sm">
          <span className="font-medium text-gray-900">Trigger:</span>{" "}
          {currentTrigger?.label || currentTrigger?.key}
        </div>
        <div className="text-xs text-gray-500">
          (UI điều kiện trigger chưa được triển khai)
        </div>
      </div>
    );
  }

  // ===== Action =====
  if (selected.type === "action") {
    const actionKey = (currentAction?.key || currentAction?.action_type || "").toLowerCase();

    // Hợp nhất cả hai khóa "email" và "send_email"
    const isEmail = actionKey === "send_email" || actionKey === "email";

    if (isEmail) {
      return (
        <div className="p-0">
          <EmailEditor
            value={currentAction?.config || {}}
            onChange={(val) => updateEmailConfig?.(val)}
            onGenAI={onGenEmailAI}
          />
        </div>
      );
    }

    // Các action khác chưa có UI riêng
    return (
      <div className="p-4 text-sm text-gray-500 border rounded-xl m-4">
        Chưa có cấu hình cho hành động: <b>{currentAction?.label || actionKey}</b>.
      </div>
    );
  }

  return null;
}
