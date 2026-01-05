// frontend/src/components/automation/ActionRenderer.jsx
import React, { useMemo } from "react";
import BasicConfigForm from "./BasicConfigForm";
import ActionHelpPanel from "./ActionHelpPanel";
import StandardQueryConditionsBuilder from "./StandardQueryConditionsBuilder";
import { ACTION_CATALOG, normalizeSchema } from "./actionCatalog";
import { generateEmailContent } from "@/services/automation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wand2 } from "lucide-react";

/**
 * Sub-component for Send Email to handle its own local AI state
 */
function SendEmailAction({ action, updateActionConfig, def, actionTypes, renderNestedAction, availableVariables }) {
  const content = action?.content || action?.config || {};
  const [aiContext, setAiContext] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  const sendEmailForm = useMemo(() => {
    return ACTION_CATALOG.send_email.mapFromContent(content);
  }, [content]);

  const patchContent = (patch) => {
    updateActionConfig?.({ ...content, ...patch });
  };

  const handleGenAI = async () => {
    if (!aiContext.trim()) return;
    setAiLoading(true);
    try {
      const res = await generateEmailContent({
        input: { context: aiContext, purpose: "promotion" },
        options: { simple: true }
      });

      const generated = res?.data?.body || res?.body || res?.result?.body || "";
      if (generated) {
        patchContent({
          email: {
            ...(content.email || {}),
            message: generated
          }
        });
      }
    } catch (e) {
      console.error("AI Gen failed:", e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <ActionHelpPanel help={def.help} />

      <div className="rounded-lg border p-3 bg-blue-50/50 space-y-2">
        <div className="text-xs font-semibold flex items-center gap-1.5 text-blue-700">
          <Wand2 className="w-3 h-3" />
          Quick AI Message Generate
        </div>
        <div className="flex gap-2">
          <Input
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            placeholder="e.g. Viết mail chào mừng khách mới..."
            className="text-xs h-8 bg-white"
          />
          <Button
            size="sm"
            variant="actionAI"
            className="h-8 text-xs"
            onClick={handleGenAI}
            disabled={aiLoading}
          >
            {aiLoading ? "..." : "Gen"}
          </Button>
        </div>
      </div>

      <BasicConfigForm
        schema={def.fields}
        value={sendEmailForm}
        onChange={(form) => {
          const mapped = def.mapToContent(form);
          updateActionConfig?.({ ...content, ...mapped });
        }}
        actionTypes={actionTypes}
        renderNestedAction={renderNestedAction}
        availableVariables={availableVariables}
      />
    </div>
  );
}

export default function ActionRenderer({
  action,
  updateActionConfig,
  actionTypes,
  renderNestedAction,
  availableVariables,
}) {
  const actionKey = (action?.action_type || action?.key || "").toLowerCase();
  const def = ACTION_CATALOG[actionKey];
  const content = action?.content || action?.config || {};

  const patchContent = (patch) => {
    updateActionConfig?.({ ...content, ...patch });
  };

  if (!def) {
    const actionDef = actionTypes?.find(
      (a) => (a.key || a.action_type || "").toLowerCase() === actionKey
    );
    const schema = actionDef ? normalizeSchema(actionDef) : [];

    return (
      <div className="space-y-3">
        <div className="text-xs text-gray-500 italic">Generic Form Renderer</div>
        <BasicConfigForm
          schema={schema}
          value={content}
          onChange={(val) => updateActionConfig?.(val)}
          actionTypes={actionTypes}
          renderNestedAction={renderNestedAction}
          availableVariables={availableVariables}
        />
      </div>
    );
  }

  if (actionKey === "send_email") {
    return (
      <SendEmailAction
        action={action}
        updateActionConfig={updateActionConfig}
        def={def}
        actionTypes={actionTypes}
        renderNestedAction={renderNestedAction}
        availableVariables={availableVariables}
      />
    );
  }

  if (["query.customers", "query.leads", "query.orders"].includes(actionKey)) {
    const entityType = actionKey.split(".")[1];

    return (
      <div className="space-y-3">
        <ActionHelpPanel help={def.help} />

        <BasicConfigForm
          schema={def.fields}
          value={{
            limit: content.limit ?? 5000,
            save_to_ctx: content.save_to_ctx ?? "batch",
          }}
          onChange={(v) => patchContent(v)}
          actionTypes={actionTypes}
          renderNestedAction={renderNestedAction}
          availableVariables={availableVariables}
        />

        <div className="rounded-lg border p-3 bg-white">
          <StandardQueryConditionsBuilder
            type={entityType}
            value={content.conditions || {}}
            onChange={(conditions) => patchContent({ conditions })}
          />
        </div>
      </div>
    );
  }

  if (actionKey === "for_each") {
    const nextAction = content?.next_action || null;
    return (
      <div className="space-y-3">
        <ActionHelpPanel help={def.help} />
        <BasicConfigForm
          schema={def.fields}
          value={{
            from_path: content.from_path || "",
            item_key: content.item_key || "item",
          }}
          onChange={(v) => patchContent(v)}
          actionTypes={actionTypes}
          renderNestedAction={renderNestedAction}
          availableVariables={availableVariables}
        />
        <div className="rounded-lg border p-3 bg-white">
          <div className="text-xs font-semibold mb-2 text-brand-600">Nested Action Execution</div>
          {renderNestedAction?.(nextAction, (updatedNested) => {
            patchContent({ next_action: updatedNested });
          })}
        </div>
      </div>
    );
  }

  // Common pattern for simple actions
  return (
    <div className="space-y-3">
      <ActionHelpPanel help={def.help} />
      <BasicConfigForm
        schema={def.fields}
        value={content}
        onChange={(v) => patchContent(v)}
        actionTypes={actionTypes}
        renderNestedAction={renderNestedAction}
        availableVariables={availableVariables}
      />
    </div>
  );
}
