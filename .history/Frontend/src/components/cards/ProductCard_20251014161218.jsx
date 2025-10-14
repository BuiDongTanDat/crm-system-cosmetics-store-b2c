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
          className="w-full h-28 object-cover"
          onError={(e) => { e.target.src = '/images/products/product_temp.png'; }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tên và Thương hiệu */}
        <h3 className="font-semibold text-gray-900 text-base truncate mb-1">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2">Thương hiệu: {product.brand}</p>

        {/* Mô tả ngắn */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {product.shortDescription || product.description || '-'}
        </p>

        {/* Giá */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 line-through">
            {product.originalPrice
              ? Number(product.originalPrice).toLocaleString('vi-VN') + ' VNĐ'
              : '-'}
          </span>
          <span className="text-lg font-bold text-gray-900">
            {product.currentPrice
              ? Number(product.currentPrice).toLocaleString('vi-VN') + ' VNĐ'
              : '-'}
          </span>
        </div>

        {/* Đánh giá sao */}
        <p className="text-yellow-500 font-medium mb-3">
          ⭐ {product.rating || 0}
        </p>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
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
  );
};

export default ProductCard;
