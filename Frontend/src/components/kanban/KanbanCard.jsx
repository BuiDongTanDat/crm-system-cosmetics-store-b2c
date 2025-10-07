import React, { useState } from 'react';
import {
  User,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CircleUser,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatCurrency,
  formatDate,
  getPriorityColor,
  getPriorityLabel,
  getInitials
} from '@/utils/helper';

export default function KanbanCard({ card, onView, onEdit, onDelete, onDragStart }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`group relative bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-101 active:scale-95 ${
        isDragging ? 'opacity-60 scale-95 rotate-1 shadow-2xl' : ''
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', card.id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        if (onDragStart) onDragStart(e);
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onView(card)} //Mở card khi nhấn vào
    >
      {/* Nội dung chính */}
      <div className="space-y-2">
        {/* Tiêu đề & ưu tiên */}
        <div className="flex gap-1 truncate">
          <span
            className={`self-start px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(
              card.priority
            )}`}
          >
            {getPriorityLabel(card.priority)}
          </span>
          <h3 className="font-semibold text-gray-900 text-xs leading-snug line-clamp-2">
            {card.title}
          </h3>
          
        </div>

        {/* Khách hàng */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <CircleUser className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{card.customer}</span>
        </div>

        {/* Giá trị deal */}
        <div className="flex items-center gap-1.5">
          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-semibold text-emerald-600 text-xs">
            {formatCurrency(card.value)}
          </span>
        </div>

        {/* Nhân viên & ngày */}
        <div className="relative flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-[10px]">
                {getInitials(card.assignee)}
              </span>
            </div>
            <span className="truncate max-w-20">{card.assignee}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(card.lastActivity)}</span>
          </div>

          {/* Nút action chỉ đè lên phần này khi hover */}
          <div
            className="
              absolute inset-0 
              hidden group-hover:flex 
              items-center justify-center gap-2
              bg-white
              transition-opacity duration-200
              animate-fade-in
            "
          >
            <Button
              variant="actionRead"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onView(card);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="actionUpdate"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="actionDelete"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
