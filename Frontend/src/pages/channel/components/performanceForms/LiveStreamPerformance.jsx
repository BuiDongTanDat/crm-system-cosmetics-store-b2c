import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LiveStreamPerformance({ data = {}, onSave = () => {}, onCancel = () => {} }) {
	const payload = data.payload || data || {};
	const initial = {
		id: payload?.id || null,
		campaignId: payload?.campaignId || '',
		channelId: payload?.channelId || payload?.channel?.id || null,
		viewers: payload?.viewers ?? 0,
		peak_viewers: payload?.peak_viewers ?? 0,
		average_watch_time: payload?.average_watch_time ?? 0,
		engagement_rate: payload?.engagement_rate ?? 0,
		conversion: payload?.conversion ?? 0,
		cost: payload?.cost ?? 0,
		schedule: payload?.schedule || '',
		enableChat: payload?.enableChat ?? true,
		recordStream: payload?.recordStream ?? false
	};

	const [form, setForm] = useState(initial);

	useEffect(() => {
		setForm(initial);
	}, [data]);

	const openPreview = () => {
		// giả lập preview
		window.open(`#preview-stream-${form.channelId || 'tmp'}`, '_blank');
	};
	const openAnalytics = () => {
		// giả lập analytics
		window.open(`#analytics-campaign-${form.campaignId || 'tmp'}`, '_blank');
	};
	const testStream = () => {
		// placeholder: thực hiện test (có thể gọi API)
		console.log('Testing stream for', form);
		alert('Test stream started (demo)');
	};

	return (
		<div className="space-y-4">
			{/* top actions specific to live-stream channel */}
			<div className="flex gap-2">
				<Button variant="actionNormal" onClick={openPreview}>Preview</Button>
				<Button variant="actionNormal" onClick={openAnalytics}>Analytics</Button>
				<Button variant="actionCreate" onClick={testStream}>Test Stream</Button>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="text-sm block">Viewers</label>
					<Input value={form.viewers} onChange={e => setForm(f => ({ ...f, viewers: Number(e.target.value) }))} />
				</div>
				<div>
					<label className="text-sm block">Peak viewers</label>
					<Input value={form.peak_viewers} onChange={e => setForm(f => ({ ...f, peak_viewers: Number(e.target.value) }))} />
				</div>
				<div>
					<label className="text-sm block">Average watch time (s)</label>
					<Input value={form.average_watch_time} onChange={e => setForm(f => ({ ...f, average_watch_time: Number(e.target.value) }))} />
				</div>
				<div>
					<label className="text-sm block">Engagement rate (%)</label>
					<Input value={form.engagement_rate} onChange={e => setForm(f => ({ ...f, engagement_rate: Number(e.target.value) }))} />
				</div>
				<div>
					<label className="text-sm block">Conversion</label>
					<Input value={form.conversion} onChange={e => setForm(f => ({ ...f, conversion: Number(e.target.value) }))} />
				</div>
				<div>
					<label className="text-sm block">Cost</label>
					<Input value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
				</div>
				<div className="col-span-2">
					<label className="text-sm block">Schedule (ISO datetime)</label>
					<Input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
				</div>
				<div>
					<label className="text-sm block">Enable Chat</label>
					<select value={form.enableChat ? '1' : '0'} onChange={e => setForm(f => ({ ...f, enableChat: e.target.value === '1' }))} className="w-full border rounded px-2 py-1">
						<option value="1">Yes</option>
						<option value="0">No</option>
					</select>
				</div>
				<div>
					<label className="text-sm block">Record Stream</label>
					<select value={form.recordStream ? '1' : '0'} onChange={e => setForm(f => ({ ...f, recordStream: e.target.value === '1' }))} className="w-full border rounded px-2 py-1">
						<option value="1">Yes</option>
						<option value="0">No</option>
					</select>
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="secondary" onClick={() => onCancel && onCancel()}>Huỷ</Button>
				<Button onClick={() => onSave(form)}>Lưu</Button>
			</div>
		</div>
	);
}
