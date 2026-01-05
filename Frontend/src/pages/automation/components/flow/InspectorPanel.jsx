import React, { useState } from "react";
import InspectorHeader from "./InspectorHeader";
import InspectorBody from "./InspectorBody";

export default function InspectorPanel({
  selected,
  currentTrigger,
  currentAction,
  toggleTrigger,
  updateEmailConfig,
  updateTriggerConfig,
  updateActionConfig,
  onGenEmailAI,
  actionTypes,
}) {
  // state modal tạo cron job để Body dùng
  const [showCreateCron, setShowCreateCron] = useState(false);

  return (
    <div className="rounded-2xl border bg-white">
      <InspectorHeader
        selected={selected}
        currentTrigger={currentTrigger}
        currentAction={currentAction}
        toggleTrigger={toggleTrigger}
      />

      <InspectorBody
        selected={selected}
        currentTrigger={currentTrigger}
        currentAction={currentAction}
        updateEmailConfig={updateEmailConfig}
        updateTriggerConfig={updateTriggerConfig}
        updateActionConfig={updateActionConfig}
        onGenEmailAI={onGenEmailAI}
        actionTypes={actionTypes}
        showCreateCron={showCreateCron}
        setShowCreateCron={setShowCreateCron}
      />
    </div>
  );
}
