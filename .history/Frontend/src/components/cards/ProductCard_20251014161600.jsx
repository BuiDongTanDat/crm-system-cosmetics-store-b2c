import React from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/utils/helper'

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
          className="w-full h-20 object-cover"
          onError={(e) => {
            e.target.src = '/images/products/product_temp.png'
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-base truncate">
            {product.name}
          </h3>

          <span
            className={`ml-3 px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap ${(product.status || '').includes('available') ||
                (product.status || '').includes('Còn hàng')
                ? 'bg-cyan-100 text-brand'
                : 'bg-red-100 text-destructive'
              }`}
          >
            {product.status || 'Đang bán'}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          Thương hiệu: {product.brand}<br />
          Mô tả: {product.shortDesc || product.description}
        </p>

        <div className="relative mb-4 h-6">
          {/* Giá */}
          <div className="flex-col items-center justify-between mb-3">
            <span className="text-gray-400 line-through">
              {product.originalPrice
                ? formatCurrency(product.originalPrice)
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
          <div className="justify-center hidden gap-2 group-hover:flex animate-slide-up">
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
  )
}

export default ProductCard
