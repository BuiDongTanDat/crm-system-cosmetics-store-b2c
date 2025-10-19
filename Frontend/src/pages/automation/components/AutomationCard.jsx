import React, { useState } from 'react';
import { Play, Pause, Edit, Trash2, Eye, Tags, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerOptions, actionOptions } from '@/lib/data';
import { formatDate } from '@/utils/helper';


export default function AutomationCard({
  automation,
  onView,
  onEdit,
  onDelete,
  onStatusChange
}) {
  const [hovered, setHovered] = useState(false);


  // Badge trạng thái giống listview
  const getStatusBadge = (status) => {
    let color = 'bg-gray-100 text-gray-700';
    let text = status ? status : 'UNDEFINED';
    if (status === 'ACTIVE') {
      color = 'bg-green-100 text-green-700';
    } else if (status === 'DRAFT') {
      color = 'bg-gray-100 text-gray-700';
    } else if (status === 'INACTIVE') {
      color = 'bg-red-100 text-red-700';
    }
    return (
      <span className={`inline-block px-1 py-1 rounded-full w-[80px] text-center text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  return (
    <div
      className="bg-white rounded-lg border shadow-sm p-4 flex flex-col gap-2 transition-all duration-150 animate-fade-in relative
        hover:scale-105 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-lg">{automation.name}</div>
          <div className="text-sm text-gray-500">{automation.description}</div>
        </div>
        <div>
          {getStatusBadge(automation.status)}
        </div>
      </div>
      <div className="text-sm text-gray-600">
        <div><strong>Tags:</strong> {(automation.tags || []).join(', ')}</div>
        <div><strong>Người tạo:</strong> {automation.created_by}</div>
        <div><strong>Tạo lúc:</strong> {automation.created_at ? formatDate(automation.created_at) : ''}</div>
        <div><strong>Cập nhật lúc:</strong> {automation.updated_at ? formatDate(automation.updated_at) : ''}</div>
      </div>
      {/* Triggers summary */}
      <div className="mt-2">
        <div className="font-semibold text-xs">Triggers:</div>
        {automation.triggers?.length ? (
          <ul className="list-disc ml-4 text-xs">
            {automation.triggers.map((t, idx) => (
              <li key={t.trigger_id || idx}>
                {triggerOptions.find(opt => opt.value === t.event_type)?.label || t.event_type}
                {t.conditions?.length ? ` (${t.conditions.map(c => c.field).join(', ')})` : ''}
              </li>
            ))}
          </ul>
        ) : <span className="text-gray-400 text-xs">Không có trigger</span>}
      </div>
      {/* Actions summary */}
      <div className="mt-2">
        <div className="font-semibold text-xs">Actions:</div>
        {automation.actions?.length ? (
          <ul className="list-disc ml-4 text-xs">
            {automation.actions.map((a, idx) => (
              <li key={a.action_id || idx}>
                {actionOptions.find(opt => opt.value === a.action_type)?.label || a.action_type}
                {a.channel ? ` (${a.channel})` : ''}
              </li>
            ))}
          </ul>
        ) : <span className="text-gray-400 text-xs">Không có action</span>}
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between mt-4 relative h-10">
        {/* Action buttons - chỉ hiện khi hover */}
        {hovered && (
          <div className="flex items-center gap-2 absolute left-0 top-0 h-10 animate-slide-up duration-200">
            <Button variant="actionRead" size="icon" onClick={() => onView(automation)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="actionUpdate" size="icon" onClick={() => onEdit(automation)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="actionDelete" size="icon" onClick={() => onDelete(automation.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        {/* Nút kích hoạt/tạm dừng luôn hiển thị */}
        <div className="absolute right-0 top-0 h-10 flex items-center">
          <Button
            variant={automation.status === 'ACTIVE' ? 'actionUpdate' : 'actionCreate'}
            size="sm"
            onClick={() =>
              onStatusChange(automation.id, automation.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
            }
            className="flex items-center gap-1 px-3 py-1"
          >
            {automation.status === 'ACTIVE' ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="font-medium">Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="font-medium">Kích hoạt</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
