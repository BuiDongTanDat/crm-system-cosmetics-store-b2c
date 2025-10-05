import React from 'react';
import { Target } from 'lucide-react';

const LeadsPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Khách hàng tiềm năng</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Quản lý Lead</h2>
        <p className="text-gray-600 mb-4">
          Theo dõi và quản lý các khách hàng tiềm năng từ nhiều nguồn khác nhau.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-cyan-50 p-4 rounded-lg">
            <h3 className="font-semibold text-cyan-900">Tổng Lead</h3>
            <p className="text-2xl font-bold text-cyan-700">456</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Lead mới</h3>
            <p className="text-2xl font-bold text-yellow-700">89</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Đang liên hệ</h3>
            <p className="text-2xl font-bold text-blue-700">234</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Chuyển đổi</h3>
            <p className="text-2xl font-bold text-green-700">133</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;