import React from 'react';
import { ShoppingCart } from 'lucide-react';

const ShoppingActivityPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Hành vi mua hàng</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Phân tích hành vi mua hàng</h2>
        <p className="text-gray-600 mb-4">
          Theo dõi và phân tích hành vi mua hàng của khách hàng để tối ưu hóa trải nghiệm.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-900">Lượt truy cập</h3>
            <p className="text-2xl font-bold text-indigo-700">12,456</p>
            <span className="text-sm text-indigo-600">tháng này</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h3 className="font-semibold text-emerald-900">Tỷ lệ chuyển đổi</h3>
            <p className="text-2xl font-bold text-emerald-700">3.2%</p>
            <span className="text-sm text-emerald-600">từ lượt xem</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">Giỏ hàng bỏ dở</h3>
            <p className="text-2xl font-bold text-orange-700">24.7%</p>
            <span className="text-sm text-orange-600">tỷ lệ abandon</span>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold text-pink-900">Thời gian TB</h3>
            <p className="text-2xl font-bold text-pink-700">7.5 phút</p>
            <span className="text-sm text-pink-600">trên trang</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingActivityPage;