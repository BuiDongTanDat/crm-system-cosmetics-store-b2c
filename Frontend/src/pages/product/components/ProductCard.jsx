import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Star } from 'lucide-react'
import { formatCurrency } from '@/utils/helper'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import PermissionGuard from '@/components/auth/PermissionGuard'

const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  return (
    <div
      className="bg-white border-gray-200 overflow-hidden rounded-sm
                hover:scale-103 hover:shadow-md shadow-sm
                transition-all duration-150 animate-fade-in relative"
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
      <div className="p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {product.name}
          </p>

          <span
            className={`ml-3 px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap ${((product.status || '').toString().toUpperCase() === 'AVAILABLE')
              ? 'bg-green-100 text-green-800'
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

        <p className="text-gray-600 text-[12px] mb-3 line-clamp-3 min-h-[3rem]">
          Thương hiệu: {product.brand}<br />
          Mô tả: {product.short_description}
        </p>

        {/* Rating và Giá */}
        <div className="flex justify-between items-end mb-3">
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

        {/* Action Buttons - luôn hiển thị ở dưới */}
        <div className="flex justify-center gap-2 mt-auto pt-2 border-t">
          <PermissionGuard module="product" action="read">
            <Button variant="actionRead" size="sm" onClick={() => onView(product)} className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Xem
            </Button>
          </PermissionGuard>
          <PermissionGuard module="product" action="update">
            <Button variant="actionUpdate" size="sm" onClick={() => onEdit(product)} className="flex-1">
              <Edit className="w-4 h-4 mr-1" />
              Sửa
            </Button>
          </PermissionGuard>
          <PermissionGuard module="product" action="delete">
            <ConfirmDialog
              title="Xác nhận xóa"
              description={<>Bạn có chắc chắn muốn xóa sản phẩm <span className="font-semibold text-black">{product?.name}</span>?</>}
              confirmText="Xóa"
              cancelText="Hủy"
              onConfirm={() => onDelete?.(product?.product_id || product?.id)}
            >
              <Button variant="actionDelete" size="icon">
                <Trash2 className="w-4 h-4" />
              </Button>
            </ConfirmDialog>
          </PermissionGuard>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
