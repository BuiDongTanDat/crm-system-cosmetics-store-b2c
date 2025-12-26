import * as React from "react";
import { useNavigate } from "react-router-dom";
import { getAllleads } from "@/services/leads";
import { getOrders } from "@/services/orders";
import { getRunningCampaigns } from "@/services/campaign";
import { formatCurrency, formatDate } from "@/utils/helper";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loading from "@/components/common/Loading";

export function DataTable() {
  const [tab, setTab] = React.useState("orders-list");
  const navigate = useNavigate();

  // State cho từng loại dữ liệu
  const [orders, setOrders] = React.useState([]);
  const [leads, setLeads] = React.useState([]);
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, leadsRes, campaignsRes] = await Promise.all([
          getOrders(),
          getAllleads(),
          getRunningCampaigns(),
        ]);
        setOrders(normalizeList(ordersRes));
        setLeads(normalizeList(leadsRes).map(normalizeLead));
        setCampaigns(normalizeList(campaignsRes).map(normalizeCampaign));
      } catch (e) {
        // handle error nếu cần
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function normalizeList(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.items)) return res.data.items;
    return [];
  }
  function normalizeLead(l) {
    if (!l) return {};
    return {
      id: l.id || l._id || l.lead_id || l.leadId || "",
      name: l.name || l.fullName || l.title || "",
      email: l.email || l.email_address || "",
      phone: l.phone || l.phone_number || l.mobile || "",
      source: l.source || l.channel || "",
      status: l.status || "",
      lead_score: l.lead_score ?? l.score ?? null,
      createdAt: l.created_at || l.createdAt || null,
      raw: l,
    };
  }
  function normalizeCampaign(c) {
    if (!c) return {};
    return {
      id: c.id || c._id || c.campaign_id || c.campaignId || "",
      name: c.name || c.title || "",
      channel: c.channel || c.platform || "",
      budget:
        c.budget !== undefined && c.budget !== null
          ? Number(c.budget)
          : c.budget_amount
          ? Number(c.budget_amount)
          : null,
      start_date: c.start_date || c.startDate || c.start || null,
      end_date: c.end_date || c.endDate || c.end || null,
      status: c.status || "",
      expected_kpi: c.expected_kpi || c.kpi || {},
      raw: c,
    };
  }

  function orderTotal(o) {
    if (!o) return 0;
    const keys = [
      "total",
      "total_amount",
      "amount",
      "price",
      "grandTotal",
      "grand_total",
    ];
    for (const k of keys) {
      if (o[k] !== undefined && o[k] !== null) {
        const n = Number(o[k]);
        if (!Number.isNaN(n)) return n;
      }
    }
    if (o.data?.total) return Number(o.data.total) || 0;
    return 0;
  }
  function orderDate(o) {
    return new Date(o.order_date ?? Date.now());
  }
  //peding order:
  //Lọc đơn pending (Chỗ này nữa có thể thay đổi cho phù hợp nha)
  function filterPendingOrders(ordersRaw) {
    return ordersRaw.filter((o) => {
      const s = (o.status || o.state || "").toString().toLowerCase();
      return ["pending", "processing"].some((k) =>
        s.includes(k)
      );
    });
  }
  const pendingOrders = filterPendingOrders(orders);

  // Table columns
  const orderColumns = [
    { key: "customer_name", label: "Người đặt hàng" },
    { key: "total", label: "Tổng giá trị" },
    { key: "status", label: "Trạng thái" },
    { key: "order_date", label: "Ngày đặt hàng" },
  ];
  const leadColumns = [
    { key: "name", label: "Tên Lead" },
    { key: "source", label: "Nguồn" },
    { key: "phone", label: "Số điện thoại" },
    { key: "lead_score", label: "Score" },
    { key: "createdAt", label: "Ngày tạo" },
  ];
  const campaignColumns = [
    { key: "name", label: "Tên chiến dịch" },
    { key: "channel", label: "Kênh" },
    { key: "budget", label: "Ngân sách" },
    { key: "start_date", label: "Bắt đầu" },
    { key: "end_date", label: "Kết thúc" },
    { key: "status", label: "Trạng thái" },
  ];

  let columns, data, renderRow;
  if (tab === "orders-list") {
    columns = orderColumns;
    data = pendingOrders;
    renderRow = (row) => (
      <tr
        key={row.id || row.order_id}
        onClick={() => {
          navigate("/orders");
        }}
        className="group hover:bg-gray-50 transition-colors cursor-pointer border-b"
      >
        <td className="px-4 py-2 text-sm text-gray-900 text-left">
          {row.customer_name || "Khách"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {formatCurrency(orderTotal(row))}
        </td>
        <td className="px-4 py-2 text-center w-32">
          <Badge
            variant="outline"
            className={`px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center inline-block  border-none
              ${
                row.status === "pending"
                  ? "bg-blue-100 text-blue-800"
                  : row.status === "processing"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }
            `}
          >
            {row.status === "pending"
              ? "Chờ xử lý"
              : row.status === "processing"
              ? "Đang xử lý"
              : ""}
          </Badge>
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {formatDate(orderDate(row))}
        </td>
      </tr>
    );
  } else if (tab === "leads-list") {
    columns = leadColumns;
    data = leads;
    renderRow = (row) => (
      <tr
        key={row.id}
        onClick ={() => {
          navigate("/kanban");
        }}
        className="group hover:bg-gray-50 transition-colors cursor-pointer border-b"
      >
        <td className="px-4 py-2 text-sm text-gray-900 text-left">
          {row.name || "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-left">
          {row.source || "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {row.phone || "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {row.lead_score != null ? row.lead_score : "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {formatDate(row.createdAt)}
        </td>
      </tr>
    );
  } else if (tab === "campaigns-list") {
    columns = campaignColumns;
    data = campaigns;
    renderRow = (row) => (
      <tr
        key={row.id}
        className="group hover:bg-gray-50 transition-colors cursor-pointer border-b"
      >
        <td className="px-4 py-2 text-sm text-gray-900 text-left">
          {row.name || "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-left">
          {row.channel || "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {row.budget != null ? formatCurrency(row.budget) : "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {formatDate(row.start_date)}
        </td>
        <td className="px-4 py-2 text-sm text-gray-900 text-center">
          {formatDate(row.end_date)}
        </td>
        <td className="px-4 py-2 text-center w-32">
          <Badge
            variant="outline"
            className="px-2 py-1 rounded-full text-xs font-medium w-[100px] text-center inline-block bg-blue-100 text-blue-800 border-none"
          >
            {row.status === "pending"
              ? "Chờ xử lý"
              : row.status === "processing"
              ? "Đang xử lý"
              : ""}
          </Badge>
        </td>
      </tr>
    );
  } else {
    columns = [];
    data = [];
    renderRow = () => null;
  }

  return (
    <Tabs
      defaultValue="outline"
      value={tab}
      onValueChange={setTab}
      className="flex w-full flex-col justify-start gap-1"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Select 
        defaultValue="orders-list" 
        onValueChange={setTab}
        
        >
          <SelectTrigger
            className="@4xl/main:hidden flex w-fit bg-white hover:border-blue-500"
            id="view-selector"

          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orders-list">Đơn hàng chờ xử lý</SelectItem>
            <SelectItem value="leads-list">Lead chờ xử lý</SelectItem>
            <SelectItem value="campaigns-list">
              Chiến dịch đang hoạt động
            </SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="@4xl/main:flex hidden bg-white shadow-sm gap-0 ">
          <TabsTrigger value="orders-list" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg">Đơn hàng chờ xử lý</TabsTrigger>
          <TabsTrigger value="leads-list" className="gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Lead chờ xử lý{" "}
            <Badge
              variant="tag"
              className="flex h-5 w-5 items-center justify-center rounded-full "
            >
              {leads.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="campaigns-list" className="gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Chiến dịch đang hoạt động{" "}
            <Badge
              variant="tag"
              className="flex h-5 w-5 items-center justify-center rounded-full "
            >
              {campaigns.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value={tab}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6 border">
          <div className="w-full">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-8 text-gray-500"
                    >
                      <Loading />
                    </td>
                  </tr>
                ) : data && data.length ? (
                  data.map(renderRow)
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-8 text-gray-500"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
