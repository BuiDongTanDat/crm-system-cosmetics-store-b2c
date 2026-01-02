import  { useEffect, useState, useMemo } from "react";
import { Pie, PieChart, Label, Cell, Sector } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCustomers } from "@/services/customers";
import { getAllleads, getPipelineMetrics } from "@/services/leads";
import { UserX, Users, Star, TrendingUp } from "lucide-react";
import MetricCard from "@/pages/report/charts/MetricCard";
import { formatCurrency } from "@/utils/helper";
import LeadStatusChart from "@/pages/dashboard/components/lead-status-chart";

const chartConfig = {
  count: {
    label: "Số lượng",
  },
};

const TYPE_COLORS = {
  VIP: "#6366f1",
  PREMIUM: "#f59e42",
  NEW: "#22c55e",
  NORMAL: "#3b82f6",
  UNKNOWN: "#a3a3a3",
  customer: "#3b82f6",
  lead: "#f59e42",
};

function getCustomerTypeKey(type) {
  if (!type) return "UNKNOWN";
  const t = String(type).toUpperCase();
  if (t.includes("VIP")) return "VIP";
  if (t.includes("PREMIUM")) return "PREMIUM";
  if (t.includes("NEW")) return "NEW";
  if (t.includes("NORMAL") || t.includes("TIÊU CHUẨN") || t.includes("STANDARD")) return "NORMAL";
  return "UNKNOWN";
}

// Map API customer_type -> UI constant (same as CustomerListPage)
function mapCustomerType(type) {
  if (!type) return "NORMAL";
  const up = String(type).toUpperCase();
  if (up.includes("VIP")) return "VIP";
  if (up.includes("PREMIUM")) return "PREMIUM";
  if (up.includes("NEW")) return "NEW";
  return "NORMAL";
}

// Gender normalization for chart
function normalizeGender(g) {
  if (!g) return "Khác";
  const val = String(g).toLowerCase();
  if (val === "male" || val === "nam" || val === "m") return "Nam";
  if (val === "female" || val === "nữ" || val === "nu" || val === "f") return "Nữ";
  return "Khác";
}

export default function LeadCustomerReport() {
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTypeIndex, setActiveTypeIndex] = useState(-1);
  const [activeCustomerTypeIndex, setActiveCustomerTypeIndex] = useState(-1);
  const [activeSourceIndex, setActiveSourceIndex] = useState(-1);
  const [activeGenderIndex, setActiveGenderIndex] = useState(-1);

  // Fetch data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getCustomers(),
      getAllleads(),
      getPipelineMetrics(),
    ]).then(([cusRes, leadRes, metricsRes]) => {
      if (!mounted) return;
      setCustomers(Array.isArray(cusRes?.data) ? cusRes.data : Array.isArray(cusRes) ? cusRes : []);
      setLeads(Array.isArray(leadRes?.data) ? leadRes.data : Array.isArray(leadRes) ? leadRes : []);
      setMetrics(metricsRes?.data || metricsRes || null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // Thống kê
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalLeads = leads.length;
    const total = totalCustomers + totalLeads;
    // Pie chart khách hàng vs lead
    const pieTypeData = [
      { type: "Khách hàng", key: "customer", count: totalCustomers, fill: TYPE_COLORS.customer },
      { type: "Lead", key: "lead", count: totalLeads, fill: TYPE_COLORS.lead },
    ].filter(d => d.count > 0);

    // Pie chart theo loại khách hàng (VIP, PREMIUM, NEW, NORMAL)
    const typeMap = { VIP: 0, PREMIUM: 0, NEW: 0, NORMAL: 0 };
    customers.forEach(c => {
      const key = mapCustomerType(c.customer_type || c.type);
      if (typeMap[key] !== undefined) typeMap[key]++;
    });
    const pieCustomerTypeData = Object.entries(typeMap)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        type,
        count,
        fill: TYPE_COLORS[type] || "#a3a3a3",
      }));

    // Pie chart theo nguồn khách hàng
    const sourceMap = {};
    customers.forEach(c => {
      const src = c.source || "Khác";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const pieSourceData = Object.entries(sourceMap).map(([source, count], idx) => ({
      source,
      count,
      fill: `hsl(${(idx * 60) % 360}, 70%, 60%)`,
    }));

    // Pie chart theo giới tính
    const genderMap = { Nam: 0, Nữ: 0, Khác: 0 };
    customers.forEach(c => {
      const g = normalizeGender(c.gender);
      if (genderMap[g] !== undefined) genderMap[g]++;
      else genderMap["Khác"]++;
    });
    const pieGenderData = Object.entries(genderMap)
      .filter(([_, count]) => count > 0)
      .map(([gender, count], idx) => ({
        gender,
        count,
        fill: gender === "Nam"
          ? "#3b82f6"
          : gender === "Nữ"
          ? "#f472b6"
          : "#a3a3a3",
      }));

    const conversionRate = metrics?.conversionRate ?? 0;
    const totalValue = metrics?.totalValue ?? 0;
    const processingLeads = metrics?.processingLeads ?? 0;
    const doneLeads = metrics?.doneLeads ?? 0;

    return {
      totalCustomers,
      totalLeads,
      total,
      pieTypeData,
      pieCustomerTypeData,
      pieSourceData,
      pieGenderData,
      conversionRate,
      totalValue,
      processingLeads,
      doneLeads,
    };
  }, [customers, leads, metrics]);

  // Pie chart tooltip content
  const pieTypeTooltip = (props) => {
    const { payload } = props;
    if (!payload?.length) return null;
    const d = payload[0].payload;
    const percent = stats.total
      ? ((d.count / stats.total) * 100).toFixed(1)
      : 0;
    return (
      <ChartTooltipContent>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{d.type}</span>
          <span>
            Số lượng: <b>{d.count}</b>
          </span>
          <span>
            Tỉ lệ: <b>{percent}%</b>
          </span>
        </div>
      </ChartTooltipContent>
    );
  };

  const pieCustomerTypeTooltip = (props) => {
    const { payload } = props;
    if (!payload?.length) return null;
    const d = payload[0].payload;
    const total = stats.pieCustomerTypeData.reduce((sum, t) => sum + t.count, 0);
    const percent = total ? ((d.count / total) * 100).toFixed(1) : 0;
    return (
      <ChartTooltipContent>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{d.type}</span>
          <span>
            Số lượng: <b>{d.count}</b>
          </span>
          <span>
            Tỉ lệ: <b>{percent}%</b>
          </span>
        </div>
      </ChartTooltipContent>
    );
  };

  const pieSourceTooltip = (props) => {
    const { payload } = props;
    if (!payload?.length) return null;
    const d = payload[0].payload;
    const total = stats.pieSourceData.reduce((sum, t) => sum + t.count, 0);
    const percent = total ? ((d.count / total) * 100).toFixed(1) : 0;
    return (
      <ChartTooltipContent>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{d.source}</span>
          <span>
            Số lượng: <b>{d.count}</b>
          </span>
          <span>
            Tỉ lệ: <b>{percent}%</b>
          </span>
        </div>
      </ChartTooltipContent>
    );
  };

  const pieGenderTooltip = (props) => {
    const { payload } = props;
    if (!payload?.length) return null;
    const d = payload[0].payload;
    const total = stats.pieGenderData.reduce((sum, t) => sum + t.count, 0);
    const percent = total ? ((d.count / total) * 100).toFixed(1) : 0;
    return (
      <ChartTooltipContent>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{d.gender}</span>
          <span>
            Số lượng: <b>{d.count}</b>
          </span>
          <span>
            Tỉ lệ: <b>{percent}%</b>
          </span>
        </div>
      </ChartTooltipContent>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Thống kê Khách hàng & Lead</h2>
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Tổng khách hàng"
          value={stats.totalCustomers}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Tổng Lead"
          value={stats.totalLeads}
          icon={UserX}
          color="yellow"
        />
        <MetricCard
          title="Tỉ lệ chuyển đổi"
          value={stats.conversionRate}
          suffix="%"
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Tổng giá trị"
          value={formatCurrency(stats.totalValue)}
          icon={Star}
          color="red"
        />
      </div>

      {/* Lead status chart (shadcn) */}
      <div>
        <LeadStatusChart />
      </div>

      {/* Pie chart khách hàng vs lead + Pie chart loại khách hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Khách hàng / Lead */}
        <Card className="flex flex-row items-stretch">
          <div className="flex flex-col justify-between p-6 w-1/2 min-w-[180px]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Tỷ lệ Khách hàng / Lead</CardTitle>
              <CardDescription>Phân loại theo loại đối tượng</CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {stats.pieTypeData.map((d, idx) => {
                const percent = stats.total
                  ? ((d.count / stats.total) * 100).toFixed(1)
                  : 0;
                const isActive = activeTypeIndex === idx;
                return (
                  <div
                    key={d.type}
                    className={`flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer ${isActive ? "font-bold text-blue-600 scale-105" : ""}`}
                    onMouseEnter={() => setActiveTypeIndex(idx)}
                    onMouseLeave={() => setActiveTypeIndex(-1)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: d.fill,
                        border: isActive ? "2px solid #2563eb" : "none",
                      }}
                    ></span>
                    <span>{d.type}</span>
                    <span className="font-semibold">{d.count}</span>
                    <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <CardContent className="flex items-center justify-center w-1/2">
            <ChartContainer config={chartConfig} className="mx-auto h-[250px] w-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={pieTypeTooltip} />
                <Pie
                  data={stats.pieTypeData}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={true}
                  activeIndex={activeTypeIndex}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 12} />
                  )}
                  onMouseEnter={(_, idx) => setActiveTypeIndex(idx)}
                  onMouseLeave={() => setActiveTypeIndex(-1)}
                >
                  {stats.pieTypeData.map((entry, idx) => (
                    <Cell key={entry.type} fill={entry.fill} />
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
                            {stats.total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Tổng
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        {/* Card: Loại khách hàng */}
        <Card className="flex flex-row items-stretch">
          <div className="flex flex-col justify-between p-6 w-1/2 min-w-[180px]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Tỷ lệ loại khách hàng</CardTitle>
              <CardDescription>VIP, Premium, Tiêu chuẩn, Mới...</CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {stats.pieCustomerTypeData.map((d, idx) => {
                const total = stats.pieCustomerTypeData.reduce((sum, t) => sum + t.count, 0);
                const percent = total ? ((d.count / total) * 100).toFixed(1) : 0;
                const isActive = activeCustomerTypeIndex === idx;
                return (
                  <div
                    key={d.type}
                    className={`flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer ${isActive ? "font-bold text-blue-600 scale-105" : ""}`}
                    onMouseEnter={() => setActiveCustomerTypeIndex(idx)}
                    onMouseLeave={() => setActiveCustomerTypeIndex(-1)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: d.fill,
                        border: isActive ? "2px solid #2563eb" : "none",
                      }}
                    ></span>
                    <span>{d.type}</span>
                    <span className="font-semibold">{d.count}</span>
                    <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <CardContent className="flex items-center justify-center w-1/2">
            <ChartContainer config={chartConfig} className="mx-auto h-[250px] w-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={pieCustomerTypeTooltip} />
                <Pie
                  data={stats.pieCustomerTypeData}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={true}
                  activeIndex={activeCustomerTypeIndex}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 12} />
                  )}
                  onMouseEnter={(_, idx) => setActiveCustomerTypeIndex(idx)}
                  onMouseLeave={() => setActiveCustomerTypeIndex(-1)}
                >
                  {stats.pieCustomerTypeData.map((entry, idx) => (
                    <Cell key={entry.type} fill={entry.fill} />
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
                            {stats.pieCustomerTypeData.reduce((sum, t) => sum + t.count, 0)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Tổng KH
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie chart nguồn khách hàng & giới tính */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Nguồn khách hàng */}
        <Card className="flex flex-row items-stretch">
          <div className="flex flex-col justify-between p-6 w-1/2 min-w-[180px]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Tỷ lệ theo nguồn khách hàng</CardTitle>
              <CardDescription>Website, Facebook, Zalo, v.v.</CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {stats.pieSourceData.map((d, idx) => {
                const total = stats.pieSourceData.reduce((sum, t) => sum + t.count, 0);
                const percent = total ? ((d.count / total) * 100).toFixed(1) : 0;
                const isActive = activeSourceIndex === idx;
                return (
                  <div
                    key={d.source}
                    className={`flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer ${isActive ? "font-bold text-blue-600 scale-105" : ""}`}
                    onMouseEnter={() => setActiveSourceIndex(idx)}
                    onMouseLeave={() => setActiveSourceIndex(-1)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: d.fill,
                        border: isActive ? "2px solid #2563eb" : "none",
                      }}
                    ></span>
                    <span>{d.source}</span>
                    <span className="font-semibold">{d.count}</span>
                    <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <CardContent className="flex items-center justify-center w-1/2">
            <ChartContainer config={chartConfig} className="mx-auto h-[250px] w-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={pieSourceTooltip} />
                <Pie
                  data={stats.pieSourceData}
                  dataKey="count"
                  nameKey="source"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={true}
                  activeIndex={activeSourceIndex}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 12} />
                  )}
                  onMouseEnter={(_, idx) => setActiveSourceIndex(idx)}
                  onMouseLeave={() => setActiveSourceIndex(-1)}
                >
                  {stats.pieSourceData.map((entry, idx) => (
                    <Cell key={entry.source} fill={entry.fill} />
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
                            {stats.pieSourceData.reduce((sum, t) => sum + t.count, 0)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Tổng KH
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        {/* Card: Giới tính khách hàng */}
        <Card className="flex flex-row items-stretch">
          <div className="flex flex-col justify-between p-6 w-1/2 min-w-[180px]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Tỷ lệ giới tính khách hàng</CardTitle>
              <CardDescription>Nam, Nữ, Khác</CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {stats.pieGenderData.map((d, idx) => {
                const total = stats.pieGenderData.reduce((sum, t) => sum + t.count, 0);
                const percent = total ? ((d.count / total) * 100).toFixed(1) : 0;
                const isActive = activeGenderIndex === idx;
                return (
                  <div
                    key={d.gender}
                    className={`flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer ${isActive ? "font-bold text-blue-600 scale-105" : ""}`}
                    onMouseEnter={() => setActiveGenderIndex(idx)}
                    onMouseLeave={() => setActiveGenderIndex(-1)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: d.fill,
                        border: isActive ? "2px solid #2563eb" : "none",
                      }}
                    ></span>
                    <span>{d.gender}</span>
                    <span className="font-semibold">{d.count}</span>
                    <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <CardContent className="flex items-center justify-center w-1/2">
            <ChartContainer config={chartConfig} className="mx-auto h-[250px] w-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={pieGenderTooltip} />
                <Pie
                  data={stats.pieGenderData}
                  dataKey="count"
                  nameKey="gender"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={true}
                  activeIndex={activeGenderIndex}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 12} />
                  )}
                  onMouseEnter={(_, idx) => setActiveGenderIndex(idx)}
                  onMouseLeave={() => setActiveGenderIndex(-1)}
                >
                  {stats.pieGenderData.map((entry, idx) => (
                    <Cell key={entry.gender} fill={entry.fill} />
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
                            {stats.pieGenderData.reduce((sum, t) => sum + t.count, 0)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Tổng KH
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Thông tin lead/khách hàng nổi bật */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col gap-2">
        <h3 className="text-lg font-semibold mb-4">Thông tin Lead nổi bật</h3>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Đang xử lý: </span>
            <span>{stats.processingLeads}</span>
          </div>
          <div>
            <span className="font-semibold">Đã xử lý: </span>
            <span>{stats.doneLeads}</span>
          </div>
          <div>
            <span className="font-semibold">Tổng giá trị Lead: </span>
            <span>{formatCurrency(stats.totalValue)}</span>
          </div>
          <div>
            <span className="font-semibold">Tỉ lệ chuyển đổi: </span>
            <span>{stats.conversionRate}%</span>
          </div>
        </div>
      </div>
      {/* Bảng danh sách khách hàng/lead */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mt-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Danh sách khách hàng & Lead</h3>
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Tên
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Loại
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Số điện thoại
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Ngày tạo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Fix: Use array concat, not object spread, for table rows */}
            {[...customers.map((c) => ({
                ...c,
                type: "Khách hàng",
                name: c.full_name || c.name,
                email: c.email,
                phone: c.phone,
                created_at: c.created_at,
              })),
              ...leads.map((l) => ({
                ...l,
                type: "Lead",
                name: l.full_name || l.name,
                email: l.email,
                phone: l.phone || l.phone_number,
                created_at: l.created_at,
              })),
            ].map((item, idx) => (
              <tr key={item.id || item.customer_id || item.lead_id || idx}>
                <td className="px-2 py-2 text-left">{item.name}</td>
                <td className="px-2 py-2 text-left">{item.type}</td>
                <td className="px-2 py-2 text-left">{item.email}</td>
                <td className="px-2 py-2 text-left">{item.phone}</td>
                <td className="px-2 py-2 text-left">{item.created_at ? String(item.created_at).slice(0, 10) : "--"}</td>
              </tr>
            ))}
            {customers.length + leads.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Không có dữ liệu khách hàng/lead
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
