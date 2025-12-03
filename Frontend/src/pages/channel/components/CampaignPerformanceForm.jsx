import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/*
 Expects data:
  - campaignChannels: array
  - channel: current channel (optional)
  - campaigns: list of campaigns (for selection)
  - payload may contain an existing campaign-channel object to edit
 onSave receives the perf object
*/

export default function CampaignPerformanceForm({ data = {}, onSave }) {
  const existing = data?.payload || null;
  const [form, setForm] = useState({
    id: null,
    campaignId: data?.campaigns?.[0]?.id || null,
    channelId: data?.channel?.id || null,
    sent_count: 0,
    open_rate: 0,
    click_rate: 0,
    conversion: 0,
    cost: 0
  });

  useEffect(() => {
    if (existing) setForm({ ...form, ...existing });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const submit = (e) => {
    e.preventDefault();
    // basic validation
    if (!form.campaignId || !form.channelId) return;
    onSave && onSave(form);
  };

  return (
    <form className="p-4 space-y-3" onSubmit={submit}>
      <div>
        <label className="text-sm font-medium">Chiến dịch</label>
        <select value={form.campaignId || ''} onChange={e => setForm(s => ({ ...s, campaignId: parseInt(e.target.value || 0) }))} className="w-full border rounded p-2">
          <option value="">-- Chọn chiến dịch --</option>
          {(data.campaigns || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Sent count</label>
          <Input type="number" value={form.sent_count} onChange={e => setForm(s => ({ ...s, sent_count: parseInt(e.target.value || 0) }))} />
        </div>
        <div>
          <label className="text-sm">Cost</label>
          <Input type="number" step="0.01" value={form.cost} onChange={e => setForm(s => ({ ...s, cost: parseFloat(e.target.value || 0) }))} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm">Open rate (0-1)</label>
          <Input type="number" step="0.01" value={form.open_rate} onChange={e => setForm(s => ({ ...s, open_rate: parseFloat(e.target.value || 0) }))} />
        </div>
        <div>
          <label className="text-sm">Click rate (0-1)</label>
          <Input type="number" step="0.01" value={form.click_rate} onChange={e => setForm(s => ({ ...s, click_rate: parseFloat(e.target.value || 0) }))} />
        </div>
        <div>
          <label className="text-sm">Conversion</label>
          <Input type="number" value={form.conversion} onChange={e => setForm(s => ({ ...s, conversion: parseInt(e.target.value || 0) }))} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" variant="actionCreate">Lưu</Button>
      </div>
    </form>
  );
}
