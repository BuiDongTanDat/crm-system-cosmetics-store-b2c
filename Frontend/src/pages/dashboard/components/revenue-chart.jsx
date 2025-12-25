"use client";

import { useState, useEffect, use } from "react";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrdersByDateRange } from "@/services/orders";
import { formatDate, getRollingStartDate } from "@/utils/helper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CalendarRangePicker from "@/components/common/calendar-range-picker";
import { format } from "date-fns";

const chartConfig = {
  revenue: {
    label: "Doanh thu: ",
  },
};

// Gom nhóm doanh thu theo ngày (YYYY-MM-DD)
const groupRevenueByDate = (ordersRaw) => {
  const map = {};
  ordersRaw.forEach((order) => {
    const date = new Date(order.order_date).toISOString().slice(0, 10);
    if (!map[date]) map[date] = 0;
    map[date] += order.total || order.total_amount || 0;
  });
  // Trả về mảng [{date, revenue}]
  return Object.entries(map)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export function RevenueChart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState("90d");
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customRange, setCustomRange] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const getDaysFromTimeRange = (tr) => parseInt(tr.replace("d", ""), 10);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const days = getDaysFromTimeRange(timeRange);
      const endDate = new Date();
      const startDate = getRollingStartDate(days);
      const res = await getOrdersByDateRange(startDate, endDate);
      const groupedData = groupRevenueByDate(res || []);
      setRevenueData(groupedData);
      setLoading(false);
    };
    fetchOrders();
  }, [timeRange]);

  useEffect(() => {
    if (isMobile) {
      setTimeRange("90d");
    }
  }, [isMobile]);

  const chartDisplayData = revenueData;

  //Hamf fetch data theo customRange
  const fetchCustomeRevenures = async (range) => {
    setLoading(true);
    if (!range?.from || !range.to) return;
    //Formate date to YYYY-MM-DD
    const from = range.from.toISOString().slice(0, 10);
    const to = range.to.toISOString().slice(0, 10);
    //Call API
    const res = await getOrdersByDateRange(from, to);
    const groupedData = groupRevenueByDate(res || []);
    setRevenueData(groupedData);
    setLoading(false);
  };

  //Khi chon custom range
  useEffect(() => {
    if (timeRange === "custom" && customRange?.from && customRange?.to) {
      fetchCustomeRevenures(customRange);
    }
  }, [customRange, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Giá trị đơn hàng</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            {timeRange === "custom" && customRange?.from && customRange?.to
              ? `Từ ${formatDate(customRange.from)} đến ${formatDate(
                  customRange.to
                )}`
              : `Tổng giá trị đơn hàng trong ${
                  timeRange === "7d"
                    ? "7 ngày gần đây"
                    : timeRange === "30d"
                    ? "30 ngày gần đây"
                    : "3 tháng gần đây"
                }`}
          </span>
          <span className="@[540px]/card:hidden">
            {timeRange === "custom" && customRange?.from && customRange?.to
              ? `Từ ${formatDate(customRange.from)} đến ${formatDate(
                  customRange.to
                )}`
              : ` ${
                  timeRange === "7d"
                    ? "7 ngày gần đây"
                    : timeRange === "30d"
                    ? "30 ngày gần đây"
                    : "3 tháng gần đây"
                }`}
          </span>
        </CardDescription>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <Popover
            modal={true} // Đổi thành true để tránh tương tác lớp dưới khi đang chọn ngày
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
          >
            {/* PopoverTrigger ẩn để chỉ dùng Select làm trigger */}
            <PopoverTrigger asChild>
              <div className="invisible absolute" />
            </PopoverTrigger>

            <Select
              value={timeRange}
              onValueChange={(val) => {
                setTimeRange(val);
                if (val === "custom") {
                  setCalendarOpen(true);
                }
              }}
            >
              <SelectTrigger
                className="@[767px]/card flex w-40"
                // Khi đã là 'custom', nhấn vào trigger sẽ mở Calendar thay vì mở menu Select
                // Nếu muốn đổi lại 7d/30d, người dùng nhấn vào mũi tên hoặc icon
                onClick={(e) => {
                  if (timeRange === "custom") {
                    e.preventDefault();
                    setCalendarOpen(true);
                  }
                }}
              >
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d">3 tháng gần đây</SelectItem>
                <SelectItem value="30d">30 ngày gần đây</SelectItem>
                <SelectItem value="7d">7 ngày gần đây</SelectItem>

                {/* Dùng onPointerUp để bắt cú click lại */}
                <SelectItem
                  value="custom"
                  onPointerUp={(e) => {
                    if (timeRange === "custom") {
                      setCalendarOpen(true);
                    }
                  }}
                >
                  Tùy chọn ngày
                </SelectItem>
              </SelectContent>
            </Select>

            <PopoverContent
              side="bottom"
              align="end"
              className="w-auto p-0 bg-transparent border-none shadow-md z-50"
            >
              <CalendarRangePicker
                value={customRange}
                onChange={(range) => {
                  setCustomRange(range);
                  // Nếu muốn đóng ngay sau khi chọn xong cả 2 ngày:
                  // if (range?.from && range?.to) setCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={chartDisplayData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return formatDate(date);
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return formatDate(new Date(value));
                  }}
                  indicator="dot"
                />
              }
            />
            <Line
              type="linear"
              dataKey="revenue"
              stroke="var(--chart-blue)"
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 7, fill: "var(--dot-blue)" }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
