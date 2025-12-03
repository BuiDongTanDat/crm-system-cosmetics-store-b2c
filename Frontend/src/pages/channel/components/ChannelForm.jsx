import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ChannelForm({ data = {}, onSave }) {
  const [form, setForm] = useState({ id: null, name: '', description: '', defaultCostPerUnit: 0 });

  useEffect(() => {
    if (data?.channel) {
      setForm({ ...form, ...data.channel });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const submit = (e) => {
    e.preventDefault();
    onSave && onSave(form);
  };

  return (
    <form className="p-4 space-y-3" onSubmit={submit}>
      <div>
        <label className="text-sm font-medium">Tên kênh</label>
        <Input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} required />
      </div>
      <div>
        <label className="text-sm font-medium">Mô tả</label>
        <Input value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} />
      </div>
      <div>
        <label className="text-sm font-medium">Chi phí mặc định (per unit)</label>
        <Input type="number" step="0.01" value={form.defaultCostPerUnit} onChange={e => setForm(s => ({ ...s, defaultCostPerUnit: parseFloat(e.target.value || 0) }))} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" variant="actionCreate">Lưu</Button>
      </div>
    </form>
  );
}
