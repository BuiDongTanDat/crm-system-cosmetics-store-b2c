import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import Autocomplete from "./Autocomplete";

export default function StandardQueryConditionsBuilder({ type, value, onChange }) {
    const cond = value && typeof value === "object" ? value : {};

    const setField = (k, v) => {
        const next = { ...cond, [k]: v };
        if (v === "" || v == null || (Array.isArray(v) && v.length === 0)) {
            delete next[k];
        }
        onChange?.(next);
    };

    // AI suggestions to append to Autocomplete options
    const aiSuggestions = [
        "{{ campaign.segment_key }}",
        "{{ trigger.status }}",
        "{{ now.getMonth() + 1 }}"
    ];

    const getOptions = (f) => {
        const base = (f.options || []).map(o => typeof o === 'string' ? o : o.value);
        return [...base, ...aiSuggestions];
    };

    // Define fields based on type
    const leadFields = [
        {
            key: "status",
            label: "Lead Status",
            type: "select",
            options: ["new", "contacted", "qualified", "nurturing", "converted", "closed_lost"]
        },
        { key: "lead_source", label: "Source", type: "text", options: ["Organic", "Facebook", "Zalo", "Referral", "Ads"] },
        { key: "lead_score_gte", label: "Min Lead Score", type: "number" },
        { key: "birthday_month", label: "Birthday Month", type: "month" },
        { key: "tags_in", label: "Has Any Tags", type: "tags" },
        { key: "created_after", label: "Created After", type: "date" },
        { key: "last_interaction_before", label: "Inactivity (Last before)", type: "date" },
        { key: "search", label: "Keyword Search", type: "text", placeholder: "Name, email, phone..." },
    ];

    const customerFields = [
        {
            key: "customer_type",
            label: "Customer Type",
            type: "select",
            options: ["Normal", "Loyal", "VIP"]
        },
        { key: "is_active", label: "Is Active", type: "bool" },
        { key: "source", label: "Source", type: "text", options: ["Direct", "Referral", "Campaign"] },
        { key: "birthday_month", label: "Birthday Month", type: "month" },
        { key: "tags_in", label: "Has Any Tags", type: "tags" },
        { key: "created_from", label: "Created From", type: "date" },
        { key: "search", label: "Keyword Search", type: "text", placeholder: "Name, email, phone..." },
    ];

    const orderFields = [
        {
            key: "status",
            label: "Order Status",
            type: "select",
            options: ["draft_cart", "paid", "pending", "cancelled", "refunded", "shipped", "completed"]
        },
        { key: "total_price_gte", label: "Min Total Price", type: "number" },
        { key: "order_date_after", label: "Order Date After", type: "date" },
        { key: "customer_id", label: "Customer ID", type: "text" },
    ];

    const fields =
        type === "leads" ? leadFields :
            type === "customers" ? customerFields :
                orderFields;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                    Advanced Filters ({type === "leads" ? "Leads" : "Customers"})
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 italic">Supports Templates</span>
                    <code className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{"{{ ... }}"}</code>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                {fields.map((f) => {
                    const val = cond[f.key];

                    return (
                        <div key={f.key} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 px-0.5">
                                <span className="text-[13px] font-semibold text-gray-700">{f.label}</span>
                                {val !== undefined && (
                                    <button
                                        onClick={() => setField(f.key, null)}
                                        className="p-1 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                        title="Xóa bộ lọc"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {f.type === "bool" ? (
                                <Select
                                    value={val === true ? "true" : val === false ? "false" : ""}
                                    onValueChange={(x) => setField(f.key, x === "" ? null : x === "true")}
                                >
                                    <SelectTrigger className="w-full h-9 bg-white border-gray-200 shadow-sm">
                                        <SelectValue placeholder="(any)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Yes / True</SelectItem>
                                        <SelectItem value="false">No / False</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (f.type === "select" || f.options) ? (
                                <Autocomplete
                                    value={val == null ? "" : String(val)}
                                    onChange={(v) => setField(f.key, v)}
                                    options={getOptions(f)}
                                    placeholder={f.placeholder || "Nhập hoặc chọn..."}
                                />
                            ) : f.type === "month" ? (
                                <Select
                                    value={val?.toString() ?? ""}
                                    onValueChange={(v) => setField(f.key, v === "" ? null : Number(v))}
                                >
                                    <SelectTrigger className="w-full h-9 bg-white border-gray-200 shadow-sm">
                                        <SelectValue placeholder="(any month)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                Tháng {i + 1}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="{{ now.getMonth() + 1 }}">
                                            <span className="italic text-brand-600">Current Month (AI)</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : f.type === "tags" ? (
                                <div className="space-y-2">
                                    <Input

                                        variant="normal"
                                        className="h-9 text-sm bg-white border-gray-200 shadow-sm focus-visible:ring-brand-500"
                                        placeholder="tag1, tag2 (comma separated)"
                                        value={Array.isArray(val) ? val.join(", ") : val ?? ""}
                                        onChange={(e) => {
                                            const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                                            setField(f.key, tags);
                                        }}
                                    />
                                    {Array.isArray(val) && val.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {val.map(t => (
                                                <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5 font-medium bg-brand-50 text-brand-700 border-brand-100">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Input
                                    variant="normal"
                                    className="h-9 text-sm bg-white border-gray-200 shadow-sm focus-visible:ring-brand-500"
                                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                                    placeholder={f.placeholder || "Trống..."}
                                    value={val ?? ""}
                                    onChange={(e) => setField(f.key, e.target.value)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="text-[13px] text-gray-400 italic px-1">
                * Để trống để bỏ qua lọc. Sử dụng {"{{ ... }}"} để lấy giá trị động từ hệ thống.
            </div>
        </div>
    );
}
