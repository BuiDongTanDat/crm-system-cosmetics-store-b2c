import React from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/helper';

/*
 Props passed via AppDialog.data:
  - channel: selected channel
  - campaigns: list of campaigns
  - campaignChannels: list of campaign-channel mappings
  - onEditPerformance: function provided by parent via AppDialog to open perf editor (not all dialogs pass it; fallback uses onSave)
*/

export default function ChannelDetail({ data = {}, onSave, onEdit }) {
  const { channel, campaigns = [], campaignChannels = [] } = data;
  const related = campaignChannels.filter(cc => cc.channelId === channel?.id) || [];

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-xl font-semibold">{channel?.name}</div>
        <div className="text-sm text-gray-600">{channel?.description}</div>
      </div>

      <div className="mb-2 font-medium">Các chiến dịch chạy trên kênh này</div>
      <div className="space-y-3">
        {related.length === 0 && <div className="text-sm text-gray-500">Chưa có chiến dịch cấu hình cho kênh này.</div>}
        {related.map(r => {
          const camp = campaigns.find(c => c.id === r.campaignId) || { name: 'Unknown' };
          return (
            <div key={r.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div>
                <div className="font-medium">{camp.name}</div>
                <div className="text-sm text-gray-500">Sent: {r.sent_count || 0} • Open: {Math.round((r.open_rate || 0) * 100)}% • Click: {Math.round((r.click_rate || 0) * 100)}%</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Cost: {formatCurrency(r.cost || 0)}</div>
                <div className="mt-2 flex gap-2 justify-end">
                  <Button variant="actionRead" size="sm" onClick={() => onSave && onSave({ action: 'view-perf', payload: r })}>Xem</Button>
                  <Button variant="actionUpdate" size="sm" onClick={() => onSave && onSave({ action: 'edit-perf', payload: r })}>Sửa</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
