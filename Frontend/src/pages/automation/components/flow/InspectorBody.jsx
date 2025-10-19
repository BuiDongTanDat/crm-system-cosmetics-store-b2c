import React from "react";
import EmailEditor from "./EmailEditor";

//Redner nội dung của bảng điều khiển 
export default function InspectorBody({ selected, currentTrigger, currentAction, updateEmailConfig }) {
  if (!selected) {
    return (
      <div className="p-4 text-sm text-gray-600">
        Chưa có mục nào được chọn.
      </div>
    );
  }
  if (selected.type === "action" && currentAction?.key === "email") {
    return (
      <EmailEditor
        value={currentAction.config || {}}
        onChange={updateEmailConfig}
      />
    );
  }
  return (
    <div className="p-4 space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">
          {selected.type === "trigger" ? "Trigger" : "Hành động"}
        </h4>
        <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-4 text-sm text-gray-600">
          CHưa có cấu hình cho mục này.
        </div>
      </div>
    </div>
  );
}
