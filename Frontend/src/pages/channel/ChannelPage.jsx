import { useState, useEffect } from 'react';
import { Search, Plus, Mail, MessageCircle, Video, Globe, Box, Settings2, Settings, Eye, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppDialog from '@/components/dialogs/AppDialog';
import AppPagination from '@/components/pagination/AppPagination';
import ChannelForm from './components/ChannelForm';
import CampaignPerformanceForm from './components/CampaignPerformanceForm';
import LiveStreamPerformance from './components/performanceForms/LiveStreamPerformance';
import { formatCurrency } from '@/utils/helper';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';

export default function ChannelPage() {
	// sample channels
	const SAMPLE_CHANNELS = [
		{ id: 1, name: 'Email', description: 'Email marketing', defaultCostPerUnit: 0.01 },
		{ id: 2, name: 'SMS', description: 'SMS gateway', defaultCostPerUnit: 0.08 },
		{ id: 3, name: 'LiveStream - YouTube', description: 'YouTube LiveStream', defaultCostPerUnit: 0.3 },
		{ id: 4, name: 'LandingPage', description: 'Landing page conversion', defaultCostPerUnit: 0.05 }
	];

	const SAMPLE_CAMPAIGNS = [
		{ id: 101, name: 'Black Friday', totalBudget: 20000, startDate: '2025-11-20', endDate: '2025-11-30' },
		{ id: 102, name: 'New Year Promo', totalBudget: 10000, startDate: '2025-12-20', endDate: '2026-01-05' },
		{ id: 103, name: 'Spring Launch', totalBudget: 8000, startDate: '2025-03-01', endDate: '2025-03-31' },
		{ id: 104, name: 'Valentine Sale', totalBudget: 15000, startDate: '2025-02-01', endDate: '2025-02-15' },
		{ id: 105, name: 'Women Day Event', totalBudget: 12000, startDate: '2025-03-01', endDate: '2025-03-10' },
		{ id: 106, name: 'Summer Mega Sale', totalBudget: 18000, startDate: '2025-06-01', endDate: '2025-06-30' },
		{ id: 107, name: 'Mid Autumn Deals', totalBudget: 9000, startDate: '2025-09-05', endDate: '2025-09-25' },
		{ id: 108, name: 'Back To School', totalBudget: 11000, startDate: '2025-07-20', endDate: '2025-08-20' },
		{ id: 109, name: 'Super 11.11', totalBudget: 25000, startDate: '2025-11-01', endDate: '2025-11-12' },
		{ id: 110, name: 'Flash Sale Weekend', totalBudget: 5000, startDate: '2025-04-12', endDate: '2025-04-14' },
		{ id: 111, name: 'Brand Awareness Push', totalBudget: 30000, startDate: '2025-05-01', endDate: '2025-05-31' },
		{ id: 112, name: 'Customer Loyalty Boost', totalBudget: 7000, startDate: '2025-03-10', endDate: '2025-04-10' },
		{ id: 113, name: 'Livestream Festival', totalBudget: 16000, startDate: '2025-10-01', endDate: '2025-10-31' },
		{ id: 114, name: 'Xmas Countdown', totalBudget: 22000, startDate: '2025-12-01', endDate: '2025-12-24' },
		{ id: 115, name: 'Big Brand Collab Week', totalBudget: 14000, startDate: '2025-08-01', endDate: '2025-08-07' },
		{ id: 116, name: 'Free Shipping Week', totalBudget: 6000, startDate: '2025-05-15', endDate: '2025-05-22' },
		{ id: 117, name: 'Anniversary Celebration', totalBudget: 20000, startDate: '2025-09-01', endDate: '2025-09-10' },
		{ id: 118, name: 'Product Relaunch Push', totalBudget: 13000, startDate: '2025-04-20', endDate: '2025-05-05' },
		{ id: 119, name: 'Gaming Gear Week', totalBudget: 9000, startDate: '2025-07-01', endDate: '2025-07-10' },
		{ id: 120, name: 'Household Essentials Sale', totalBudget: 8000, startDate: '2025-06-10', endDate: '2025-06-25' },
		{ id: 121, name: 'Beauty Super Week', totalBudget: 17000, startDate: '2025-03-15', endDate: '2025-03-25' },
		{ id: 122, name: 'Tech Expo Online', totalBudget: 28000, startDate: '2025-10-10', endDate: '2025-10-20' },
		{ id: 123, name: 'Lunar New Year Kickoff', totalBudget: 26000, startDate: '2026-01-10', endDate: '2026-01-31' }
	];


	const SAMPLE_CAMPAIGN_CHANNEL = [
		{ id: 1001, campaignId: 101, channelId: 1, sent_count: 50000, open_rate: 0.25, click_rate: 0.05, conversion: 120, cost: 500 },
		{ id: 1002, campaignId: 101, channelId: 3, sent_count: 50000, open_rate: 0.15, click_rate: 0.03, conversion: 60, cost: 2000 },
		{ id: 1003, campaignId: 102, channelId: 2, sent_count: 150000, open_rate: 0.12, click_rate: 0.03, conversion: 180, cost: 4000 },

		// Campaign 103 – Spring Launch
		{ id: 1004, campaignId: 103, channelId: 1, sent_count: 30000, open_rate: 0.22, click_rate: 0.04, conversion: 80, cost: 350 },
		{ id: 1005, campaignId: 103, channelId: 4, sent_count: 12000, open_rate: 0.35, click_rate: 0.10, conversion: 50, cost: 600 },

		// 104 Valentine
		{ id: 1006, campaignId: 104, channelId: 1, sent_count: 45000, open_rate: 0.28, click_rate: 0.06, conversion: 140, cost: 700 },
		{ id: 1007, campaignId: 104, channelId: 4, sent_count: 18000, open_rate: 0.40, click_rate: 0.12, conversion: 90, cost: 750 },

		// 105 Women Day Event
		{ id: 1008, campaignId: 105, channelId: 2, sent_count: 90000, open_rate: 0.10, click_rate: 0.02, conversion: 130, cost: 1800 },
		{ id: 1009, campaignId: 105, channelId: 1, sent_count: 30000, open_rate: 0.23, click_rate: 0.05, conversion: 70, cost: 400 },

		// 106 Summer Mega Sale
		{ id: 1010, campaignId: 106, channelId: 3, sent_count: 70000, open_rate: 0.18, click_rate: 0.05, conversion: 110, cost: 2500 },
		{ id: 1011, campaignId: 106, channelId: 4, sent_count: 25000, open_rate: 0.32, click_rate: 0.09, conversion: 95, cost: 900 },

		// 107 Mid Autumn
		{ id: 1012, campaignId: 107, channelId: 1, sent_count: 28000, open_rate: 0.26, click_rate: 0.05, conversion: 85, cost: 350 },
		{ id: 1013, campaignId: 107, channelId: 3, sent_count: 48000, open_rate: 0.14, click_rate: 0.03, conversion: 60, cost: 1800 },

		// 108 Back To School
		{ id: 1014, campaignId: 108, channelId: 2, sent_count: 120000, open_rate: 0.11, click_rate: 0.02, conversion: 150, cost: 2500 },
		{ id: 1015, campaignId: 108, channelId: 4, sent_count: 30000, open_rate: 0.30, click_rate: 0.08, conversion: 110, cost: 1000 },

		// 109 Super 11.11
		{ id: 1016, campaignId: 109, channelId: 1, sent_count: 60000, open_rate: 0.27, click_rate: 0.06, conversion: 160, cost: 800 },
		{ id: 1017, campaignId: 109, channelId: 3, sent_count: 90000, open_rate: 0.18, click_rate: 0.04, conversion: 130, cost: 3500 },
		{ id: 1018, campaignId: 109, channelId: 4, sent_count: 40000, open_rate: 0.34, click_rate: 0.09, conversion: 150, cost: 1500 },

		// 110 Flash Sale Weekend
		{ id: 1019, campaignId: 110, channelId: 1, sent_count: 20000, open_rate: 0.24, click_rate: 0.05, conversion: 40, cost: 160 },
		{ id: 1020, campaignId: 110, channelId: 2, sent_count: 50000, open_rate: 0.08, click_rate: 0.02, conversion: 60, cost: 900 },

		// 111 Brand Awareness
		{ id: 1021, campaignId: 111, channelId: 3, sent_count: 150000, open_rate: 0.12, click_rate: 0.03, conversion: 200, cost: 5000 },

		// 112 Customer Loyalty
		{ id: 1022, campaignId: 112, channelId: 1, sent_count: 35000, open_rate: 0.30, click_rate: 0.07, conversion: 90, cost: 420 },
		{ id: 1023, campaignId: 112, channelId: 4, sent_count: 15000, open_rate: 0.36, click_rate: 0.11, conversion: 65, cost: 580 },

		// 113 Livestream Festival
		{ id: 1024, campaignId: 113, channelId: 3, sent_count: 130000, open_rate: 0.16, click_rate: 0.04, conversion: 180, cost: 4500 },

		// 114 Xmas Countdown
		{ id: 1025, campaignId: 114, channelId: 1, sent_count: 50000, open_rate: 0.29, click_rate: 0.07, conversion: 150, cost: 700 },
		{ id: 1026, campaignId: 114, channelId: 4, sent_count: 25000, open_rate: 0.38, click_rate: 0.12, conversion: 120, cost: 1000 },

		// 115 Big Brand Collab
		{ id: 1027, campaignId: 115, channelId: 3, sent_count: 90000, open_rate: 0.17, click_rate: 0.04, conversion: 140, cost: 3200 },

		// 116 Free Shipping Week
		{ id: 1028, campaignId: 116, channelId: 1, sent_count: 27000, open_rate: 0.26, click_rate: 0.06, conversion: 78, cost: 300 },

		// 117 Anniversary Celebration
		{ id: 1029, campaignId: 117, channelId: 4, sent_count: 32000, open_rate: 0.33, click_rate: 0.10, conversion: 100, cost: 900 },

		// 118 Product Relaunch
		{ id: 1030, campaignId: 118, channelId: 1, sent_count: 40000, open_rate: 0.25, click_rate: 0.05, conversion: 110, cost: 550 }
	];


	const [channels, setChannels] = useState([]);
	const [campaigns] = useState(SAMPLE_CAMPAIGNS);
	const [campaignChannels, setCampaignChannels] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	// pagination for campaigns (per-channel)
	const [campaignPage, setCampaignPage] = useState(1);
	const campaignPerPage = 8;

	// dialog state
	const [dialog, setDialog] = useState({ open: false, mode: 'view', payload: null });
	const [selectedChannel, setSelectedChannel] = useState(null);

	// hover state để hiện action buttons trên từng hàng chiến dịch
	const [hoveredCampaign, setHoveredCampaign] = useState(null);

	useEffect(() => {
		setChannels(SAMPLE_CHANNELS);
		setCampaignChannels(SAMPLE_CAMPAIGN_CHANNEL);
		setSelectedChannel(SAMPLE_CHANNELS[0] || null);
	}, []);

	const filtered = channels.filter(ch => !searchTerm || ch.name.toLowerCase().includes(searchTerm.toLowerCase()));

	// campaigns for currently selected channel + pagination
	const campaignsForSelected = selectedChannel ? campaignChannels.filter(cc => cc.channelId === selectedChannel.id) : [];
	const totalCampaignPages = Math.max(1, Math.ceil(campaignsForSelected.length / campaignPerPage));
	const currentCampaigns = campaignsForSelected.slice((campaignPage - 1) * campaignPerPage, campaignPage * campaignPerPage);

	// select channel (either from dropdown or from UI)
	const selectChannel = (channel) => {
		setSelectedChannel(channel);
		// reset campaign pagination when switching channel
		setCampaignPage(1);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	// dialog handlers
	const openEditChannel = (channel) => setDialog({ open: true, mode: 'edit-channel', payload: channel });
	const openAddChannel = () => setDialog({ open: true, mode: 'add-channel', payload: null });
	const openEditPerformance = (campaignChannel) => setDialog({ open: true, mode: 'edit-performance', payload: campaignChannel });
	const openSetupPerformanceForChannel = (channelId) => setDialog({ open: true, mode: 'edit-performance', payload: { channelId } });
	const closeDialog = () => setDialog({ open: false, mode: 'view', payload: null });

	// delete a campaign-channel configuration
	const handleDeleteCampaign = (id) => {
		setCampaignChannels(prev => prev.filter(cc => cc.id !== id));
		toast.success('Đã xóa cấu hình chiến dịch cho kênh');
	};

	const handleSaveChannel = (data) => {
		if (!data.id) {
			const id = Math.max(0, ...channels.map(c => c.id)) + 1;
			setChannels(prev => [{ ...data, id }, ...prev]);
			toast.success('Đã thêm kênh');
			setSelectedChannel({ ...data, id });
		} else {
			setChannels(prev => prev.map(c => (c.id === data.id ? { ...c, ...data } : c)));
			toast.success('Đã cập nhật kênh');
			if (selectedChannel?.id === data.id) setSelectedChannel(prev => ({ ...prev, ...data }));
		}
		closeDialog();
	};

	const handleSavePerformance = (perf) => {
		if (perf.id) {
			setCampaignChannels(prev => prev.map(p => (p.id === perf.id ? { ...p, ...perf } : p)));
			toast.success('Đã cập nhật hiệu suất kênh cho chiến dịch');
		} else {
			const id = Math.max(0, ...campaignChannels.map(c => c.id)) + 1;
			setCampaignChannels(prev => [{ ...perf, id }, ...prev]);
			toast.success('Đã tạo cấu hình hiệu suất cho chiến dịch trên kênh này');
		}
		closeDialog();
	};

	const handleDeleteChannel = (id) => {
		setChannels(prev => prev.filter(c => c.id !== id));
		setCampaignChannels(prev => prev.filter(cc => cc.channelId !== id));
		if (selectedChannel?.id === id) setSelectedChannel(null);
		toast.success('Đã xóa kênh và các cấu hình liên quan');
		closeDialog();
	};

	const dialogData = {
		channel: dialog.payload?.channel || channels.find(c => c.id === dialog.payload?.channelId) || selectedChannel || dialog.payload,
		campaigns,
		campaignChannels,
		channels,
		payload: dialog.payload
	};

	// choose performance form by channel name/type
	const getPerformanceFormComponent = (channel) => {
		// If no channel provided, fallback to generic campaign performance editor
		if (!channel) return CampaignPerformanceForm;
		const n = (channel.name || '').toLowerCase();

		// Live stream gets specialized editor
		if (n.includes('stream') || n.includes('livestream') || n.includes('youtube')) return LiveStreamPerformance;

		// Generic form for Email / SMS / Website with slightly different fields
		const GenericPerformanceForm = ({ data = {}, onSave = () => { }, onCancel = () => { } }) => {
			const payload = data.payload || data || {};
			const initial = {
				id: payload?.id || null,
				campaignId: payload?.campaignId || '',
				channelId: payload?.channelId || payload?.channel?.id || null,
				sent_count: payload?.sent_count ?? 0,
				open_rate: payload?.open_rate ?? 0,
				click_rate: payload?.click_rate ?? 0,
				conversion: payload?.conversion ?? 0,
				cost: payload?.cost ?? 0,
				frequency: payload?.frequency ?? 'daily' // example channel-setting
			};
			const [form, setForm] = useState(initial);
			useEffect(() => setForm(initial), [data]);

			// small helper for channel-specific helper buttons
			const openChannelSetup = () => {
				alert(`Mở cài đặt kênh ${channel.name} (demo)`);
			};

			return (
				<div className="space-y-3">
					<div className="flex gap-2">
						<Button variant="actionNormal" onClick={openChannelSetup}>Thiết lập kênh</Button>
						{n.includes('email') && <Button variant="actionNormal" onClick={() => alert('Gửi test email (demo)')}>Gửi test</Button>}
						{n.includes('sms') && <Button variant="actionNormal" onClick={() => alert('Gửi test SMS (demo)')}>Gửi test</Button>}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-sm block">Sent</label>
							<Input value={form.sent_count} onChange={e => setForm(f => ({ ...f, sent_count: Number(e.target.value) }))} />
						</div>
						<div>
							<label className="text-sm block">Open %</label>
							<Input value={form.open_rate} onChange={e => setForm(f => ({ ...f, open_rate: Number(e.target.value) }))} />
						</div>
						<div>
							<label className="text-sm block">Click %</label>
							<Input value={form.click_rate} onChange={e => setForm(f => ({ ...f, click_rate: Number(e.target.value) }))} />
						</div>
						<div>
							<label className="text-sm block">Conversion</label>
							<Input value={form.conversion} onChange={e => setForm(f => ({ ...f, conversion: Number(e.target.value) }))} />
						</div>
						<div>
							<label className="text-sm block">Cost</label>
							<Input value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
						</div>
						<div>
							<label className="text-sm block">Frequency</label>
							<select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full border rounded px-2 py-1">
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
					</div>

					<div className="flex justify-end gap-2">
						<Button variant="secondary" onClick={() => onCancel && onCancel()}>Huỷ</Button>
						<Button onClick={() => onSave(form)}>Lưu</Button>
					</div>
				</div>
			);
		};

		// For email/sms/website/landing use the generic form, otherwise the campaign-level default
		if (n.includes('email') || n.includes('sms') || n.includes('landing') || n.includes('website') || n.includes('page')) return GenericPerformanceForm;
		return CampaignPerformanceForm;
	};

	// choose icon by channel name - match Block sizing (small icon)
	const getChannelIcon = (ch) => {
		const n = (ch.name || '').toLowerCase();
		const baseClass = "w-5 h-5 text-brand-600"; // match Block
		if (n.includes('email')) return <Mail className={baseClass} />;
		if (n.includes('sms')) return <MessageCircle className={baseClass} />;
		if (n.includes('stream') || n.includes('youtube') || n.includes('live')) return <Video className={baseClass} />;
		if (n.includes('landing') || n.includes('website') || n.includes('page')) return <Globe className={baseClass} />;
		return <Box className={baseClass} />;
	};

	return (
		// make page occupy full viewport height and be flexible
		<div className="flex flex-col min-h-screen">
			<div className="pt-4 flex-1 min-h-0">
				{/* container: left + right, responsive flex-col on small screens */}
				<div className="flex flex-col sm:flex-row gap-2 px-0 min-h-0 flex-1">
					{/* Left: channels column */}
					<aside className="w-full sm:w-64 bg-white rounded-2xl border p-3 flex flex-col min-h-0 mb-2 sm:mb-0">
						<div className="flex justify-between items-center mb-3">
							<div className=" mb-2 text-sm font-medium text-gray-700">Danh sách kênh</div>
							<Button onClick={openAddChannel}
									size="icon"
									variant="actionCreate"
									className="gap-0 ">
								<Plus className="w-4 h-4" />
							</Button>
						</div>

						<div className="flex flex-col gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<Input placeholder="Tìm kênh..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
							</div>

							{filtered.map((ch) => {
								const chCampaigns = campaignChannels.filter(cc => cc.channelId === ch.id);
								const totalCost = chCampaigns.reduce((s, c) => s + (c.cost || 0), 0);
								const isSelected = selectedChannel?.id === ch.id;
								return (
									<button
										key={ch.id}
										onClick={() => selectChannel(ch)}
										className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer
											${isSelected ? 'border-brand-500 bg-brand-50' : 'border-brand-100 hover:border-brand-500 hover:bg-brand-50/40'}`}
									>
										{/* left: icon + label */}
										<div className="flex items-center gap-3 min-w-0">
											{getChannelIcon(ch)}
											<div className="min-w-0">
												<div className="text-sm font-medium text-gray-900 truncate">{ch.name}</div>
												<div className="text-xs text-gray-500 truncate">Chi phí: {formatCurrency(totalCost)}</div>
											</div>
										</div>

										{/* right: badge/count */}
										<div className="flex items-center gap-3 ml-3">
											<div className="text-sm font-semibold text-gray-700">{chCampaigns.length}</div>
										</div>
									</button>
								);
							})}
							{filtered.length === 0 && <div className="text-gray-500 p-2">Không có kênh</div>}
						</div>
					</aside>

					{/* Right: campaigns/main content */}
					<main className="w-full flex-1 flex flex-col gap-2 h-full min-h-0 overflow-auto">
						{/* Top: Channel info (no scroll) */}
						<section className=" border p-4  bg-brand/10 backdrop-blur-lg rounded-md">
							{selectedChannel ? (
								<div className="flex items-center justify-between">
									<div>
										<div className="text-xl font-semibold">{selectedChannel.name}</div>

										<div className="text-sm text-gray-500">{selectedChannel.description}</div>
									</div>
									<div className="gap-1 flex">
										<Button variant="actionNormal" onClick={() => openEditChannel(selectedChannel)}>
											<Settings className="w-4 h-4 mr-1" />
											Thiết lập kênh</Button>
										<Button variant="actionCreate" onClick={() => openEditChannel(selectedChannel)}>
											<Plus className="w-4 h-4 mr-1" />
											Thêm chiến dịch</Button>
									</div>
								</div>
							) : (
								<div className="text-gray-500">Chọn một kênh để xem chi tiết</div>
							)}
						</section>

						{/* Bottom: Campaigns table (scrollable) */}
						<section className="flex-1 bg-white rounded-2xl border overflow-auto min-h-0 ">
							{selectedChannel ? (
								<div className="overflow-x-auto min-h-0">
									<table className="w-full min-w-[900px] ">
										<thead className="bg-gray-50">
											<tr>
												{['Chiến dịch', 'Ngân sách', 'Thời gian', 'Sent', 'Open %', 'Click %', 'Conversion', 'Cost', ''].map(h => (
													<th key={h} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{h}</th>
												))}
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{currentCampaigns.map(cc => {
												const camp = campaigns.find(c => c.id === cc.campaignId) || { id: cc.campaignId, name: 'Unknown', totalBudget: 0, startDate: '', endDate: '' };
												return (
													<tr
														key={cc.id}
														onMouseEnter={() => setHoveredCampaign(cc.id)}
														onMouseLeave={() => setHoveredCampaign(null)}
														className="transition-colors"
													>
														<td className="px-4 py-3 text-left">
															<div className="text-xs font-medium">{camp.name}</div>
														</td>
														<td className="text-xs p-2 text-center">{formatCurrency(camp.totalBudget || 0)}</td>
														<td className="text-xs p-2 text-center">{(camp.startDate || '').slice(0, 10)}{camp.endDate ? ` - ${(camp.endDate || '').slice(0, 10)}` : ''}</td>
														<td className="text-xs p-2 text-center">{cc.sent_count || 0}</td>
														<td className="text-xs p-2 text-center">{Math.round((cc.open_rate || 0) * 100)}%</td>
														<td className="text-xs p-2 text-center">{Math.round((cc.click_rate || 0) * 100)}%</td>
														<td className="text-xs p-2 text-center">{cc.conversion || 0}</td>
														<td className="text-xs p-2 text-center">{formatCurrency(cc.cost || 0)}</td>
														<td className="text-xs p-2 text-center w-36">
															{/* action buttons: chỉ hiện khi hover trên hàng này */}
															<div className={`flex justify-center transition-all duration-200 gap-1 ${hoveredCampaign === cc.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
																<Button variant="actionUpdate" size="icon" onClick={() => openEditPerformance(cc)} >
																	<Eye className="w-4 h-4" />
																</Button>
																<Button variant="actionUpdate" size="icon" onClick={() => openEditPerformance(cc)}>
																	<Edit className="w-4 h-4" />
																</Button>
																<ConfirmDialog
																	title="Xác nhận xóa"
																	description={<>
																		Bạn có chắc chắn muốn xóa chiến dịch <span className="font-semibold text-black">{cc?.name}</span>?
																	</>}
																	confirmText="Xóa"
																	cancelText="Hủy"
																	onConfirm={() => handleDeleteCampaign(cc.id)}
																>
																	<Button variant="actionDelete" size="icon">
																		<Trash2 className="w-4 h-4" />
																	</Button>
																</ConfirmDialog>
															</div>
														</td>
													</tr>
												);
											})}

											{campaignsForSelected.length === 0 && (
												<tr><td colSpan={9} className="text-center py-8 text-gray-500">Chưa có chiến dịch trên kênh này</td></tr>
											)}
										</tbody>
									</table>
								</div>
							) : (
								<div className="text-center text-gray-500 py-8">Chọn một kênh để xem chiến dịch</div>
							)}
						</section>

						{/* Pagination centered inside right column */}
						<div className="flex justify-center mt-1">
							<AppPagination totalPages={totalCampaignPages} currentPage={campaignPage} handlePageChange={setCampaignPage} handleNext={() => setCampaignPage(p => Math.min(p + 1, totalCampaignPages))} handlePrev={() => setCampaignPage(p => Math.max(p - 1, 1))} />
						</div>
					</main>

				</div>

				{/* Dialog for channel / performance forms (unchanged) */}
				<AppDialog
					open={dialog.open}
					onClose={closeDialog}
					title={{
						'edit-channel': dialog.payload ? `Sửa kênh - ${dialog.payload.name}` : 'Thêm kênh',
						'add-channel': 'Thêm kênh',
						'edit-performance': 'Hiệu suất chiến dịch trên kênh'
					}}
					mode={dialog.mode}
					FormComponent={(dialog.mode === 'edit-performance')
						? getPerformanceFormComponent(dialogData.channel)
						: (dialog.mode === 'edit-channel' || dialog.mode === 'add-channel') ? ChannelForm : CampaignPerformanceForm}
					data={dialogData}
					onSave={dialog.mode === 'edit-performance' ? handleSavePerformance : handleSaveChannel}
					onDelete={dialog.mode === 'edit-channel' ? handleDeleteChannel : undefined}
					onEdit={() => { }}
					maxWidth="sm:max-w-4xl"
				/>
			</div>
		</div>
	);
}
