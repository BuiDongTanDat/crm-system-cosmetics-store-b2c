import React, { useState } from 'react';
import { Eye, Edit, Trash2, CircleUser, Calendar, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatCurrency,
  formatDate,
  getPriorityColor,
  getPriorityLabel,
  getInitials
} from '@/utils/helper';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';

export default function KanbanCard({ card, onView, onEdit, onDelete, onDragStart }) {
  const [isDragging, setIsDragging] = useState(false);

  const title = card?.title || 'Chiến dịch A';
  const customer = card?.customer || 'Khách lẻ';
  const value = Number.isFinite(card?.value) ? card.value : 0;
  const currency = card?.currency || 'VND';
  const assignee = card?.assignee || 'Chưa phân công';
  const lastActivity = card?.lastActivity || card?.createdDate;
  const priority = card?.priority || 'medium';
  const productInterest = card?.productInterest || null;
  const tags = Array.isArray(card?.tags) ? card.tags : [];
  const leadScore = Number.isFinite(card?.leadScore) ? card.leadScore : null;
  const convProbPct = card?.conversionProb != null ? Math.round(card.conversionProb * 100) : null;

  return (
    <div
      className={`group relative bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-101 active:scale-95 ${isDragging ? 'opacity-60 scale-95 rotate-1 shadow-2xl' : ''
        }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', card.id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        if (onDragStart) onDragStart(e);
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onView(card)}
    >
      <div className="space-y-2">
        {/* Priority + Title */}
        <div className="flex gap-1 items-start truncate">
          <span
            className={`self-start px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(priority)}`}
          >
            {getPriorityLabel(priority)}
          </span>
          <h3 className="font-semibold text-gray-900 text-xs leading-snug line-clamp-2">
            {title}
          </h3>
        </div>

        {/* Product interest (optional) */}
        {productInterest && (
          <div className="text-[10px] text-gray-600">
            <span className="px-1.5 py-[1px] rounded bg-gray-100 border border-gray-200">
              {productInterest}
            </span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="text-[10px] px-2 py-[2px] rounded-full bg-slate-100 border border-slate-200 text-slate-700"
                title={t}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Customer */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <CircleUser className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{customer}</span>
        </div>

        {/* Value */}
        <div className="flex items-center gap-1.5">
          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-semibold text-emerald-600 text-xs">
            {formatCurrency(value)} {currency}
          </span>
        </div>

        {/* Score & Prob */}
        {(leadScore != null || convProbPct != null) && (
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            {leadScore != null && (
              <span className="px-1.5 py-[1px] rounded bg-gray-100 border border-gray-200">Score: {leadScore}</span>
            )}
            {convProbPct != null && (
              <span className="px-1.5 py-[1px] rounded bg-gray-100 border border-gray-200">Prob: {convProbPct}%</span>
            )}
          </div>
        )}

        {/* Assignee & Date + Actions */}
        <div className="relative flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-[10px]">
                {getInitials(assignee)}
              </span>
            </div>
            <span className="truncate max-w-20">{assignee}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(lastActivity)}</span>
          </div>

          {/* Hover actions */}
          <div
            className="
              absolute inset-0 
              hidden group-hover:flex 
              items-center justify-center gap-2
              bg-white/90
              transition-opacity duration-200
              animate-slide-up
            "
          >
            <Button
              variant="actionRead"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onView(card); }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="actionUpdate"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onEdit(card); }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <ConfirmDialog
              title="Xác nhận xóa"
              description={<>Bạn có chắc chắn muốn xóa deal <span className="font-semibold">{title}</span>?</>}
              confirmText="Xóa"
              cancelText="Hủy"
              onConfirm={() => onDelete(card.id)}
            >
              <Button variant="actionDelete" size="icon" onClick={(e) => e.stopPropagation()}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
