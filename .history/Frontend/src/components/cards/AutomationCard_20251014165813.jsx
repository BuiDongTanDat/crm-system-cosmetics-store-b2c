import React from 'react';
import { Play, Pause, Edit, Trash2, Eye, Mail, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AutomationCard({ automation, onView, onEdit, onDelete, onStatusChange }) {
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-orange-100 text-orange-800 border-orange-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || colors.draft;
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'Đang chạy',
      paused: 'Tạm dừng',
      draft: 'Bản nháp',
      completed: 'Hoàn thành'
    };
    return texts[status] || 'Không xác định';
  };

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const calculateOpenRate = () => {
    if (!automation.stats.sent) return '0%';
    return `${((automation.stats.opened / automation.stats.sent) * 100).toFixed(1)}%`;
  };

  const calculateClickRate = () => {
    if (!automation.stats.opened) return '0%';
    return `${((automation.stats.clicked / automation.stats.opened) * 100).toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {automation.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(automation.status)}`}>
            {getStatusText(automation.status)}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            <span>{automation.type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{automation.targetAudience}</span>
          </div>
        </div>

        {automation.schedule && (
          <p className="text-sm text-gray-500">
            <strong>Lịch:</strong> {automation.schedule.type === 'immediate' ? 'Gửi ngay' : 
            automation.schedule.type === 'scheduled' ? `${automation.schedule.date} ${automation.schedule.time}` :
            `Tự động - ${automation.schedule.trigger}`}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{formatNumber(automation.stats.sent)}</p>
            <p className="text-xs text-gray-600">Đã gửi</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{calculateOpenRate()}</p>
            <p className="text-xs text-gray-600">Tỷ lệ mở</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="text-center">
            <p className="text-lg font-semibold text-purple-600">{formatNumber(automation.stats.clicked)}</p>
            <p className="text-xs text-gray-600">Đã click</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-orange-600">{calculateClickRate()}</p>
            <p className="text-xs text-gray-600">Tỷ lệ click</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onView(automation)}
              className="h-8 px-2"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(automation)}
              className="h-8 px-2"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(automation.id)}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-1">
            {automation.status === 'active' ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusChange(automation.id, 'paused')}
                className="h-8 px-3 text-orange-600 hover:bg-orange-50"
              >
                <Pause className="w-4 h-4 mr-1" />
                Dừng
              </Button>
            ) : automation.status === 'paused' ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusChange(automation.id, 'active')}
                className="h-8 px-3 text-green-600 hover:bg-green-50"
              >
                <Play className="w-4 h-4 mr-1" />
                Chạy
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusChange(automation.id, 'active')}
                className="h-8 px-3 text-blue-600 hover:bg-blue-50"
              >
                <Play className="w-4 h-4 mr-1" />
                Bắt đầu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
