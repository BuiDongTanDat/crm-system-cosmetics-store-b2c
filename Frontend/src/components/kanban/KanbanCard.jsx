import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar, 
  Tag,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  formatCurrency, 
  formatDate, 
  getPriorityColor, 
  getPriorityLabel, 
  getInitials 
} from '@/utils/helper';

export default function KanbanCard({ card, onView, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', card.id);
      }}
    >
      {/* Header with priority and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(card.priority)}`}>
            {getPriorityLabel(card.priority)}
          </span>
          <span className="text-xs text-gray-500">{card.source}</span>
        </div>
        
        {isHovered && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(card);
              }}
              className="h-6 w-6 p-0"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Deal title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {card.title}
      </h3>

      {/* Customer info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{card.customer}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{card.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span className="truncate">{card.email}</span>
        </div>
      </div>

      {/* Deal value */}
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-semibold text-green-600">
          {formatCurrency(card.value)}
        </span>
      </div>

      {/* Products */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <Tag className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">Sản phẩm:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {card.products.slice(0, 2).map((product, index) => (
            <span 
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {product}
            </span>
          ))}
          {card.products.length > 2 && (
            <span className="text-xs text-gray-500">
              +{card.products.length - 2} khác
            </span>
          )}
        </div>
      </div>

      {/* Assignee and date */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-xs">
              {getInitials(card.assignee)}
            </span>
          </div>
          <span>{card.assignee}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(card.lastActivity)}</span>
        </div>
      </div>

      {/* Notes preview */}
      {card.notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2">
            {card.notes}
          </p>
        </div>
      )}
    </div>
  );
}

