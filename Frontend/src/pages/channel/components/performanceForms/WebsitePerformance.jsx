import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function WebsitePerformance({ data = {}, onSave = () => {} }) {
	const payload = data.payload || data;
	const initial = {
		id: payload?.id || null,
		campaignId: payload?.campaignId || '',
		channelId: payload?.channelId || payload?.channel?.id || null,
		views: payload?.views || 0,
		conversion: payload?.conversion || 0,
		bounce_rate: payload?.bounce_rate || 0,
		cost: payload?.cost || 0
	};
	const [form, setForm] = useState(initial);

	useEffect(() => setForm(initial), [data]);

	return (
		<div className="space-y-3">
			<div>
				<label className="text-sm block">Views</label>
				<Input value={form.views} onChange={e => setForm(f => ({ ...f, views: Number(e.target.value) }))} />
			</div>
			<div>
				<label className="text-sm block">Bounce rate (0-1)</label>
				<Input value={form.bounce_rate} onChange={e => setForm(f => ({ ...f, bounce_rate: Number(e.target.value) }))} />
			</div>
			<div>
				<label className="text-sm block">Conversion</label>
				<Input value={form.conversion} onChange={e => setForm(f => ({ ...f, conversion: Number(e.target.value) }))} />
			</div>
			<div>
				<label className="text-sm block">Cost</label>
				<Input value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
			</div>

			<div className="flex justify-end gap-2">
				<Button onClick={() => onSave(form)}>Lưu</Button>
			</div>
		</div>
	);
}
