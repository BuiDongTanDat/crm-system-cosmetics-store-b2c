import { Check, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCron } from "./cronHelper";

export default function CronJobMultiSelect({
  value = [],
  options = [],
  loading = false,
  onChange,
  onCreate,
  onEdit,
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
        <Button variant="actionCreate" size="sm" onClick={onCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Tạo lịch
        </Button>
      </div>

      <div className="flex-col gap-2">
        {loading && <div className="p-3 text-sm text-gray-400">Loading…</div>}

        {!loading && options.length === 0 && (
          <div className="p-3 text-sm text-gray-400">Chưa có lịch chạy</div>
        )}

        {options.map((j) => {
          const checked = value.includes(j.job_key);
          return (
            <div
              key={j.job_key}
              onClick={() => toggle(j.job_key)}
              className={`my-2 border rounded-md items-center flex gap-3 px-3 py-2 cursor-pointer transition-all hover:bg-gray-50 group relative ${checked ? "bg-blue-50 border-blue-200" : "border-gray-200"
                }`}
            >
              <div className="w-5 h-5 flex items-center justify-center rounded-full border bg-white">
                <Check
                  className={`w-4 h-4 transition-colors ${checked ? "text-blue-600" : "text-transparent"
                    }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{j.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {formatCron(j.cron_expr)} • {j.timezone}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(j);
                }}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
