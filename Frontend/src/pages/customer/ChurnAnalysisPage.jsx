import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ChurnAnalysisPage = () => {
  return (
    <div className="p-0">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Phân tích Churn</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Customer Churn Analysis</h2>
        <p className="text-gray-600 mb-4">
          Phân tích tỷ lệ rời bỏ khách hàng và dự đoán khách hàng có khả năng churn để có biện pháp giữ chân kịp thời.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-900">Tỷ lệ Churn</h3>
            <p className="text-2xl font-bold text-red-700">12.5%</p>
            <span className="text-sm text-red-600">tháng này</span>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Khách hàng nguy cơ cao</h3>
            <p className="text-2xl font-bold text-yellow-700">87</p>
            <span className="text-sm text-yellow-600">khách hàng</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">Doanh thu ảnh hưởng</h3>
            <p className="text-2xl font-bold text-orange-700">340M VNĐ</p>
            <span className="text-sm text-orange-600">có thể mất</span>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Khách hàng giữ lại</h3>
            <p className="text-2xl font-bold text-green-700">76%</p>
            <span className="text-sm text-green-600">thành công</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurnAnalysisPage;