import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCron } from "./cronHelper";

export default function CronJobMultiSelect({
  value = [],
  options = [],
  loading = false,
  onChange,
  onCreate,
}) {
  const toggle = (jobKey) => {
    onChange(
      value.includes(jobKey)
        ? value.filter((k) => k !== jobKey)
        : [...value, jobKey]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Lịch chạy</div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Tạo lịch
        </Button>
      </div>

      <div className="border rounded-lg divide-y">
        {loading && <div className="p-3 text-sm text-gray-400">Loading…</div>}

        {!loading && options.length === 0 && (
          <div className="p-3 text-sm text-gray-400">
            Chưa có lịch chạy
          </div>
        )}

        {options.map((j) => {
          const checked = value.includes(j.job_key);
          return (
            <div
              key={j.job_key}
              onClick={() => toggle(j.job_key)}
              className={`flex gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                checked ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-5">
                {checked && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              <div>
                <div className="text-sm font-medium">{j.name}</div>
                <div className="text-xs text-gray-500">
                  {formatCron(j.cron_expr)} · {j.timezone}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
