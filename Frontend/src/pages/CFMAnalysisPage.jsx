import React from 'react';
import { BarChart3 } from 'lucide-react';

const CFMAnalysisPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Phân tích CFM</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Customer Frequency Monetary Analysis</h2>
        <p className="text-gray-600 mb-4">
          Phân tích tần suất và giá trị mua hàng của khách hàng để đưa ra chiến lược marketing phù hợp.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-900">Tần suất mua hàng</h3>
            <p className="text-2xl font-bold text-indigo-700">4.2</p>
            <span className="text-sm text-indigo-600">lần/tháng trung bình</span>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Giá trị trung bình</h3>
            <p className="text-2xl font-bold text-green-700">2.5M VNĐ</p>
            <span className="text-sm text-green-600">đơn hàng trung bình</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Customer Score</h3>
            <p className="text-2xl font-bold text-purple-700">7.8/10</p>
            <span className="text-sm text-purple-600">điểm CFM trung bình</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CFMAnalysisPage;