import React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Star,
  UserX,
  MessageCircle,
} from "lucide-react";
import MetricCard from "@/pages/report/charts/MetricCard";
import { reportData } from "@/lib/data";
import { RevenueChart } from "@/pages/dashboard/components/revenue-chart";
import LeadStatusChart from "@/pages/dashboard/components/lead-status-chart";

export default function GeneralReport() {
  // Dữ liệu tổng quan mẫu, có thể thay bằng API thực tế
  const metrics = [
    {
      title: "CSAT Score",
      value: reportData?.csatData?.currentScore ?? 4.5,
      suffix: "/5",
      trend: reportData?.csatData?.trend ?? 0.1,
      icon: Star,
      color: "yellow",
    },
    {
      title: "NPS Score",
      value: reportData?.npsData?.score ?? 65,
      trend: reportData?.npsData?.trend ?? 2,
      icon: TrendingUp,
      color: "green",
    },
    {
      title: "Tỷ lệ rời bỏ",
      value: reportData?.churnData?.rate ?? 8.2,
      suffix: "%",
      trend: reportData?.churnData?.trend ?? -0.5,
      icon: UserX,
      color: "red",
    },
    {
      title: "Thời gian phản hồi",
      value: reportData?.customerInteraction?.quality?.responseTime ?? "2h 15m",
      icon: MessageCircle,
      color: "blue",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            suffix={m.suffix}
            trend={m.trend}
            icon={m.icon}
            color={m.color}
          />
        ))}
      </div>

      {/* Biểu đồ tổng quan */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full flex-1">
          <RevenueChart />
          <LeadStatusChart />
        </div>
      </div>
    </div>
  );
}
