"use client";


import { Pie, PieChart, Label, Cell, Sector } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useState, useEffect, useMemo } from "react";
import { getPipelineMetrics } from "@/services/leads";
import {
  DollarSign,
  HeartHandshake,
  Percent,
  PercentCircle,
} from "lucide-react";
import CountUp from "react-countup";
import { formatCurrency } from "@/utils/helper";

const ALL_STATUSES = [
  "new",
  "contacted",
  "nurturing",
  "qualified",
  "converted",
  "closed_lost",
];

const statusLabels = {
  new: "NEW",
  contacted: "CONTACTED",
  nurturing: "NURTURING",
  qualified: "QUALIFIED",
  converted: "CONVERTED",
  closed_lost: "CLOSED LOST",
};

const statusColors = {
  new: "var(--lead-new)",
  contacted: "var(--lead-contacted)",
  nurturing: "var(--lead-nurturing)",
  qualified: "var(--lead-qualified)",
  converted: "var(--lead-converted)",
  closed_lost: "var(--lead-closed-lost)",
};

/* =======================
   Bắt buộc cho ChartContainer
======================= */
const chartConfig = {
  count: {
    label: "Số lượng",
  },
};

export default function LeadStatusChart() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    getPipelineMetrics()
      .then((res) => {
        if (!mounted) return;
        if (res?.ok) setMetrics(res.data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
  if (!metrics) return null;

  const byStatus = metrics.byStatus ?? {};

  return ALL_STATUSES.map((status) => {
    const data = byStatus[status];
    return {
      status: statusLabels[status],
      count: data?.count ?? 0,
      fill: statusColors[status],
    };
  });
}, [metrics]);


  const {
    totalDeals = 0,
    totalValue = 0,
    conversionRate = 0,
    processingLeads = 0,
    doneLeads = 0,
  } = metrics || {};

  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Trạng thái Lead</CardTitle>
          <CardDescription>Thống kê theo trạng thái</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center min-h-[200px]">
          <span className="text-muted-foreground">Đang tải dữ liệu…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex flex-2 flex-col gap-4 py-5 text-md justify-end h-full">
            <div className="flex flex-col items-start gap-1 mb-4">
              <h1 className="text-blue-500 font-bold text-lg">Trạng thái Lead</h1>
              <h2 className="text-slate-600">Thống kê theo trạng thái</h2>
            </div>
            <div className="flex flex-col gap-2 items-end-safe">
              <div className="flex gap-1">
                <div className="flex gap-1 items-center bg-blue-100/50 px-2 py-1 rounded-md w-fit text-sm font-medium">
                  <HeartHandshake className="text-blue-500" />
                  <p className="text-sm text-muted-foreground">Đang xử lý:</p>
                  <p className="font-semibold">
                    <CountUp end={processingLeads} duration={0.6} />
                  </p>
                </div>
                <div className="flex gap-1 items-center bg-green-100 px-2 py-1 rounded-md w-fit text-sm font-medium">
                  <HeartHandshake className="text-green-500" />
                  <p className="text-sm text-green-600">Đã xử lý:</p>
                  <p className="font-semibold text-green-600">
                    <CountUp end={doneLeads} duration={0.6} />
                  </p>
                </div>
              </div>

              <div className="flex gap-1 items-center bg-blue-100/50 px-2 py-1 rounded-md w-fit text-sm font-medium">
                <DollarSign className="text-blue-500" />
                <p className="text-sm text-muted-foreground">Tổng giá trị:</p>
                <p className="font-semibold ">
                  <CountUp start={0} end={Number(totalValue)} duration={0.6} />{" "}
                  <span className="ml-1">VNĐ</span>
                </p>
              </div>
              <div className="flex gap-1 items-center bg-blue-100/50 px-2 py-1 rounded-md w-fit text-sm font-medium">
                <Percent className="text-blue-500" />
                <p className="text-sm text-muted-foreground">
                  Tỉ lệ chuyển đổi:
                </p>
                <p className="font-semibold">
                  <CountUp end={conversionRate} duration={0.6} suffix="%" />
                </p>
              </div>
            </div>
          </div>
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[250px] w-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
                isAnimationActive={true}
                activeIndex={activeIndex}
                activeShape={({ outerRadius = 0, ...props }) => (
                  <Sector {...props} outerRadius={outerRadius + 10} />
                )}
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null;
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalDeals.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Tổng Deal
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
