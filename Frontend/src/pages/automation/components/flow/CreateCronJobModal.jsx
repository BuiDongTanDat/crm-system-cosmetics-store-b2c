import { useState, useMemo, useEffect } from "react";
import AppDialog from "@/components/dialogs/AppDialog";
import { createCronJob, updateCronJob } from "@/services/AutomationCronJob";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildCronExpr, formatCron, parseCronExpr } from "./cronHelper";
import DropdownOptions from "@/components/common/DropdownOptions";

//Form laf một Component riêng
function CronJobForm({ onClose, onCreated, data }) {
    const isEdit = !!data;
    const [form, setForm] = useState({
        job_key: "",
        name: "",
        type: "daily",        // daily | weekly | monthly
        hour: "9",
        minute: "0",
        daysOfWeek: [],       // weekly
        timezone: "Asia/Ho_Chi_Minh",
    });

    useEffect(() => {
        if (data) {
            const parsed = parseCronExpr(data.cron_expr);
            setForm({
                job_key: data.job_key || "",
                name: data.name || "",
                type: parsed.type,
                hour: parsed.hour,
                minute: parsed.minute,
                daysOfWeek: parsed.daysOfWeek,
                timezone: data.timezone || "Asia/Ho_Chi_Minh",
            });
        }
    }, [data]);

    const cronExpr = useMemo(() => buildCronExpr(form), [form]);
    const preview = useMemo(() => formatCron(cronExpr), [cronExpr]);

    const repeatOptions = [
        { value: "daily", label: "Hàng ngày" },
        { value: "weekly", label: "Hàng tuần" },
        { value: "monthly", label: "Hàng tháng" },
    ];

    const toggleDay = (d) => {
        setForm((f) => ({
            ...f,
            daysOfWeek: f.daysOfWeek.includes(d)
                ? f.daysOfWeek.filter((x) => x !== d)
                : [...f.daysOfWeek, d],
        }));
    };

    const handleHourChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setForm((prev) => ({ ...prev, hour: Math.min(23, Math.max(0, val)).toString() }));
    };

    const handleMinuteChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setForm((prev) => ({ ...prev, minute: Math.min(59, Math.max(0, val)).toString() }));
    };

    const submit = async () => {
        const finalJobKey = form.job_key.trim();
        const finalName = form.name.trim();

        if (!finalJobKey) {
            alert("Vui lòng nhập Job Key");
            return;
        }
        if (!finalName) {
            alert("Vui lòng nhập Tên lịch chạy");
            return;
        }

        try {
            const payload = {
                job_key: finalJobKey,
                name: finalName,
                cron_expr: cronExpr,
                timezone: form.timezone,
                event_type: isEdit ? data.event_type : "cron.daily",
                enabled: true,
            };

            if (isEdit) {
                await updateCronJob(data.job_key, payload);
            } else {
                await createCronJob(payload);
            }

            onCreated?.();
            onClose?.();
        } catch (error) {
            console.error("Lỗi khi tạo/cập nhật cron job:", error);
            alert(error.message || "Lỗi thao tác");
        }
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-1">
                <label className="text-sm font-medium">Job Key</label>
                <Input
                    variant="normal"
                    disabled={isEdit}
                    placeholder="vd: daily_inactive_customer"
                    value={form.job_key}
                    onChange={(e) => setForm({ ...form, job_key: e.target.value })}
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium">Tên lịch chạy</label>
                <Input
                    variant="normal"
                    placeholder="Tên lịch chạy"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
            </div>

            <div className="space-y-1">
                <div className="text-sm font-medium">Lặp lại</div>
                <DropdownOptions
                    options={repeatOptions}
                    value={form.type}
                    onChange={(value) => setForm({ ...form, type: value })}
                    placeholder="Chọn chu kỳ lặp lại"
                />
            </div>

            <div className="space-y-1">
                <div className="text-sm font-medium">Thời gian chạy</div>
                <div className="flex gap-2 items-center">
                    <Input
                        variant="normal"
                        type="number"
                        min={0}
                        max={23}
                        placeholder="Giờ"
                        value={form.hour}
                        onChange={handleHourChange}
                    />
                    <span className="text-lg font-medium">:</span>
                    <Input
                        variant="normal"
                        type="number"
                        min={0}
                        max={59}
                        placeholder="Phút"
                        value={form.minute}
                        onChange={handleMinuteChange}
                    />
                </div>
            </div>

            {form.type === "weekly" && (
                <div className="flex flex-wrap gap-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <Button
                            key={d}
                            variant={form.daysOfWeek.includes(d) ? "primary" : "outline"}
                            onClick={() => toggleDay(d)}
                            className={`px-2 py-1 border rounded text-sm flex-1 ${form.daysOfWeek.includes(d)
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700"
                                }`}
                        >
                            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d]}
                        </Button>
                    ))}
                </div>
            )}

            <div className="text-sm bg-gray-50 border rounded p-2">
                <strong>Sẽ chạy:</strong> {preview}
            </div>

            <Button variant="actionCreate" className="w-full" onClick={submit}>
                {isEdit ? "Cập nhật" : "Tạo cron job"}
            </Button>
        </div>
    );
}

// Component modal chính
export default function CreateCronJobModal({ open, onClose, onCreated, initialData }) {
    return (
        <AppDialog
            open={open}
            onClose={onClose}
            title={initialData ? "Chỉnh sửa lịch chạy" : "Tạo lịch chạy tự động"}
            FormComponent={CronJobForm}
            onCreated={onCreated}
            data={initialData}
        />
    );
}