import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Target,
  MessageCircle,
  Star,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SimpleBarChart from '@/pages/report/charts/SimpleBarChart';
import SimpleLineChart from '@/pages/report/charts/SimpleLineChart';
import MetricCard from '@/pages/report/charts/MetricCard';
import { reportData } from '@/lib/data';

export default function ReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
        <div className="flex gap-3">
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('week')}
          >
            Tuần
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
          >
            Tháng
          </Button>
          <Button
            variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('quarter')}
          >
            Quý
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="CSAT Score"
          value={reportData.csatData.currentScore}
          suffix="/5"
          trend={reportData.csatData.trend}
          icon={Star}
          color="yellow"
        />
        <MetricCard
          title="NPS Score"
          value={reportData.npsData.score}
          trend={reportData.npsData.trend}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Tỷ lệ rời bỏ"
          value={reportData.churnData.rate}
          suffix="%"
          trend={reportData.churnData.trend}
          icon={UserX}
          color="red"
        />
        <MetricCard
          title="Thời gian phản hồi"
          value={reportData.customerInteraction.quality.responseTime}
          icon={MessageCircle}
          color="blue"
        />
      </div>

      {/* Sales Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={reportData.salesByEmployee}
          title="Doanh số theo Nhân viên"
          dataKey="sales"
          nameKey="name"
          color="#3B82F6"
        />
        <SimpleBarChart
          data={reportData.salesByProduct}
          title="Doanh số theo Sản phẩm"
          dataKey="sales"
          nameKey="name"
          color="#10B981"
        />
      </div>

      {/* Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart
          data={reportData.salesByTime}
          title="Xu hướng Doanh số theo Thời gian"
          dataKey="sales"
          nameKey="month"
        />
        <SimpleLineChart
          data={reportData.churnData.prediction}
          title="Dự đoán Tỷ lệ Rời bỏ"
          dataKey="predicted"
          nameKey="month"
        />
      </div>

      {/* Customer Satisfaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Chi tiết CSAT theo Danh mục</h3>
          <div className="space-y-4">
            {reportData.csatData.breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.category}</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= item.score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{item.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Phân bố NPS</h3>
          <div className="space-y-4">
            {reportData.npsData.segments.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{segment.type}</span>
                  <span className="text-sm text-gray-600">{segment.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      segment.type === 'Promoters' ? 'bg-green-500' :
                      segment.type === 'Passives' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${segment.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Hiệu quả Chiến dịch Marketing</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Chiến dịch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ROI (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Leads mới
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Doanh thu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Chi phí
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.campaignPerformance.map((campaign, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.roi >= 200 ? 'bg-green-100 text-green-800' :
                      campaign.roi >= 150 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaign.roi}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.leads.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(campaign.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(campaign.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Interaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={reportData.customerInteraction.frequency}
          title="Tương tác theo Kênh"
          dataKey="interactions"
          nameKey="channel"
          color="#8B5CF6"
        />
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Chất lượng Tương tác</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tỷ lệ giải quyết</span>
              <span className="text-lg font-semibold text-green-600">
                {reportData.customerInteraction.quality.resolutionRate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giải quyết lần đầu</span>
              <span className="text-lg font-semibold text-blue-600">
                {reportData.customerInteraction.quality.firstContactResolution}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Thời gian phản hồi TB</span>
              <span className="text-lg font-semibold text-orange-600">
                {reportData.customerInteraction.quality.responseTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
