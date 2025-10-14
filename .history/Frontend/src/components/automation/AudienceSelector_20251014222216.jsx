import React, { useState } from 'react';
import { Users, Filter, Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AudienceSelector({ selectedAudience, selectedSegment, onAudienceChange, onSegmentChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const audiences = [
    { id: 'all_customers', name: 'Tất cả khách hàng', count: 10500, description: 'Toàn bộ danh sách khách hàng' },
    { id: 'new_customers', name: 'Khách hàng mới', count: 1250, description: 'Đăng ký trong 30 ngày qua' },
    { id: 'existing_customers', name: 'Khách hàng hiện tại', count: 8900, description: 'Đã mua hàng ít nhất 1 lần' },
    { id: 'vip_customers', name: 'Khách hàng VIP', count: 350, description: 'Khách hàng có giá trị cao' },
    { id: 'inactive_customers', name: 'Khách hàng không hoạt động', count: 2100, description: 'Không hoạt động 90 ngày qua' }
  ];

  const segments = [
    { id: 'age_18_25', name: 'Tuổi 18-25', count: 2100 },
    { id: 'age_26_35', name: 'Tuổi 26-35', count: 3200 },
    { id: 'age_36_45', name: 'Tuổi 36-45', count: 2800 },
    { id: 'age_above_45', name: 'Trên 45 tuổi', count: 2400 },
    { id: 'location_hanoi', name: 'Hà Nội', count: 4200 },
    { id: 'location_hcm', name: 'TP.HCM', count: 3800 },
    { id: 'location_others', name: 'Tỉnh thành khác', count: 2500 },
    { id: 'purchase_high', name: 'Mua hàng cao', count: 850 },
    { id: 'purchase_medium', name: 'Mua hàng trung bình', count: 4200 },
    { id: 'purchase_low', name: 'Mua hàng thấp', count: 5450 }
  ];

  const tags = [
    { id: 'newsletter_subscriber', name: 'Đăng ký newsletter', count: 6700 },
    { id: 'mobile_app_user', name: 'Dùng mobile app', count: 3200 },
    { id: 'social_media_follower', name: 'Theo dõi social media', count: 4500 },
    { id: 'loyalty_member', name: 'Thành viên loyalty', count: 2800 },
    { id: 'cart_abandoner', name: 'Bỏ giỏ hàng', count: 1200 }
  ];

  const conditions = [
    { id: 'age', name: 'Tuổi' },
    { id: 'location', name: 'Địa điểm' },
    { id: 'order_value', name: 'Giá trị đơn hàng' },
    { id: 'last_purchase', name: 'Lần mua cuối' }
  ];

  const operators = [
    { id: 'equals', name: 'Bằng' },
    { id: 'greater', name: 'Lớn hơn' },
    { id: 'less', name: 'Nhỏ hơn' },
    { id: 'contains', name: 'Chứa' }
  ];

  return (
    <div className="space-y-6">
      {/* Main Audience Selection */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Chọn đối tượng chính
        </h3>
        
        <div className="grid gap-3">
          {audiences.map(audience => (
            <div
              key={audience.id}
              className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                selectedAudience === audience.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onClick={() => onAudienceChange(audience.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedAudience === audience.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {selectedAudience === audience.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{audience.name}</h4>
                      <p className="text-sm text-gray-600">{audience.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-blue-600">{audience.count.toLocaleString()}</span>
                  <p className="text-xs text-gray-500">người</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Filtering */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Lọc nâng cao
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Ẩn' : 'Hiện'} bộ lọc
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
            {/* Segments */}
            <div>
              <h4 className="font-medium mb-3">Phân khúc khách hàng</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {segments.map(segment => (
                  <label key={segment.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedSegment === segment.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {selectedSegment === segment.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="radio"
                      name="segment"
                      value={segment.id}
                      checked={selectedSegment === segment.id}
                      onChange={(e) => onSegmentChange(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{segment.name}</div>
                      <div className="text-xs text-gray-500">{segment.count.toLocaleString()} người</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium mb-3">Thẻ đặc biệt</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                    <div className="w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center bg-white">
                      <Check className="w-3 h-3 text-transparent" />
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{tag.name}</div>
                      <div className="text-xs text-gray-500">{tag.count.toLocaleString()} người</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Filter */}
            <div>
              <h4 className="font-medium mb-3">Điều kiện tùy chỉnh</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                        <span className="text-sm">Tuổi</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      {conditions.map((condition) => (
                        <DropdownMenuItem key={condition.id}>
                          {condition.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                        <span className="text-sm">Bằng</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      {operators.map((operator) => (
                        <DropdownMenuItem key={operator.id}>
                          {operator.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <input 
                    type="text" 
                    placeholder="Giá trị"
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  + Thêm điều kiện
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Tổng quan đối tượng</h4>
        <div className="text-sm text-blue-800">
          <p><strong>Đối tượng chính:</strong> {audiences.find(a => a.id === selectedAudience)?.name || 'Chưa chọn'}</p>
          {selectedSegment && (
            <p><strong>Phân khúc:</strong> {segments.find(s => s.id === selectedSegment)?.name}</p>
          )}
          <p><strong>Ước tính số người nhận:</strong> {audiences.find(a => a.id === selectedAudience)?.count.toLocaleString() || 0} người</p>
        </div>
      </div>
    </div>
  );
}
