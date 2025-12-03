import React from 'react';
import { Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/helper';

export default function ChannelCard({ channel, campaignsForChannel = [], onView, onEdit, onEditPerformance, onSelect, active }) {
  const totalCost = campaignsForChannel.reduce((s, p) => s + (p.cost || 0), 0);
  const totalConversions = campaignsForChannel.reduce((s, p) => s + (p.conversion || 0), 0);

  return (
    <div
      className={`min-w-[220px] bg-white rounded-lg shadow p-5 flex flex-col justify-between cursor-pointer transition-border ${active ? 'ring-2 ring-brand/60 border-transparent' : 'border'}`}
      onClick={(e) => {
        // card body click selects tab; stop propagation for buttons
        if (onSelect) onSelect();
      }}
    >
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{channel.name}</div>
            <div className="text-sm text-gray-500">{channel.description}</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">{campaignsForChannel.length} chiến dịch</div>
            <div className="text-gray-500">Chi phí: {formatCurrency(totalCost)}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <div className="text-xs text-gray-500">Sent</div>
            <div className="font-medium">{campaignsForChannel.reduce((s, p) => s + (p.sent_count || 0), 0)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Conversion</div>
            <div className="font-medium">{totalConversions}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Avg Cost</div>
            <div className="font-medium">{formatCurrency(channel.defaultCostPerUnit || 0)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {/* prevent card's onClick when clicking these buttons */}
        <Button variant="actionRead" size="icon" onClick={(e) => { e.stopPropagation(); onView && onView(); }}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="actionUpdate" size="icon" onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}>
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
