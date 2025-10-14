import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white border-gray-200 overflow-hidden rounded-sm
                hover:scale-105 hover:shadow-md shadow-sm
                transition-all duration-150 animate-fade-in group">
      
      {/* Image */}
      <div className="relative cursor-pointer" onClick={() => onView(product)}>
        <img
          src={product.image || '/images/products/product_temp.png'}
          alt={product.name}
          className="w-full h-30 object-cover"
          onError={(e) => { e.target.src = '/images/products/product_temp.png'; }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tên + status */}
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-900 text-base truncate">{product.name}</p>
          <span
            className={`ml-3 px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap ${
              (product.status || '').includes('available') || (product.status || '').includes('Còn hàng')
                ? 'bg-cyan-100 text-brand'
                : 'bg-red-100 text-destructive'
            }`}
          >
            {product.status || 'Đang bán'}
          </span>
        </div>

        {/* Thương hiệu + mô tả */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          Thương hiệu: {product.brand}<br />
          Mô tả: {product.shortDescription || '-'}
        </p>

        {/* Giá + sao */}
        <div className="relative mb-4 h-6">
          <div className="flex items-center justify-between">
            {/* Giá cũ */}
            <span className="text-gray-400 line-through">
              {product.originalPrice
                ? Number(product.originalPrice).toLocaleString('vi-VN') + ' VNĐ'
                : '-'}
            </span>

            {/* Giá hiện tại + sao */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {product.currentPrice
                  ? Number(product.currentPrice).toLocaleString('vi-VN') + ' VNĐ'
                  : '-'}
              </span>
              <span className="text-yellow-500 font-medium">⭐ {product.rating || 0}</span>
            </div>
          </div>

          {/* Action buttons hover */}
          <div className="absolute inset-0 flex justify-center items-center gap-2 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
            <Button variant="actionRead" size="icon" onClick={() => onView(product)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="actionUpdate" size="icon" onClick={() => onEdit(product)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="actionDelete" size="icon" onClick={() => onDelete(product.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
