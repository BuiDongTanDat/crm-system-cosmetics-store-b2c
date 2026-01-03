import { DollarSign, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  computeRevenue,
  filterPendingOrders,
  formatCurrency,
  formatDate,
  getPeriodLabel,
  getStartDate,
} from "@/utils/helper.jsx";
import CountUp from "react-countup";
import { getOrder, getOrders } from "@/services/orders";
import DropdownOptions from "@/components/common/DropdownOptions";
import { getCustomers, getCustomersByDateRange } from "@/services/customers";
import LeadStatusChart from "./lead-status-chart";

export default function SectionCards() {
  const [period, setPeriod] = useState("quarter"); // 'today' | 'week' | 'month' | 'quarter'
  const [ordersRaw, setOrdersRaw] = useState([]);

  const periodOptions = [
    { value: "today", label: "Hôm nay" },
    { value: "week", label: "Tuần này" },
    { value: "month", label: "Tháng này" },
    { value: "quarter", label: "Quý này" },
  ];

  const orderTotal = (o) => {
    return o.total ?? 0;
  };

  const orderDate = (o) => {
    return new Date(o.order_date ?? Date.now());
  };

  //Compute dependent values
  const periodLabel = getPeriodLabel(period); // Lấy time hiển thị
  const periodCustomer = getPeriodLabel("month");
  const revenue = computeRevenue(ordersRaw, period, orderDate, orderTotal);
  const pendingOrders = filterPendingOrders(ordersRaw);

  const fetchOrders = async () => {
    try {
      const orders = await getOrders();
      setOrdersRaw(orders);
    } catch (error) {
      console.log("Error fetching orders:", error);
    }
  };

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newCustomersCount, setNewCustomersCount] = useState(0);
  //Lấy khách hàng theo quý gần nhất,
  const fetchCustomersByDateRange = async () => {
    try {
      const from = getStartDate("month");
      const to = new Date();
      const res = await getCustomersByDateRange(from, to);
      setTotalCustomers(res?.data?.totalCustomers);
      setNewCustomersCount(res?.data?.newCustomersCount);
    } catch (error) {
      console.log("Error fetching customers by date range:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomersByDateRange();
  }, []);

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-1 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card w-full">
        <CardHeader className="relative">
          <CardDescription>
            <div className="flex text-blue-500 items-center gap-1 font-bold text-lg">
              Doanh Thu
            </div>
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            <CountUp
              end={Number(revenue) || 0}
              duration={0.6}
              formattingFn={(val) => formatCurrency(Number(val))}
            />
          </CardTitle>
          <div className="absolute right-2 top-4">
            <Badge
              variant="outline"
              className="border-none flex gap-1 rounded-lg text-xs"
            >
              <DropdownOptions
                options={periodOptions}
                value={period}
                onChange={(v) => setPeriod(v)}
                width="w-auto"
                height="h-7"
                triggerClassName="bg-white !text-xs text-slate-700 rounded-md !p-1"
              ></DropdownOptions>
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Doanh thu trong <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            <div>{periodLabel}</div>
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card w-full">
        <CardHeader className="relative ">
          <CardDescription>
            <div className="flex text-blue-500 items-center gap-1 font-bold text-lg">
              Tổng Khách Hàng
            </div>
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {totalCustomers}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium items-center">
            <span className="text-blue-500 text-2xl">{newCustomersCount}</span>khách hàng
            mới trong tháng qua
          </div>
          <div className="text-muted-foreground">{periodCustomer}</div>
        </CardFooter>
      </Card>
      {/* <Card className="@container/card w-full">
        <CardHeader className="relative">
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            45,678
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +12.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card> */}
      {/* Thay thế card thứ 4 bằng LeadStatusChart */}
      <div className="col-span-1 @5xl/main:col-span-2">
        <LeadStatusChart />
      </div>
    </div>
  );
}
