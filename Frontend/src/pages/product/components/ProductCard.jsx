import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Star } from 'lucide-react'
import { formatCurrency } from '@/utils/helper'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'

const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="bg-white border-gray-200 overflow-hidden rounded-sm
                hover:scale-103 hover:shadow-md shadow-sm
                transition-all duration-150 animate-fade-in relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative cursor-pointer" onClick={() => onView(product)}>
        <img
          src={product.image || '/images/products/product_temp.png'}
          alt={product.name}
          className="w-full h-60 object-cover"
          onError={(e) => {
            e.target.src = '/images/products/product_temp.png'
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between ">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {product.name}
          </p>

          <span
            className={`ml-3 px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap ${((product.status || '').toString().toUpperCase() === 'AVAILABLE')
              ? 'bg-cyan-100 text-brand'
              : 'bg-red-100 text-destructive'
              }`}
          >
            {product.status?.toString().toUpperCase() === 'AVAILABLE'
              ? `Còn hàng (${product.inventory_qty || 0})`
              : product.status?.toString().toUpperCase() === 'OUT_OF_STOCK'
                ? 'Hết hàng'
                : 'Đã ngừng'}

          </span>
        </div>

        <p className="text-gray-600 text-[12px] mb-0 line-clamp-3">
          Thương hiệu: {product.brand}<br />
          Mô tả: {product.short_description}
        </p>

        <div className="relative mb-0 h-10">
          {/* Rating và Giá - hiển thị bình thường */}
          <div className={`flex justify-between items-end transition-opacity duration-150 ease-in-out ${hovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <span className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
              <Star className="w-4 h-4 -mt-[1px]" />
              {product.rating || 0}
            </span>


            {/* Giá bên phải */}
            <div className="text-right">
              {/* Giá cũ */}
              {product.price_original && product.price_original > 0 && (
                <div className="text-[13px] text-gray-400 line-through">
                  {formatCurrency(product.price_original)}
                </div>
              )}
              {/* Giá hiện tại */}
              <div className="text-sm font-bold text-gray-900">
                {formatCurrency(product.price_current)}
              </div>
            </div>
          </div>

          {/* Action buttons - only visible for this hovered card */}
          {hovered && (
            <div className="justify-center flex gap-2 animate-slide-up duration-200 absolute inset-0 items-center">
              <Button variant="actionRead" size="icon" onClick={() => onView(product)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="actionUpdate" size="icon" onClick={() => onEdit(product)}>
                <Edit className="w-4 h-4" />
              </Button>

              <ConfirmDialog
                title="Xác nhận xóa"
                description={<>
                  Bạn có chắc chắn muốn xóa sản phẩm <span className="font-semibold text-black">{product?.name}</span>?
                </>}
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete?.(product?.product_id || product?.id)}
              >
                <Button variant="actionDelete" size="icon" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ConfirmDialog>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
