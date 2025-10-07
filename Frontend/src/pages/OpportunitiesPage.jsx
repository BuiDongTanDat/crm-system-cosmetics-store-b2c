import React from 'react';
import { Handshake } from 'lucide-react';

const OpportunitiesPage = () => {
  return (
    <div className="p-0">
      <div className="flex items-center gap-3 mb-6">
        <Handshake className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Cơ hội bán hàng</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Quản lý Opportunities</h2>
        <p className="text-gray-600 mb-4">
          Theo dõi các cơ hội bán hàng tiềm năng và quy trình chuyển đổi.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Tổng cơ hội</h3>
            <p className="text-2xl font-bold text-purple-700">189</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Đang đàm phán</h3>
            <p className="text-2xl font-bold text-blue-700">67</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Giá trị dự kiến</h3>
            <p className="text-2xl font-bold text-yellow-700">1.2B VNĐ</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Tỷ lệ thành công</h3>
            <p className="text-2xl font-bold text-green-700">68%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesPage;