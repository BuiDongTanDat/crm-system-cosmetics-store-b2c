// frontend/src/components/automation/ActionHelpPanel.jsx
import React from "react";

export default function ActionHelpPanel({ help }) {
  if (!help) return null;

  return (
    <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
      <div className="text-xs font-semibold text-gray-800">Cách dùng</div>

      {help.when && (
        <div className="text-xs text-gray-700">
          <span className="font-medium">Khi nào dùng:</span> {help.when}
        </div>
      )}

      {Array.isArray(help.inputs) && help.inputs.length > 0 && (
        <div className="text-xs text-gray-700">
          <div className="font-medium mb-1">Tham số:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {help.inputs.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}

      {Array.isArray(help.tips) && help.tips.length > 0 && (
        <div className="text-xs text-gray-700">
          <div className="font-medium mb-1">Gợi ý:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {help.tips.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}

      {help.example && (
        <div className="text-xs text-gray-700">
          <div className="font-medium mb-1">Ví dụ:</div>
          <pre className="text-[11px] bg-white border rounded p-2 overflow-auto">
            {JSON.stringify(help.example, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
