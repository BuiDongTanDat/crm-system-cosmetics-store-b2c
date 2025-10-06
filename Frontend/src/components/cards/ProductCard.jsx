import React from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white border-gray-200 overflow-hidden rounded-sm rounded-tl-[50px] rounded-tr-[0px]
                hover:scale-105 hover:shadow-md shadow-sm
                transition-all duration-150 animate-fade-in group">
      {/* Image */}
      <div className="relative cursor-pointer" onClick={() => onView(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial, sans-serif' font-size='16'%3EMajun Pandora%3C/text%3E%3C/svg%3E`
          }}
        />


      </div>

      {/* Content */}
      <div className="p-4">
        <div className='flex justify-between mb-2'>
          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
          {/* Status badge */}
          <div >
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === 'Phân phối'
              ? 'bg-cyan-100 text-cyan-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {product.status}
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          Phân loại: {product.category}<br />
          Mô tả: {product.description}
        </p>


        <div className="relative mb-4 h-6">
          {/* Giá */}
          <span className="absolute right-0 top-0 text-lg font-bold text-gray-900 
                   transition-opacity duration-300 ease-in-out 
                   group-hover:opacity-0 
                   group-hover:pointer-events-none
                   ">
            {product.price.toLocaleString('vi-VN')} VNĐ
          </span>

          {/* Action buttons */}
          <div className=" justify-center hidden gap-2 group-hover:flex animate-slide-up">
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
