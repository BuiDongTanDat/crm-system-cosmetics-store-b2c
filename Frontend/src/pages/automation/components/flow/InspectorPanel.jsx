import React from "react";
import InspectorHeader from "./InspectorHeader";
import InspectorBody from "./InspectorBody";

export default function InspectorPanel({
  selected,
  currentTrigger,
  currentAction,
  toggleTrigger,
  updateEmailConfig,
  onGenEmailAI,
}) {
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
        onGenEmailAI={onGenEmailAI} // NEW
      />
    </div>
  );
}
