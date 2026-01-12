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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppDialog from "@/components/dialogs/AppDialog";
import AppPagination from "@/components/pagination/AppPagination";
import ChannelForm from "./components/ChannelForm";
import CampaignPerformanceForm from "./components/CampaignPerformanceForm";
import LiveStreamPerformance from "./components/performanceForms/LiveStreamPerformance";
import { formatCurrency } from "@/utils/helper";
import { toast } from "sonner";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { getChannelStats, listByChannel } from "@/services/campaign";

// --- Mock Data cho các kênh chưa có real data ---
const SAMPLE_CHANNELS = [
	{ id: 'email', name: 'Email Marketing', count: 0 },
	{ id: 'sms', name: 'SMS Brandname', count: 12 },
	{ id: 'zalo', name: 'Zalo OA', count: 8 },
	{ id: 'livestream', name: 'LiveStream', count: 3 },
	{ id: 'facebook', name: 'Facebook Ads', count: 20 },
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

	// 1. Load Channel Stats (Sidebar)
	const loadChannelStats = async () => {
		try {
			setLoadingChannels(true);
			const res = await getChannelStats();

			if (res.ok && res.data) {
				// res.data.items: [{ channel, campaign_count }]
				const realStats = res.data.items || [];

				// Merge realStats vào SAMPLE_CHANNELS
				const merged = SAMPLE_CHANNELS.map(mock => {
					const found = realStats.find(r =>
						String(r.channel).toLowerCase() === mock.id ||
						String(r.channel).toLowerCase().includes(mock.id)
					);
					if (found) {
						return {
							...mock,
							count: Number(found.campaign_count || 0),
							totalCost: Number(found.total_cost || 0),
							raw: found
						};
					}
					return mock;
				});

				setChannels(merged);
				// Auto select first if none
				if (!selectedChannel && merged.length > 0) {
					selectChannel(merged[0]);
				}
			} else {
				// Fallback
				setChannels(SAMPLE_CHANNELS);
			}
		} catch (err) {
			console.error("Failed to load channel stats:", err);
			toast.error("Không thể tải thống kê kênh");
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
				channel: selectedChannel.id, // we stored channel name in id
				page: campaignPage,
				limit: campaignLimit,
				search: searchTerm,
			});
			// res: { items: [{ campaign, channel, rates }], total, ... }
			setCampaigns(res.items || []);
			setCampaignTotal(res.total || 0);
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
	// For simplicity, let's keep sidebar always visible or use a separate state if complex.
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

	return (
		<div className="flex flex-col h-[calc(100vh-60px)]">
			<div className="pt-4 flex-1 min-h-0 flex flex-col sm:flex-row gap-2 px-0">
				{/* LEFT: Channel List */}
				<aside className="self-start shadow w-full sm:w-64 bg-white rounded-2xl border p-3 flex flex-col mb-2 sm:mb-0 h-full">
					<div className="flex justify-between items-center mb-3">
						<div className="text-sm font-medium text-gray-700">
							Danh sách kênh
						</div>
						<Button
							onClick={() => loadChannelStats()}
							size="icon"
							variant="ghost"
							className="h-6 w-6"
						>
							<RefreshCw
								className={`w-3 h-3 ${loadingChannels ? "animate-spin" : ""}`}
							/>
						</Button>
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

					<div className="flex flex-col gap-2 flex-1 overflow-y-auto">
						{sidebarFiltered.map((ch) => {
							const isSelected = selectedChannel?.id === ch.id;
							return (
								<button
									key={ch.id}
									onClick={() => selectChannel(ch)}
									className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer
                    ${isSelected
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
				</aside>

				{/* RIGHT: Main Content */}
				<main className="w-full flex-1 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
					{/* Header Info */}
					<section className="border p-4 bg-brand/10 backdrop-blur-lg rounded-md flex-shrink-0">
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
											onChange={e => setSearchTerm(e.target.value)}
											className="h-9 w-64 pl-9 bg-white"
										/>
									</div>
								</div>
							</div>
						) : (
							<div className="text-gray-500">Chọn một kênh để xem chi tiết</div>
						)}
					</section>

					{/* Table */}
					<section className="flex-1 bg-white rounded-2xl border overflow-hidden shadow flex flex-col">
						{selectedChannel ? (
							<>
								<div className="flex-1 overflow-auto">
									<table className="w-full min-w-[900px]">
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
														onMouseEnter={() => setHoveredCampaign(camp.campaign_id)}
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
															<span className={`px-2 py-0.5 rounded text-xs border ${camp.status === 'running' ? 'bg-green-50 text-green-700 border-green-200' :
																camp.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
																	'bg-gray-50 text-gray-600 border-gray-200'
																}`}>
																{camp.status}
															</span>
														</td>
														<td className="text-xs p-2 text-center">
															{formatCurrency(camp.budget || 0)}
														</td>
														<td className="text-xs p-2 text-center whitespace-nowrap">
															{(camp.start_date || "").slice(0, 10)}
														</td>
														<td className="text-xs p-2 text-center">
															{chData.sent || 0}
														</td>
														<td className="text-xs p-2 text-center">
															{(rates.open_rate * 100).toFixed(1)}%
														</td>
														<td className="text-xs p-2 text-center">
															{(rates.click_rate * 100).toFixed(1)}%
														</td>
														<td className="text-xs p-2 text-center">
															{chData.conversions || 0}
														</td>
														<td className="text-xs p-2 text-center font-medium text-gray-700">
															{formatCurrency(chData.cost || 0)}
														</td>
														<td className="text-xs p-2 text-center w-24">
															<div
																className={`flex justify-center gap-1 transition-opacity duration-200 ${hoveredCampaign === (camp.campaign_id || camp.id)
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
										handlePrev={() => setCampaignPage((p) => Math.max(p - 1, 1))}
									/>
								</div>
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
