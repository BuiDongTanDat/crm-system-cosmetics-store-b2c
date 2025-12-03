import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SMSPerformance({ data = {}, onSave = () => {} }) {
	const payload = data.payload || data;
	const initial = {
		id: payload?.id || null,
		campaignId: payload?.campaignId || '',
		channelId: payload?.channelId || payload?.channel?.id || null,
		sent_count: payload?.sent_count || 0,
		delivery_rate: payload?.delivery_rate || 0,
		conversion: payload?.conversion || 0,
		cost: payload?.cost || 0
	};
	const [form, setForm] = useState(initial);

	useEffect(() => setForm(initial), [data]);

	return (
		<div className="space-y-3">
			{/* minimal SMS-specific fields */}
			<div>
				<label className="text-sm block">Sent</label>
				<Input value={form.sent_count} onChange={e => setForm(f => ({ ...f, sent_count: Number(e.target.value) }))} />
			</div>
			<div>
				<label className="text-sm block">Delivery rate (0-1)</label>
				<Input value={form.delivery_rate} onChange={e => setForm(f => ({ ...f, delivery_rate: Number(e.target.value) }))} />
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
