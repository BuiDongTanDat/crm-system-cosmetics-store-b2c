import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCcw, TrendingUp, Users, Activity, AlertTriangle } from 'lucide-react';
import { rebuildCustomerSnapshot } from '@/services/customers';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/helper';
import DropdownOptions from "@/components/common/DropdownOptions";

export default function CustomerAnalytics({ customerId }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [horizon, setHorizon] = useState('12m');

    const handleRebuild = async () => {
        if (!customerId) return;
        setLoading(true);
        try {
            // Rebuild calling AI Service
            const res = await rebuildCustomerSnapshot(customerId, { horizon: horizon }, {
                segment_map_json: {
                    "0": "Lost", "1": "Regular", "2": "VIP"
                }
            });
            if (res?.ok) {
                toast.success(`Đã cập nhật phân tích (${horizon})!`);
                const d = res.data || {};
                // Map backend keys to frontend expectations
                const mapped = {
                    ...d,
                    cfm_frequency: d.frequency_90d || 0,
                    cfm_monetary: d.monetary_90d || 0,
                    // CFM Score (Recency/Freq/Money) - makeshift from churn inverse or other metric
                    cfm_score: d.metadata?.churn_ai?.churn_score ? Math.round((1 - d.metadata.churn_ai.churn_score) * 10) : 5,

                    clv_prediction: d[`clv_${horizon}`] || d.clv_12m || d.clv_6m || 0,
                    total_spent: d.monetary_90d || d.revenue_30d || 0,
                    customer_lifespan: d.metadata?.customer_tenure_days ? Math.round(d.metadata.customer_tenure_days / 30) : 0,

                    churn_probability: d.churn_score || 0,
                    churn_risk_level: (d.churn_score || 0) > 0.7 ? 'Cao' : (d.churn_score || 0) > 0.3 ? 'Trung bình' : 'Thấp',

                    segment: d.segment_name || 'N/A'
                };
                setData(mapped);
            } else {
                toast.error("Lỗi cập nhật: " + (res?.error?.message || "Unknown"));
            }
        } catch (e) {
            console.error(e);
            toast.error("Lỗi hệ thống: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const horizonOptions = [
        { value: '1m', label: '1 Tháng' },
        { value: '3m', label: '3 Tháng' },
        { value: '6m', label: '6 Tháng' },
        { value: '12m', label: '1 Năm' },
    ];

    return (
        <div className="space-y-6 mt-6 border-t pt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand" />
                    Phân tích AI & Customer 360
                </h3>
                <div className="flex gap-2">
                    <DropdownOptions
                        options={horizonOptions}
                        value={horizon}
                        onChange={setHorizon}
                        width="w-32"
                    />
                    <Button
                        onClick={handleRebuild}
                        disabled={loading || !customerId}
                        className="gap-2"
                        variant="outline"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Đang phân tích...' : 'Cập nhật'}
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CFM */}
                <Card
                    title="Phân tích CFM"
                    icon={<Users className="w-5 h-5 text-blue-600" />}
                    bg="bg-blue-50"
                    borderBG="border-blue-300"

                >
                    <div className="space-y-2 mt-2">
                        <MetricRow label="Tần suất mua" value={data?.cfm_frequency ? `${data.cfm_frequency.toFixed(1)} lần/tháng` : '--'} />
                        <MetricRow label="Giá trị TB" value={data?.cfm_monetary ? formatCurrency(data.cfm_monetary) : '--'} />
                        <MetricRow label="Điểm CFM" value={data?.cfm_score ? `${data.cfm_score}/10` : '--'} highlight />
                    </div>
                </Card>

                {/* CLV */}
                <Card
                    title="Customer Lifetime Value"
                    icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                    bg="bg-green-50"
                    borderBG="border-green-300"
                >
                    <div className="space-y-2 mt-2">
                        <MetricRow
                            label={`CLV Dự đoán (${horizon})`}
                            value={data?.clv_prediction ? formatCurrency(data.clv_prediction) : '--'}
                            highlight
                            color="text-green-700"
                        />
                        <MetricRow label="Tổng chi tiêu" value={data?.total_spent ? formatCurrency(data.total_spent) : '--'} />
                        <MetricRow label="Tuổi thọ KH" value={data?.customer_lifespan ? `${data.customer_lifespan} tháng` : '--'} />
                    </div>
                </Card>

                {/* Churn */}
                <Card
                    title="Phân tích Churn"
                    icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                    bg="bg-red-50"
                    borderBG="border-red-300"
                >
                    <div className="space-y-2 mt-2">
                        <MetricRow label="Tỷ lệ rời bỏ" value={data?.churn_probability ? `${(data.churn_probability * 100).toFixed(1)}%` : '--'} highlight color="text-red-600" />
                        <MetricRow label="Nguy cơ" value={data?.churn_risk_level || '--'} />
                        <div className="flex pt-1 justify-center w-full">
                            {data?.churn_probability > 0.5 ? (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">Cần chăm sóc ngay</span>
                            ) : (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">An toàn</span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {data && (
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                    <p>Dữ liệu được phân tích lúc: {new Date().toLocaleString()}</p>
                    {data.segment && <p>Phân khúc gợi ý: <strong>{data.segment}</strong></p>}
                </div>
            )}
        </div>
    );
}

function Card({ title, icon, children, bg, borderBG }) {
    return (
        <div className={`p-4 rounded-xl border ${bg} ${borderBG}`}>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="font-semibold text-gray-800">{title}</span>
            </div>
            {children}
        </div>
    );
}

function MetricRow({ label, value, highlight, color }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={`font-medium ${highlight ? 'text-sm' : ''} ${color || 'text-gray-900'}`}>{value}</span>
        </div>
    );
}
