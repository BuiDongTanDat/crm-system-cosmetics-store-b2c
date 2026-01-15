import React, { useEffect, useMemo, useState } from "react";
import BasicConfigForm from "./BasicConfigForm";
import AvailableVariablesPanel from "./AvailableVariablesPanel";
import CronJobMultiSelect from "./CronJobMultiSelect";
import CreateCronJobModal from "./CreateCronJobModal";
import { getCronJobs } from "@/services/AutomationCronJob";
import ConditionBuilder from "./ConditionBuilder";
import { getFieldsForEvent } from "./conditionCatalog";
import ActionRenderer from "./ActionRenderer";
import { parseVariables } from "./AvailableVariablesPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function InspectorBody({
  selected,
  currentTrigger,
  currentAction,
  updateEmailConfig,
  updateTriggerConfig,
  updateActionConfig,
  onGenEmailAI,
  actionTypes,
  showCreateCron,
  setShowCreateCron,
}) {
  const [cronJobs, setCronJobs] = useState([]);
  const [cronJobsLoading, setCronJobsLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const trig = currentTrigger || {};
  const trigEvent = (trig.event_type || trig.key || "").trim();

  const availableVariables = useMemo(() => {
    return parseVariables(trig?.payload_schema);
  }, [trig?.payload_schema]);

  const cond = trig.conditions || {};
  const isCronTrigger = trigEvent === "cron.daily";

  const fieldsForEvent = useMemo(() => {
    if (!trigEvent || isCronTrigger) return [];
    return getFieldsForEvent(trigEvent) || [];
  }, [trigEvent, isCronTrigger]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!isCronTrigger) return;
      setCronJobsLoading(true);
      try {
        const rows = await getCronJobs();
        if (!alive) return;
        setCronJobs(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("[InspectorBody] load cron jobs failed:", e);
        if (alive) setCronJobs([]);
      } finally {
        if (alive) setCronJobsLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [isCronTrigger]);

  const cronJobOptions = useMemo(() => {
    return (cronJobs || []).map((j) => ({
      ...j,
      label: j.name ? `${j.name} (${j.job_key})` : j.job_key,
    }));
  }, [cronJobs]);

  const currentJobKeys = useMemo(() => {
    const filters = trig?.conditions?.filters;
    if (!Array.isArray(filters) || filters.length === 0) return [];
    const val = filters?.[0]?.value;
    return Array.isArray(val) ? val : [];
  }, [trig]);

  const updateJobKeys = (keys) => {
    updateTriggerConfig?.({
      filters: [
        {
          path: "trigger.job_key",
          op: "in",
          value: keys,
        },
      ],
    });
  };

  const handleCronCreatedOrUpdated = async () => {
    setCronJobsLoading(true);
    setEditingJob(null);
    setShowCreateCron?.(false);
    try {
      const rows = await getCronJobs();
      setCronJobs(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("[InspectorBody] reload cron jobs failed:", e);
    } finally {
      setCronJobsLoading(false);
    }
  };

  if (!selected) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Chọn một Trigger hoặc Action ở khung bên trái để cấu hình.
      </div>
    );
  }

  const handleRenderNestedAction = (nestedAction, onNestedChange) => {
    const safeAction = nestedAction || {};
    const actionKey = (safeAction.action_type || safeAction.key || "").toLowerCase();
    const actionDef = actionTypes?.find((a) => a.key === actionKey);

    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mt-2">
        <div className="mb-2">
          <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Nested Action Type</label>
          <Select value={actionKey} onValueChange={(val) => onNestedChange({ ...safeAction, action_type: val, key: val, content: {} })}>
            <SelectTrigger className="h-8 bg-white"><SelectValue placeholder="Select action type" /></SelectTrigger>
            <SelectContent>
              {actionTypes?.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  <div className="flex items-center gap-2">{t.icon && <t.icon className="w-3 h-3" />}<span>{t.label}</span></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!!actionKey && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <ActionRenderer
              action={{ ...safeAction, action_type: actionKey, content: safeAction.config || safeAction.content || {} }}
              updateActionConfig={(newContent) => onNestedChange({ ...safeAction, content: newContent })}
              actionTypes={actionTypes}
              renderNestedAction={handleRenderNestedAction}
              availableVariables={availableVariables}
            />
          </div>
        )}
      </div>
    );
  };

  if (selected.type === "trigger") {
    return (
      <div className="p-4 space-y-3">
        <div className="text-sm border-b pb-2 mb-2">
          <div className="font-medium text-gray-900">Trigger: {trig?.label || trigEvent}</div>
          {trig?.description && <div className="text-xs text-gray-500 mt-1">{trig.description}</div>}
        </div>

        {isCronTrigger ? (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Cron Jobs</div>
                <div className="text-xs text-gray-500 mt-1">Chọn các job_key sẽ kích hoạt flow này.</div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50"
                onClick={() => { setEditingJob(null); setShowCreateCron?.(true); }}
              >
                Tạo Cron Job
              </button>
            </div>
            <CronJobMultiSelect
              value={currentJobKeys}
              options={cronJobOptions}
              loading={cronJobsLoading}
              onChange={updateJobKeys}
              onCreate={() => { setEditingJob(null); setShowCreateCron?.(true); }}
              onEdit={(job) => { setEditingJob(job); setShowCreateCron?.(true); }}
            />
            <CreateCronJobModal
              open={!!showCreateCron}
              onClose={() => { setShowCreateCron?.(false); setEditingJob(null); }}
              onCreated={handleCronCreatedOrUpdated}
              initialData={editingJob}
            />
          </div>
        ) : (
          <>
            {fieldsForEvent.length > 0 ? (
              <ConditionBuilder title="Conditions" subtitle="Thiết lập điều kiện theo rule." fields={fieldsForEvent} value={cond} onChange={(nextCond) => updateTriggerConfig?.(nextCond)} />
            ) : (
              <div className="rounded-lg border p-3">
                <div className="text-sm font-semibold mb-2">Conditions</div>
                <textarea
                  className="w-full min-h-[180px] text-xs font-mono border rounded p-2"
                  value={JSON.stringify(cond || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value || "{}");
                      updateTriggerConfig?.(parsed);
                    } catch { }
                  }}
                />
              </div>
            )}
          </>
        )}
        {trig?.payload_schema && <AvailableVariablesPanel schema={trig.payload_schema} />}
      </div>
    );
  }

  if (selected.type === "action") {
    return (
      <div className="p-4 space-y-3">
        <div className="text-sm border-b pb-2 mb-2">
          <div className="font-medium text-gray-900">Action: {currentAction?.label || currentAction?.key}</div>
          {currentAction?.description && <div className="text-xs text-gray-500 mt-1">{currentAction.description}</div>}
        </div>
        <ActionRenderer
          action={currentAction}
          updateActionConfig={(newContent) => updateActionConfig?.(newContent)}
          actionTypes={actionTypes}
          renderNestedAction={handleRenderNestedAction}
          availableVariables={availableVariables}
        />
      </div>
    );
  }

  return null;
}
