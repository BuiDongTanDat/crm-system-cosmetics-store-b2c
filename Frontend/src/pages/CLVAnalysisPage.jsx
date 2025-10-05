import React from 'react';
import { TrendingUp } from 'lucide-react';

const CLVAnalysisPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Phân tích CLV</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Customer Lifetime Value Analysis</h2>
        <p className="text-gray-600 mb-4">
          Phân tích giá trị suốt đời của khách hàng để tối ưu hóa chiến lược đầu tư và chăm sóc khách hàng.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h3 className="font-semibold text-emerald-900">CLV trung bình</h3>
            <p className="text-2xl font-bold text-emerald-700">15.2M VNĐ</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">CLV cao nhất</h3>
            <p className="text-2xl font-bold text-blue-700">45.6M VNĐ</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">Thời gian sống TB</h3>
            <p className="text-2xl font-bold text-orange-700">24 tháng</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold text-pink-900">ROI trung bình</h3>
            <p className="text-2xl font-bold text-pink-700">4.8x</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CLVAnalysisPage;