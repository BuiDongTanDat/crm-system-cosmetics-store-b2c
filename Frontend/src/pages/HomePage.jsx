import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, DollarSign, Box, Calendar, ChevronRight, User, Megaphone, ShoppingCart, ClipboardList, ChartColumnIncreasing } from "lucide-react";
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/common/DropdownOptions';
import CountUp from 'react-countup';
import { getAllleads } from '@/services/leads';
import { getOrders } from '@/services/orders';
import { getRunningCampaigns } from '@/services/campaign';
import { getProducts } from '@/services/products';
import { request } from '@/utils/api';
import { computeRevenue, filterPendingOrders, formatCurrency, formatDate, getPeriodLabel } from "../utils/helper";
import { useAuthStore } from "@/store/useAuthStore";

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // data from APIs 
  const [ordersRaw, setOrdersRaw] = useState([]);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // animation: fade-in from bottom, staggered per container
  // order: 0=Revenue, 1=Lead, 2=Campaign, 3=Orders, 4=Notifications, 5=ReportBtn, 6=ProductBtn
  const ANIM_COUNT = 7;
  const [visible, setVisible] = useState(Array(ANIM_COUNT).fill(false));

  useEffect(() => {
    // TÍnh toán thời gian hợp lý để stagger animation
    const timers = [];
    const base = 10; // ms
    const step = 20; // ms
    for (let i = 0; i < ANIM_COUNT; i++) {
      timers.push(setTimeout(() => {
        setVisible((prev) => {
          const copy = [...prev];
          copy[i] = true;
          return copy;
        });
      }, base + i * step));
    }
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // mock fallback notifications (hiển thị khi API trả rỗng)
  const mockNotifications = [
    { id: 'm1', text: 'Hệ thống sẽ bảo trì vào 22:00', time: '09:00' },
    { id: 'm2', text: 'Bạn có 3 lead mới cần xử lý', time: '08:30' },
    { id: 'm3', text: 'Chiến dịch A đạt 80% mục tiêu', time: 'Hôm qua' },
    { id: 'm4', text: 'Hệ thống sẽ bảo trì vào 22:00', time: '09:00' },
    { id: 'm5', text: 'Bạn có 3 lead mới cần xử lý', time: '08:30' },
    { id: 'm6', text: 'Chiến dịch A đạt 80% mục tiêu', time: 'Hôm qua' },
    { id: 'm7', text: 'Hệ thống sẽ bảo trì vào 22:00', time: '09:00' },
    { id: 'm8', text: 'Bạn có 3 lead mới cần xử lý', time: '08:30' },
    { id: 'm9', text: 'Chiến dịch A đạt 80% mục tiêu', time: 'Hôm qua' },
  ];
  const displayNotifications = (notifications && notifications.length) ? notifications : mockNotifications;

  // UI states
  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'month' | 'quarter'
  const periodOptions = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'quarter', label: 'Quý này' },
  ];

  // helpers to normalize varied API shapes
  const normalizeList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.items)) return res.data.items;
    return [];
  };

  // normalize campaign shape from backend (campaign_id -> id, budget, channel, dates)
  const normalizeCampaign = (c) => {
    if (!c) return {};
    return {
      id: c.id || c._id || c.campaign_id || c.campaignId || '',
      name: c.name || c.title || '',
      channel: c.channel || c.platform || '',
      budget: (c.budget !== undefined && c.budget !== null) ? Number(c.budget) : (c.budget_amount ? Number(c.budget_amount) : null),
      start_date: c.start_date || c.startDate || c.start || null,
      end_date: c.end_date || c.endDate || c.end || null,
      status: c.status || '',
      expected_kpi: c.expected_kpi || c.kpi || {},
      raw: c,
    };
  };

  // normalize lead shape from backend (lead_id -> id, created_at -> createdAt, phone, score)
  const normalizeLead = (l) => {
    if (!l) return {};
    return {
      id: l.id || l._id || l.lead_id || l.leadId || '',
      name: l.name || l.fullName || l.title || '',
      email: l.email || l.email_address || '',
      phone: l.phone || l.phone_number || l.mobile || '',
      source: l.source || l.channel || '',
      status: l.status || '',
      lead_score: l.lead_score ?? l.score ?? null,
      createdAt: l.created_at || l.createdAt || null,
      raw: l,
    };
  };

  const orderTotal = (o) => {
    if (!o) return 0;
    const keys = ['total', 'total_amount', 'amount', 'price', 'grandTotal', 'grand_total'];
    for (const k of keys) {
      if (o[k] !== undefined && o[k] !== null) {
        const n = Number(o[k]);
        if (!Number.isNaN(n)) return n;
      }
    }
    if (o.data?.total) return Number(o.data.total) || 0;
    return 0;
  };

  const orderDate = (o) => {
    return new Date(o.order_date ?? Date.now());
  };

  //Compute dependent values
  const periodLabel = getPeriodLabel(period);
  const revenue = computeRevenue(ordersRaw, period, orderDate, orderTotal);
  const pendingOrders = filterPendingOrders(ordersRaw);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leadsRes, ordersRes, campaignsRes, productsRes, notificationsRes] = await Promise.allSettled([
          getAllleads(),
          getOrders(),
          getRunningCampaigns(),
          getProducts(),
          request('/notifications', { method: 'GET' }),
        ]);

        const leadsList = leadsRes.status === 'fulfilled' ? normalizeList(leadsRes.value) : [];
        const ordersList = ordersRes.status === 'fulfilled' ? normalizeList(ordersRes.value) : [];
        const campaignsList = campaignsRes.status === 'fulfilled' ? normalizeList(campaignsRes.value) : [];
        const productsList = productsRes.status === 'fulfilled' ? normalizeList(productsRes.value) : [];
        const notificationsList = notificationsRes.status === 'fulfilled' ? normalizeList(notificationsRes.value) : [];

        // normalize leads for consistent UI fields
        setLeads(leadsList.map(normalizeLead));
        setOrdersRaw(ordersList);
        // normalize campaigns for consistent UI fields
        setCampaigns(campaignsList.map(normalizeCampaign));
        setProducts(productsList);
        setNotifications(notificationsList);
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);




  // Layout like design: left big area + right column
  return (
    <div className="pt-2 min-h-screen">
      <div className="">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <div className="text-sm text-slate-600 mt-1">Xin chào  <span className="font-medium">{user.name}</span>!</div>
          </div>
          <div className="text-right">
            <div className="mt-3 inline-flex items-center bg-white/50 px-3 py-2 rounded-md shadow-sm text-sm font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="mr-1">Hôm nay:</span>
              {formatDate(new Date)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4 h-full flex-1 flex flex-col w-full"> {/* thêm w-full */}
            {/* Doanh thu */}
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2  gap-4 w-full"> {/* thêm w-full */}
              {/* revenue: giảm chiều cao, nhỏ padding, chiếm 2 cột */}
              <div
                className={
                  `shadow-lg rounded-md  bg-gradient-to-r from-cyan-500 to-blue-500 font-medium rounded-base text-sm px-4 py-2.5 text-white col-start-1 col-span-2 row-start-1 h-full flex flex-col justify-between max-h-[22vh] overflow-hidden w-full ` + // thêm w-full
                  (visible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
                  ' transition-all duration-200 ease-out'
                }
                style={{ transitionDelay: `${1 * 120}ms` }}
              >
                <div className="p-2 flex items-center justify-between  rounded-tl-sm rounded-tr-sm w-full">
                  <div className="flex items-center gap-2">
                    <div className="bg-white rounded-full p-1">
                      <DollarSign className="!w-5 !h-5 text-blue-500" />
                    </div>
                    <div className="text-sm font-semibold">Doanh thu</div>
                  </div>
                  <div className="flex items-center ">
                    <DropdownOptions
                      options={periodOptions}
                      value={period}
                      onChange={(v) => setPeriod(v)}
                      width="w-auto"
                      height="h-7"
                      triggerClassName="bg-white text-sm text-slate-700 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-2xl font-semibold">
                    <CountUp
                      end={Number(revenue) || 0}
                      duration={0.6}
                      formattingFn={(val) => formatCurrency(Number(val))}
                    />
                  </div>
                  <div className="text-sm opacity-90 mt-1">{periodLabel}</div>
                </div>
              </div>

              {/* Lead*/}
              <div
                className={
                  `shadow-lg bg-white rounded-lg p-0 border col-start-3 col-span-2 row-start-1 row-span-3 flex flex-col justify-start h-full transform w-full ` + // thêm w-full
                  (visible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
                  ' transition-all duration-200 ease-out'
                }
                style={{ transitionDelay: `${1 * 60}ms` }}
              >
                <div className="px-3 py-2 flex items-center justify-between bg-blue-500 backdrop-blur-lg rounded-tl-sm rounded-tr-sm w-full mb-2">
                  <div className="flex items-center gap-2 text-white ">
                    <User className="w-4 h-4 text-white" />
                    <h3 className="text-sm font-semibold uppercase">Lead đang chờ xử lý</h3>
                  </div>
                  <span
                    role="link"
                    onClick={() => navigate('/leads')}
                    className="px-2 text-sm text-white hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Chi tiết
                  </span>
                </div>
                <div className="p-2 text-xs text-slate-600">
                  {leads.length === 0 ? <div>Không có lead</div> :
                    leads.slice(0, 6).map(l => (
                      <div
                        key={l.id || JSON.stringify(l.raw)}
                        role="link"
                        onClick={() => navigate('/kanban')}
                        className="py-2 px-3 rounded-md hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3"
                      >
                        <User className="w-4 h-4 " />
                        <div>
                          <div className="font-medium">{l.name || '-'}</div>
                          <div className="text-xs text-slate-500">
                            {l.source ? `${l.source}` : ''}
                            {l.phone ? ` - ${l.phone}` : ''}
                            {l.lead_score != null ? ` - Score: ${l.lead_score}` : ''}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Campaign: */}
              <div
                className={
                  `shadow-lg bg-white rounded-lg p-0 border row-span-2 col-start-1 col-span-2 row-start-2 h-full transform w-full ` + // thêm w-full
                  (visible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
                  ' transition-all duration-200 ease-out'
                }
                style={{ transitionDelay: `${2 * 60}ms` }}
              >
                <div className="px-3 py-2 flex items-center justify-between bg-blue-500 backdrop-blur-lg rounded-tl-sm rounded-tr-sm w-full mb-2">
                  <div className="flex items-center gap-2 text-white ">
                    <Megaphone className="w-4 h-4 " />
                    <h3 className="text-sm font-semibold uppercase">Chiến dịch đang hoạt động</h3>
                  </div>
                  <span
                    role="link"
                    onClick={() => navigate('/marketing')}
                    className="px-2 text-sm text-white hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Chi tiết
                  </span>
                </div>
                <div className="px-3 py-2 text-xs text-slate-600">
                  {campaigns.length === 0 ? <div>Không có chiến dịch</div> : campaigns.slice(0, 3).map(c => (
                    <div
                      key={c.id || JSON.stringify(c.raw)}
                      role="link"
                      onClick={() => navigate(c.id ? `/campaigns/${c.id}` : '/campaigns')}
                      className="py-2 px-3 rounded-md hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3"
                    >
                      <Megaphone className="w-4 h-4 text-rose-500" />
                      <div>
                        <div className="font-medium">{c.name || '-'}</div>
                        <div className="text-xs text-slate-500">
                          {c.channel ? `Kênh: ${c.channel} • ` : ''}
                          {c.budget != null ? `${formatCurrency(c.budget)} • ` : ''}
                          {c.start_date ? formatDate(c.start_date) : '-'} - {c.end_date ? formatDate(c.end_date) : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders area - wide box */}
            <div
              className={
                `shadow-lg bg-white rounded-lg p-0 border flex-1 transform w-full` + // thêm w-full
                (visible[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
                ' transition-all duration-200 ease-out'

              }
              style={{ transitionDelay: `${3 * 60}ms` }}
            > {/* flex-1 để chiếm không gian còn lại */}
              <div className="flex items-center justify-between mb-3">
                <div className="px-3 py-2 flex items-center justify-between bg-blue-500 backdrop-blur-lg rounded-tl-sm rounded-tr-sm w-full">
                  <div className="flex items-center gap-2 text-white">
                    <ShoppingCart className="w-4 h-4" />
                    <h3 className="text-sm font-semibold uppercase ">Các đơn hàng đang chờ xử lý</h3>
                  </div>
                  <span
                    role="link"
                    onClick={() => navigate('/orders')}
                    className="px-2 text-sm text-white hover:underline cursor-pointer  flex items-center gap-1"
                  >
                    Chi tiết
                  </span>
                </div>
              </div>
              <div className="px-3 py-2 space-y-2 overflow-auto max-h-[40vh]"> {/* giới hạn chiều cao và scroll */}
                {pendingOrders.length === 0 ? (
                  <div className="text-sm text-slate-500">Không có đơn chờ</div>
                ) : pendingOrders.slice(0, 6).map(o => (
                  <div
                    key={o.order_id || JSON.stringify(o)}
                    role="link"
                    onClick={() => {
                      navigate('/orders');
                    }}
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className="font-medium">{o.customer_name || 'Khách'}</div>
                        <div className="text-sm text-slate-600">{formatCurrency(orderTotal(o))} </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-amber-600 uppercase font-bold">{o.status || o.state || ''}</div>
                      <div className="text-xs text-slate-500">{formatDate(orderDate(o))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: notifications + report button */}
          <div className="space-y-4 h-full flex flex-col justify-between w-full"> {/* thêm w-full */}
            {/* sticky wrapper must NOT have transform; inner animated div handles animation */}
            <div className={
              (visible[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
              ' shadow-lg transition-all duration-200 ease-out flex-2 bg-white rounded-lg p-0 border sticky w-full' // thêm w-full
            }
              style={{ transitionDelay: `${4 * 60}ms`, transformOrigin: 'top' }}>
              <div
              >
                <div className=" flex items-center justify-between mb-3">
                  <div className="px-3 py-2 flex items-center justify-between bg-blue-500 backdrop-blur-lg rounded-tl-sm rounded-tr-sm w-full">
                    <div className="flex items-center gap-2 text-white">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold uppercase">THÔNG BÁO</h3>
                    </div>
                    <span
                      role="link"
                      onClick={() => navigate('/notifications')}
                      className="px-2 text-sm text-white hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Tất cả thông báo
                    </span>
                  </div>
                </div>
                <div className="px-3 py-2 space-y-3 min-h-[160px] max-h-[60vh] overflow-auto"> {/* giới hạn chiều cao và scroll nội dung */}
                  {displayNotifications.length === 0 ? (
                    <div className="text-sm text-slate-500">Không có thông báo</div>
                  ) : displayNotifications.slice(0, 8).map(n => (
                    <div
                      key={n.id || JSON.stringify(n)}
                      role="link"
                      onClick={() => navigate(n.id ? `/notifications/${n.id}` : '/notifications')}
                      className="flex items-start gap-3 hover:bg-slate-50 p-1 rounded-md cursor-pointer"
                    >
                      <Bell className="w-5 h-5 text-blue-500 mt-1" />
                      <div>
                        <div className="text-sm hover:underline">{n.text || n.title || n.message}</div>
                        <div className="text-xs text-slate-500">{n.time || formatDate(n.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* action area:  */}
            <div className="flex-1 flex w-full ">
              <div className="w-full flex gap-3">
                {/* Nút BÁO CÁO */}
                <div
                  className={
                    (visible[5] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
                    ' transition-all duration-200 ease-out w-full'
                  }
                  style={{ transitionDelay: `${5 * 60}ms` }}
                >
                  <Button
                    variant="actionDashboardDeepBlue"
                    className="w-full h-20 flex  items-center justify-center py-4"
                    onClick={() => navigate('/reports')}
                  >
                    <ChartColumnIncreasing className="!w-10 !h-10 mb-1" />
                    <div className="flex flex-col items-start">
                      <p className="text-base font-bold">BÁO CÁO</p>
                      <p className="text-xs font-semibold">REPORTS</p>
                    </div>
                  </Button>
                </div>

                {/* Nút SẢN PHẨM */}
                <div
                  className={
                    (visible[6] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
                    ' transition-all duration-200 ease-out w-full'
                  }
                  style={{ transitionDelay: `${6 * 60}ms` }}
                >
                  <Button
                    variant="actionDashboardDeepBlue"
                    className="w-full h-20 flex  items-center justify-center py-4"
                    onClick={() => navigate('/products')}
                  >
                    <Box className="!w-10 !h-10 mb-1" />
                    <div className="flex flex-col items-start">
                      <p className="text-base font-bold">SẢN PHẨM</p>
                      <p className="text-xs font-semibold">PRODUCT</p>
                    </div>


                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
