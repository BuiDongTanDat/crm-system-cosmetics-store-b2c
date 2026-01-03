import React, { useEffect, useState, useMemo } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import MetricCard from "@/pages/report/charts/MetricCard";
import { OrdersChart } from "@/pages/dashboard/components/order-chart";
import { RevenueChart } from "@/pages/dashboard/components/revenue-chart";
import { getOrders } from "@/services/orders";
import { formatCurrency, formatDateTime } from "@/utils/helper";
import { Pie, PieChart, Label, Cell, Sector } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const STATUS_LABELS = {
  paid: "Đã thanh toán",
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  cancelled: "Đã hủy",
  completed: "Hoàn tất",
  refunded: "Đã hoàn tiền",
  failed: "Thanh toán thất bại",
  shipped: "Đã giao hàng",
};

const STATUS_COLORS = {
  paid: "#22c55e",
  pending: "#3b82f6",
  processing: "#f59e42",
  cancelled: "#ef4444",
  completed: "#10b981",
  refunded: "#6366f1",
  failed: "#f43f5e",
  shipped: "#0ea5e9",
  other: "#a3a3a3",
};

const chartConfig = {
  count: {
    label: "Số lượng",
  },
};

export default function RevenueReport() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusIndex, setActiveStatusIndex] = useState(-1);

  // Fetch all orders
  useEffect(() => {
    setLoading(true);
    getOrders().then((res) => {
      let data = Array.isArray(res) ? res : res?.data || [];
      setOrders(data);
      setLoading(false);
    });
  }, []);

  // Tổng hợp số liệu
  const stats = useMemo(() => {
    if (!orders.length) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrder: 0,
        avgRevenuePerDay: 0,
        days: 0,
        pieStatusData: [],
        ordersByStatus: {},
      };
    }
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.total_amount || o.total || 0),
      0
    );
    // Tính số ngày thực tế có đơn hàng
    const dates = orders.map((o) => (o.order_date || "").slice(0, 10));
    const uniqueDates = Array.from(new Set(dates));
    const days = uniqueDates.length || 1;
    const avgOrder = totalOrders / days;
    const avgRevenuePerDay = totalRevenue / days;

    // Pie chart data theo trạng thái
    const statusMap = {};
    orders.forEach((o) => {
      const st = o.status || "other";
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    const pieStatusData = Object.entries(statusMap).map(([status, count]) => ({
      status: STATUS_LABELS[status] || status,
      rawStatus: status,
      count,
      fill: STATUS_COLORS[status] || STATUS_COLORS.other,
    }));

    // Gom đơn hàng theo trạng thái (cho bảng nếu cần)
    const ordersByStatus = {};
    orders.forEach((o) => {
      const st = o.status || "other";
      if (!ordersByStatus[st]) ordersByStatus[st] = [];
      ordersByStatus[st].push(o);
    });

    return {
      totalOrders,
      totalRevenue,
      avgOrder: avgOrder.toFixed(2),
      avgRevenuePerDay: avgRevenuePerDay.toFixed(0),
      days,
      pieStatusData,
      ordersByStatus,
    };
  }, [orders]);

  // Pie chart tooltip content
  const pieStatusTooltip = (props) => {
    const { payload } = props;
    if (!payload?.length) return null;
    const d = payload[0].payload;
    const percent = stats.totalOrders
      ? ((d.count / stats.totalOrders) * 100).toFixed(1)
      : 0;
    return (
      <ChartTooltipContent>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{d.status}</span>
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
    <div className="space-y-4">
      {/* Thống kê tổng quan doanh thu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-4">
        <MetricCard
          title="Tổng số đơn hàng"
          value={stats.totalOrders}
          icon={BarChart3}
          color="blue"
        />
        <MetricCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Đơn hàng trung bình/ngày"
          value={stats.avgOrder}
          icon={BarChart3}
          color="yellow"
        />
        <MetricCard
          title="Doanh thu TB/ngày"
          value={formatCurrency(stats.avgRevenuePerDay)}
          icon={TrendingUp}
          color="red"
        />
      </div>
      {/* Biểu đồ đơn hàng và doanh thu */}
      <div className="grid grid-cols-1 lg:grid-cols-2  gap-4">
        <OrdersChart />
        <RevenueChart />
      </div>
      {/* Pie chart trạng thái đơn hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-2  gap-4">
        <div className="flex flex-row items-stretch bg-white p-0 rounded-lg border border-gray-200">
          <div className="flex flex-col justify-between p-6 w-1/2 min-w-[180px]">
            <div className="mb-4">
              <h3 className="text-base font-semibold">
                Tỷ lệ đơn hàng theo trạng thái
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {stats.pieStatusData.map((d, idx) => {
                const percent = stats.totalOrders
                  ? ((d.count / stats.totalOrders) * 100).toFixed(1)
                  : 0;
                const isActive = activeStatusIndex === idx;
                return (
                  <div
                    key={d.status}
                    className={`flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer ${
                      isActive ? "font-bold text-blue-600 scale-105" : ""
                    }`}
                    onMouseEnter={() => setActiveStatusIndex(idx)}
                    onMouseLeave={() => setActiveStatusIndex(-1)}
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
                    <span>{d.status}</span>
                    <span className="font-semibold">{d.count}</span>
                    <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center w-1/2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[250px] w-[250px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={pieStatusTooltip} />
                <Pie
                  data={stats.pieStatusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={true}
                  activeIndex={activeStatusIndex}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 12} />
                  )}
                  onMouseEnter={(_, idx) => setActiveStatusIndex(idx)}
                  onMouseLeave={() => setActiveStatusIndex(-1)}
                >
                  {stats.pieStatusData.map((entry, idx) => (
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
                            {stats.totalOrders}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Tổng đơn
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
        {/* Có thể thêm chart khác ở đây nếu muốn */}
      </div>
      {/* Bảng danh sách đơn hàng */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mt-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Danh sách đơn hàng</h3>
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Mã đơn
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Khách hàng
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Ngày đặt
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Tổng tiền
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((o, idx) => (
              <tr key={o.order_id || idx}>
                <td className="px-2 py-2 text-left">{o.order_id}</td>
                <td className="px-2 py-2 text-left">
                  {o.customer_name || o.customer_id}
                </td>
                <td className="px-2 py-2 text-center">
                  {formatDateTime(o.order_date)}
                </td>
                <td className="px-2 py-2 text-center">
                  {formatCurrency(o.total_amount || o.total || 0)}
                </td>
                <td className="px-2 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      o.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : o.status === "pending"
                        ? "bg-blue-100 text-blue-800"
                        : o.status === "processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : o.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : o.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : o.status === "refunded"
                        ? "bg-indigo-100 text-indigo-800"
                        : o.status === "failed"
                        ? "bg-rose-100 text-rose-800"
                        : o.status === "shipped"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[o.status] ||
                      String(o.status || "").toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Không có dữ liệu đơn hàng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
