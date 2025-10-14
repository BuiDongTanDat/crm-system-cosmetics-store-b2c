import React from 'react';
import { Calendar, Clock, Zap, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScheduleSelector({ schedule, onChange }) {
  const handleScheduleChange = (field, value) => {
    onChange({
      ...schedule,
      [field]: value
    });
  };

  const triggers = [
    { id: 'user_signup', name: 'Khi khách hàng đăng ký', description: 'Gửi email ngay khi có khách hàng mới đăng ký' },
    { id: 'cart_abandonment_1h', name: 'Bỏ giỏ hàng sau 1 giờ', description: 'Gửi email sau 1 giờ kể từ khi khách hàng bỏ giỏ hàng' },
    { id: 'cart_abandonment_24h', name: 'Bỏ giỏ hàng sau 24 giờ', description: 'Gửi email sau 24 giờ kể từ khi khách hàng bỏ giỏ hàng' },
    { id: 'purchase_completion', name: 'Sau khi mua hàng', description: 'Gửi email cảm ơn sau khi khách hàng hoàn tất đơn hàng' },
    { id: 'customer_birthday', name: 'Sinh nhật khách hàng', description: 'Gửi email chúc mừng sinh nhật' },
    { id: 'inactive_30_days', name: 'Không hoạt động 30 ngày', description: 'Gửi email tái kích hoạt' },
    { id: 'inactive_90_days', name: 'Không hoạt động 90 ngày', description: 'Gửi email win-back' }
  ];

  return (
    <div className="space-y-6">
      {/* Schedule Type Selection */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Chọn cách thức gửi</h3>
        
        <div className="grid gap-4">
          {/* Immediate */}
          <div
            className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              schedule.type === 'immediate' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handleScheduleChange('type', 'immediate')}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                schedule.type === 'immediate' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {schedule.type === 'immediate' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <Zap className="w-5 h-5 text-orange-500" />
              <div>
                <h4 className="font-medium">Gửi ngay lập tức</h4>
                <p className="text-sm text-gray-600">Email sẽ được gửi ngay sau khi hoàn tất thiết lập</p>
              </div>
            </div>
          </div>

          {/* Scheduled */}
          <div
            className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              schedule.type === 'scheduled' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handleScheduleChange('type', 'scheduled')}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                schedule.type === 'scheduled' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {schedule.type === 'scheduled' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-medium">Lên lịch gửi</h4>
                <p className="text-sm text-gray-600">Đặt thời gian cụ thể để gửi email</p>
              </div>
            </div>
          </div>

          {/* Trigger-based */}
          <div
            className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              schedule.type === 'trigger' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handleScheduleChange('type', 'trigger')}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                schedule.type === 'trigger' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {schedule.type === 'trigger' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <Repeat className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-medium">Dựa trên hành động</h4>
                <p className="text-sm text-gray-600">Tự động gửi khi khách hàng thực hiện hành động cụ thể</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Details */}
      {schedule.type === 'scheduled' && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Thiết lập thời gian
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngày gửi</label>
              <input
                type="date"
                value={schedule.date || ''}
                onChange={(e) => handleScheduleChange('date', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Giờ gửi</label>
              <input
                type="time"
                value={schedule.time || ''}
                onChange={(e) => handleScheduleChange('time', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Múi giờ</label>
            <select
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              defaultValue="Asia/Ho_Chi_Minh"
            >
              <option value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</option>
              <option value="Asia/Bangkok">GMT+7 (Bangkok)</option>
              <option value="Asia/Singapore">GMT+8 (Singapore)</option>
              <option value="Asia/Tokyo">GMT+9 (Tokyo)</option>
            </select>
          </div>
        </div>
      )}

      {schedule.type === 'trigger' && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Chọn trigger
          </h4>
          
          <div className="space-y-2">
            {triggers.map(trigger => (
              <div
                key={trigger.id}
                className={`p-3 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                  schedule.trigger === trigger.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
                onClick={() => handleScheduleChange('trigger', trigger.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    schedule.trigger === trigger.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`} />
                  <div>
                    <h5 className="font-medium text-sm">{trigger.name}</h5>
                    <p className="text-xs text-gray-600">{trigger.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Tóm tắt lịch gửi</h4>
        <div className="text-sm text-green-800">
          {schedule.type === 'immediate' && (
            <p>Email sẽ được <strong>gửi ngay lập tức</strong> sau khi hoàn tất thiết lập.</p>
          )}
          {schedule.type === 'scheduled' && (
            <p>
              Email sẽ được gửi vào <strong>{schedule.date}</strong> lúc <strong>{schedule.time}</strong> 
              {schedule.date && schedule.time && (
                <span> ({new Date(`${schedule.date}T${schedule.time}`).toLocaleString('vi-VN')})</span>
              )}
            </p>
          )}
          {schedule.type === 'trigger' && (
            <p>
              Email sẽ được gửi tự động khi: <strong>{triggers.find(t => t.id === schedule.trigger)?.name || 'Chưa chọn trigger'}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
