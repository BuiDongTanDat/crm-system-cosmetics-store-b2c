import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Mail,
  MessageCircle,
  Video,
  Globe,
  Box,
  Settings,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Menu,
  X,
  List,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppDialog from "@/components/dialogs/AppDialog";
import AppPagination from "@/components/pagination/AppPagination";
import CampaignPerformanceForm from "./components/CampaignPerformanceForm";
import LiveStreamPerformance from "./components/performanceForms/LiveStreamPerformance";
import { formatCurrency } from "@/utils/helper";
import { toast } from "sonner";
import { getChannelStats, listByChannel } from "@/services/campaign";

// --- Mock Data cho các kênh chưa có real data ---
const SAMPLE_CHANNELS = [
  { id: "email", name: "Email Marketing" },
  { id: "sms", name: "SMS Brandname" },
  { id: "zalo", name: "Zalo OA" },
  { id: "livestream", name: "LiveStream" },
  { id: "facebook", name: "Facebook Ads" },
];

export default function ChannelPage() {
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignTotal, setCampaignTotal] = useState(0);
  const [campaignLimit] = useState(10);

  // Dialog state
  const [dialog, setDialog] = useState({
    open: false,
    mode: "view",
    payload: null,
  });

  // Selected channel
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Hover state
  const [hoveredCampaign, setHoveredCampaign] = useState(null);

  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'

  // 1. Load Channel Stats (Sidebar)
  const loadChannelStats = async () => {
    try {
      setLoadingChannels(true);

      const res = await getChannelStats();
      console.log("Channel stats raw response:", res);

      // API trả về trực tiếp array
      const realStats = Array.isArray(res) ? res : [];

      const statsMap = {};
      realStats.forEach((r) => {
        const key = String(r.channel).toLowerCase(); // email, sms
        statsMap[key] = r;
      });

      const merged = SAMPLE_CHANNELS.map((mock) => {
        const found = statsMap[mock.id];
        return {
          ...mock,
          apiChannel: found?.channel ?? mock.id.toUpperCase(), // 🔥
          count: Number(found?.campaign_count || 0),
          totalCost: Number(found?.total_cost || 0),
        };
      });

      setChannels(merged);

      if (!selectedChannel && merged.length > 0) {
        selectChannel(merged[0]);
      }
    } catch (err) {
      console.error("Failed to load channel stats:", err);
      toast.error("Không thể tải thống kê kênh");

      setChannels(
        SAMPLE_CHANNELS.map((ch) => ({
          ...ch,
          apiChannel: ch.id.toUpperCase(),
          count: 0,
        }))
      );
    } finally {
      setLoadingChannels(false);
    }
  };

  useEffect(() => {
    loadChannelStats();
  }, []);

  // 2. Load Campaigns for selected channel
  const loadCampaigns = async () => {
    if (!selectedChannel) return;
    try {
      setLoadingCampaigns(true);
      const res = await listByChannel({
        channel: selectedChannel.id,
        page: campaignPage,
        limit: campaignLimit,
        search: searchTerm,
      });
      console.log("Campaigns by channel response:", res);

      // Support both shapes: res.items or res.data.items
      const items = res?.items || res?.data?.items || res?.data || [];
      const total = res?.total || res?.data?.total || res?.data?.length || 0;

      // Normalize each campaign into expected shape { campaign, channel, rates }
      const normalized = (items || []).map((camp) => {
        // If item already has campaign wrapper, keep it
        if (camp.campaign || camp.channel || camp.rates) return camp;
        // Otherwise wrap the campaign object
        return {
          campaign: camp,
          channel: {
            sent: Number(camp.total_sent || camp.sent || 0),
            cost: Number(camp.total_cost || camp.cost || 0),
            conversions: Number(
              camp.total_conversions || camp.conversions || 0
            ),
          },
          rates: {
            open_rate: Number(camp.open_rate || 0),
            click_rate: Number(camp.click_rate || 0),
          },
        };
      });

      setCampaigns(normalized);
      setCampaignTotal(Number(total || normalized.length));
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      toast.error("Lỗi tải danh sách chiến dịch");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [selectedChannel, campaignPage]); // re-fetch when channel/page changes

  // Debounced search could be better, for now direct trigger on enter or via effect hook?
  // Let's add a manual refresh or search effect
  useEffect(() => {
    const t = setTimeout(() => {
      if (selectedChannel) {
        setCampaignPage(1); // reset to page 1
        loadCampaigns();
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const selectChannel = (ch) => {
    if (selectedChannel?.id === ch.id) return;
    setSelectedChannel(ch);
    setCampaignPage(1);
    setSearchTerm("");
    // loadCampaigns will trigger via useEffect
  };

  // Helpers
  const capitalize = (s) => (s && s[0] ? s[0].toUpperCase() + s.slice(1) : "");
  const getChannelDesc = (c) => {
    const n = (c || "").toLowerCase();
    if (n.includes("email")) return "Email Marketing & Automation";
    if (n.includes("sms")) return "SMS Gateway & Alerts";
    if (n.includes("chat")) return "Chatbot & Messaging";
    if (n.includes("zalo")) return "Zalo OA Integration";
    return "Marketing Channel";
  };
  const getChannelIcon = (ch) => {
    const n = (ch.name || "").toLowerCase();
    const baseClass = "w-5 h-5 text-brand-600";
    if (n.includes("email")) return <Mail className={baseClass} />;
    if (n.includes("sms")) return <MessageCircle className={baseClass} />;
    if (n.includes("stream") || n.includes("youtube") || n.includes("live"))
      return <Video className={baseClass} />;
    if (n.includes("landing") || n.includes("website") || n.includes("page"))
      return <Globe className={baseClass} />;
    return <Box className={baseClass} />;
  };

  // Dialog Handlers
  const openEditChannel = (channel) => {
    // Actually we don't 'edit' the channel aggregation,
    // maybe we just open Add Channel to start a new campaign?
    // user likely wants to edit channel configs, but that's per campaign.
    // We'll keep placeholder or direct to settings
    toast.info("Chức năng thiết lập kênh chung đang phát triển");
  };
  const openAddChannel = () => {
    // Maybe open campaign creation? Or purely add channel config?
    // For now:
    setDialog({ open: true, mode: "add-channel", payload: null });
  };
  const openEditPerformance = (item) => {
    // item is { campaign, channel, rates }
    // We need to shape it for the form
    // The form expects { campaignId, ... }
    const payload = {
      ...item.channel,
      campaignId: item.campaign.campaign_id,
      campaignName: item.campaign.name,
    };
    setDialog({ open: true, mode: "edit-performance", payload });
  };
  const closeDialog = () =>
    setDialog({ open: false, mode: "view", payload: null });

  const handleSaveCommon = () => {
    toast.success("Đã lưu thay đổi");
    closeDialog();
    loadCampaigns(); // reload
    loadChannelStats(); // reload stats too
  };

  const filteredChannels = channels.filter(
    (ch) =>
      !searchTerm ||
      (ch.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  // NOTE: sidebar search uses SAME searchTerm as campaign search?
  // Ideally separate. Let's separate or just use searchTerm for campaigns mostly.
  // We'll make sidebar allow filtering locally if we want.
  // Current code uses `searchTerm` for both in `ChannelPage.jsx`. Let's split if necessary.
  // I will split: `channelSearch` for sidebar.

  const [channelSearch, setChannelSearch] = useState("");
  const sidebarFiltered = channels.filter((ch) =>
    (ch.name || "").toLowerCase().includes(channelSearch.toLowerCase())
  );

  const getPerformanceFormComponent = (channel) => {
    if (!channel) return CampaignPerformanceForm;
    const n = (channel.name || "").toLowerCase();
    if (
      n.includes("stream") ||
      n.includes("livestream") ||
      n.includes("youtube")
    )
      return LiveStreamPerformance;
    return CampaignPerformanceForm;
  };

  const totalPages = Math.ceil(campaignTotal / campaignLimit);

  // Deletion
  const handleDeleteCampaign = async (campaignId) => {
    // In reality this deletes the campaign or just the channel?
    // UI says "Xóa chiến dịch".
    // We should enable deletion via API if needed.
    // For now simple toast
    toast.info("Vui lòng xóa trong chi tiết chiến dịch");
  };

  // Helper: status badge mapping
  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "running" || s === "active") {
      return {
        label: "Active",
        className: "bg-green-50 text-green-700 border-green-200",
      };
    }
    if (s === "paused" || s === "rejected") {
      return {
        label: s === "paused" ? "Paused" : "Rejected",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    if (s === "approved") {
      return {
        label: "Approved",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    if (s === "configuring" || s === "submitted") {
      return {
        label: capitalize(s),
        className: "bg-gray-50 text-gray-700 border-gray-200",
      };
    }
    return {
      label: capitalize(s) || "Unknown",
      className: "bg-gray-50 text-gray-600 border-gray-200",
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      <div className="pt-4 flex-1 min-h-0 flex flex-col lg:flex-row gap-2 px-0">
        {/* Mobile Header - Chỉ hiện trên mobile */}
        <div className="lg:hidden bg-white rounded-lg border p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <Button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {showMobileSidebar ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
              <span className="text-sm">
                {selectedChannel?.name || "Chọn kênh"}
              </span>
            </Button>

            {/* View mode toggle on mobile */}
            <div className="flex gap-0 border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "card" ? "actionCreate" : "actionNormal"}
                size="icon"
                onClick={() => setViewMode("card")}
                className="rounded-none rounded-tl-md rounded-bl-md h-8 w-8"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "actionCreate" : "actionNormal"}
                size="icon"
                onClick={() => setViewMode("table")}
                className="rounded-none rounded-tr-md rounded-br-md h-8 w-8"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm chiến dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 w-full"
            />
          </div>
        </div>

        {/* LEFT: Channel List - Responsive Sidebar */}
        <aside
          className={`
						${showMobileSidebar ? "rounded-nonfixed inset-0 z-50 bg-black/50" : "hidden"}
						lg:block lg:static lg:z-auto lg:bg-transparent
						lg:w-64 lg:flex-shrink-0
					`}
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            className={`
							${showMobileSidebar ? "absolute left-0 top-0 bottom-0 w-80 max-w-[85vw]" : ""}
							lg:static lg:w-full
							shadow bg-white rounded-non md:rounded-md border p-3 flex flex-col h-full
							${showMobileSidebar ? "animate-slide-up  transition duration-150" : ""}
						`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium text-gray-700">
                Danh sách kênh
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={() => loadChannelStats()}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${
                      loadingChannels ? "animate-spin" : ""
                    }`}
                  />
                </Button>
                {/* Close button on mobile */}
                <Button
                  onClick={() => setShowMobileSidebar(false)}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 lg:hidden"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                placeholder="Tìm kênh..."
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                className="h-8 text-xs pl-8"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto e">
              {sidebarFiltered.map((ch) => {
                const isSelected = selectedChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      selectChannel(ch);
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer
											${
                        isSelected
                          ? "border-brand-500 bg-brand-50"
                          : "border-brand-100 hover:border-brand-500 hover:bg-brand-50/40"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getChannelIcon(ch)}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {ch.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ch.count} chiến dịch
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-brand-600 ml-2">
                      {ch.count}
                    </div>
                  </button>
                );
              })}
              {sidebarFiltered.length === 0 && !loadingChannels && (
                <div className="text-gray-500 p-2 text-xs text-center">
                  Không tìm thấy kênh
                </div>
              )}
              {loadingChannels && (
                <div className="text-center py-2 text-xs text-gray-400">
                  Đang tải...
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT: Main Content */}
        <main className="w-full flex-1 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          {/* Header Info - Hidden on mobile, shown via mobile header */}
          <section className="hidden lg:block border p-4 bg-brand/10 backdrop-blur-lg rounded-md flex-shrink-0">
            {selectedChannel ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">
                    {selectedChannel.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedChannel.description}
                  </div>
                </div>
                <div className="gap-2 flex">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <Input
                      placeholder="Tìm chiến dịch..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 w-64 pl-9 bg-white"
                    />
                  </div>
                  {/* View mode toggle on desktop */}
                  <div className="flex gap-0">
                    <Button
                      variant={
                        viewMode === "card" ? "actionCreate" : "actionNormal"
                      }
                      size="icon"
                      onClick={() => setViewMode("card")}
                      className="rounded-none rounded-tl-md rounded-bl-md h-9 w-9"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={
                        viewMode === "table" ? "actionCreate" : "actionNormal"
                      }
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className="rounded-none rounded-tr-md rounded-br-md h-9 w-9"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Chọn một kênh để xem chi tiết</div>
            )}
          </section>

          {/* Content - Table or Card View */}
          <section className="animate-fade-in transition duration-150 flex-1 bg-white rounded-2xl border overflow-hidden shadow flex flex-col">
            {selectedChannel ? (
              <>
                {/* Table View */}
                {viewMode === "table" && (
                  <>
                    <div className="flex-1 overflow-auto">
                      <table className="animate-fade-in transition duration-150 w-full min-w-[900px]">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                          <tr>
                            {[
                              "Chiến dịch",
                              "Trạng thái",
                              "Ngân sách",
                              "Thời gian",
                              "Sent",
                              "Open %",
                              "Click %",
                              "Conversion",
                              "Cost",
                              "",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {campaigns.map((item) => {
                            const camp = item.campaign || {};
                            const chData = item.channel || {};
                            const rates = item.rates || {};

                            return (
                              <tr
                                key={camp.campaign_id || camp.id}
                                onMouseEnter={() =>
                                  setHoveredCampaign(camp.campaign_id)
                                }
                                onMouseLeave={() => setHoveredCampaign(null)}
                                className="transition-colors hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 text-left">
                                  <div className="text-sm font-medium text-gray-900">
                                    {camp.name}
                                  </div>
                                  <div className="text-xs text-blue-500">
                                    {camp.campaign_id?.slice(0, 8)}...
                                  </div>
                                </td>
                                <td className="text-center">
                                  {(() => {
                                    const badge = getStatusBadge(camp.status);
                                    return (
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs border ${badge.className}`}
                                      >
                                        {badge.label}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="text-xs p-2 text-center">
                                  {formatCurrency(Number(camp.budget || 0))}
                                </td>
                                <td className="text-xs p-2 text-center whitespace-nowrap">
                                  {(camp.start_date || "").slice(0, 10)}
                                </td>
                                <td className="text-xs p-2 text-center">
                                  {Number(chData.sent || 0)}
                                </td>
                                <td className="text-xs p-2 text-center">
                                  {(Number(rates.open_rate || 0) * 100).toFixed(
                                    1
                                  )}
                                  %
                                </td>
                                <td className="text-xs p-2 text-center">
                                  {(
                                    Number(rates.click_rate || 0) * 100
                                  ).toFixed(1)}
                                  %
                                </td>
                                <td className="text-xs p-2 text-center">
                                  {Number(chData.conversions || 0)}
                                </td>
                                <td className="text-xs p-2 text-center font-medium text-gray-700">
                                  {formatCurrency(Number(chData.cost || 0))}
                                </td>
                                <td className="text-xs p-2 text-center w-24">
                                  <div
                                    className={`flex justify-center gap-1 transition-opacity duration-200 ${
                                      hoveredCampaign ===
                                      (camp.campaign_id || camp.id)
                                        ? "opacity-100"
                                        : "opacity-0 pointer-events-none"
                                    }`}
                                  >
                                    <Button
                                      variant="actionUpdate"
                                      size="icon"
                                      onClick={() => openEditPerformance(item)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {!loadingCampaigns && campaigns.length === 0 && (
                            <tr>
                              <td
                                colSpan={10}
                                className="text-center py-12 text-gray-500"
                              >
                                Chưa có chiến dịch nào trên kênh này
                              </td>
                            </tr>
                          )}
                          {loadingCampaigns && (
                            <tr>
                              <td colSpan={10} className="text-center py-12">
                                Loading...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="p-2 border-t flex justify-center bg-gray-50">
                      <AppPagination
                        totalPages={totalPages}
                        currentPage={campaignPage}
                        handlePageChange={setCampaignPage}
                        handleNext={() =>
                          setCampaignPage((p) => Math.min(p + 1, totalPages))
                        }
                        handlePrev={() =>
                          setCampaignPage((p) => Math.max(p - 1, 1))
                        }
                      />
                    </div>
                  </>
                )}

                {/* Card View */}
                {viewMode === "card" && (
                  <div className="animate-fade-in transition duration-150 flex-1 overflow-auto p-4">
                    {campaigns.length === 0 && !loadingCampaigns ? (
                      <div className="text-center py-12 text-gray-500">
                        Chưa có chiến dịch nào trên kênh này
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {campaigns.map((item) => {
                            const camp = item.campaign || {};
                            const chData = item.channel || {};
                            const rates = item.rates || {};

                            return (
                              <div
                                key={camp.campaign_id || camp.id}
                                className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                              >
                                <div className="p-4 flex flex-col h-full">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-1">
                                        {camp.name}
                                      </h3>
                                      <p className="text-xs text-blue-500 truncate">
                                        {camp.campaign_id?.slice(0, 8)}...
                                      </p>
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded text-xs border whitespace-nowrap ml-2 ${
                                        getStatusBadge(camp.status).className
                                      }`}
                                    >
                                      {getStatusBadge(camp.status).label}
                                    </span>
                                  </div>

                                  <div className="space-y-2 mb-4 flex-grow">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        Ngân sách:
                                      </span>
                                      <span className="font-semibold text-gray-900">
                                        {formatCurrency(
                                          Number(camp.budget || 0)
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        Chi phí:
                                      </span>
                                      <span className="font-semibold text-emerald-600">
                                        {formatCurrency(
                                          Number(chData.cost || 0)
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        Sent:
                                      </span>
                                      <span className="text-gray-900">
                                        {Number(chData.sent || 0)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        Open Rate:
                                      </span>
                                      <span className="text-gray-900">
                                        {(
                                          Number(rates.open_rate || 0) * 100
                                        ).toFixed(1)}
                                        %
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        Click Rate:
                                      </span>
                                      <span className="text-gray-900">
                                        {(
                                          Number(rates.click_rate || 0) * 100
                                        ).toFixed(1)}
                                        %
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        Conversions:
                                      </span>
                                      <span className="text-gray-900">
                                        {Number(chData.conversions || 0)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 pt-1 border-t">
                                      {(camp.start_date || "").slice(0, 10)}
                                    </div>
                                  </div>

                                  <div className="flex gap-2 w-full border-t pt-3 mt-auto">
                                    <Button
                                      variant="actionUpdate"
                                      size="sm"
                                      onClick={() => openEditPerformance(item)}
                                      className="h-9 flex-1"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Chi tiết
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination for card view */}
                        <div className="mt-4 flex justify-center">
                          <AppPagination
                            totalPages={totalPages}
                            currentPage={campaignPage}
                            handlePageChange={setCampaignPage}
                            handleNext={() =>
                              setCampaignPage((p) =>
                                Math.min(p + 1, totalPages)
                              )
                            }
                            handlePrev={() =>
                              setCampaignPage((p) => Math.max(p - 1, 1))
                            }
                          />
                        </div>
                      </>
                    )}

                    {loadingCampaigns && (
                      <div className="text-center py-12">Loading...</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Chọn một kênh từ danh sách bên trái
              </div>
            )}
          </section>
        </main>
      </div>

      <AppDialog
        open={dialog.open}
        onClose={closeDialog}
        title={{
          "add-channel": "Thêm kênh mới",
          "edit-performance": "Xem chi tiết hiệu suất",
        }}
        mode={dialog.mode}
        FormComponent={getPerformanceFormComponent(selectedChannel)}
        data={dialog.payload}
        onSave={handleSaveCommon}
        maxWidth="sm:max-w-4xl"
      />
    </div>
  );
}
