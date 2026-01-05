import { useState, useMemo } from "react";
import AppDialog from "@/components/dialogs/AppDialog";
import { createCronJob } from "@/services/AutomationCronJob";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildCronExpr, formatCron } from "./cronHelper";

export default function CreateCronJobModal({ open, onClose, onCreated }) {
    const [form, setForm] = useState({
        job_key: "",
        name: "",
        type: "daily",        // daily | weekly | monthly
        hour: "9",
        minute: "0",
        daysOfWeek: [],       // weekly
        timezone: "Asia/Ho_Chi_Minh",
    });

    const cronExpr = useMemo(
        () => buildCronExpr(form),
        [form]
    );

    const preview = useMemo(
        () => formatCron(cronExpr),
        [cronExpr]
    );

    const toggleDay = (d) => {
        setForm((f) => ({
            ...f,
            daysOfWeek: f.daysOfWeek.includes(d)
                ? f.daysOfWeek.filter((x) => x !== d)
                : [...f.daysOfWeek, d],
        }));
    };

    const submit = async () => {
        if (!form.job_key || !form.name) {
            alert("Nhập job_key và tên cron job");
            return;
        }

        await createCronJob({
            job_key: form.job_key,
            name: form.name,
            cron_expr: cronExpr,
            timezone: form.timezone,
            event_type: "cron.daily",
            enabled: true,
        });

        onCreated?.();
        onClose?.();
    };

    return (
        <AppDialog
            open={open}
            onClose={onClose}
            title="Tạo lịch chạy tự động"
            FormComponent={() => (
                <div className="space-y-4">
                    <Input
                        placeholder="job_key (vd: daily_inactive_customer)"
                        value={form.job_key}
                        onChange={(e) => setForm({ ...form, job_key: e.target.value })}
                    />

                    <Input
                        placeholder="Tên lịch chạy"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

                    {/* Type */}
                    <div className="space-y-1">
                        <div className="text-sm font-medium">Lặp lại</div>
                        <select
                            className="w-full border rounded px-2 py-1"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="daily">Hàng ngày</option>
                            <option value="weekly">Hàng tuần</option>
                            <option value="monthly">Hàng tháng</option>
                        </select>
                    </div>

                    {/* Time */}
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={23}
                            value={form.hour}
                            onChange={(e) => setForm({ ...form, hour: e.target.value })}
                        />
                        <span className="self-center">:</span>
                        <Input
                            type="number"
                            min={0}
                            max={59}
                            value={form.minute}
                            onChange={(e) => setForm({ ...form, minute: e.target.value })}
                        />
                    </div>

                    {/* Weekly */}
                    {form.type === "weekly" && (
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => toggleDay(d)}
                                    className={`px-2 py-1 border rounded text-sm ${form.daysOfWeek.includes(d)
                                            ? "bg-blue-600 text-white"
                                            : "bg-white"
                                        }`}
                                >
                                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d]}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Preview */}
                    <div className="text-sm bg-gray-50 border rounded p-2">
                        <strong>Sẽ chạy:</strong> {preview}
                    </div>

                    <Button className="w-full" onClick={submit}>
                        Tạo cron job
                    </Button>
                </div>
            )}
        />
    );
}
