import React from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

// Bảng ánh xạ key tiếng Anh sang tiếng Việt - cập nhật để khớp với ProductForm
const LABELS = {
  name: "Tên sản phẩm",
  brand: "Thương hiệu", 
  currentPrice: "Giá hiện tại",
  originalPrice: "Giá gốc",
  discount: "Giảm giá",
  image: "Ảnh",
  productLink: "Link sản phẩm",
  shortDesc: "Mô tả ngắn",
  rating: "Đánh giá sao",
  reviewCount: "Số lượt đánh giá",
  soldPerMonth: "Mua/tháng",
  progress: "Tiến độ bán",
  giftOffer: "Ưu đãi/Quà tặng",
  source: "Nguồn",
  currentPriceExtra: "Giá hiện tại_extra",
  description: "Mô tả",
  specs: "Thông số",
  howToUse: "HDSD",
  ingredients: "Thành phần",
  fullReview: "Đánh giá",
  category: "Danh mục",
  status: "Trạng thái",
  stock: "Tồn kho"
}

const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  // Hàm chuyển đổi dữ liệu sang tiếng Việt để hiển thị
  const getVietnameseData = (product) => {
    const vietnameseProduct = {};
    
    // Mapping các field tiếng Anh sang tiếng Việt
    Object.entries(product).forEach(([key, value]) => {
      if (LABELS[key]) {
        vietnameseProduct[LABELS[key]] = value;
      } else {
        vietnameseProduct[key] = value;
      }
    });

    return vietnameseProduct;
  };

  const displayProduct = getVietnameseData(product);

  return (
    <div className="bg-white border-gray-200 overflow-hidden rounded-sm
                hover:scale-105 hover:shadow-md shadow-sm
                transition-all duration-150 animate-fade-in group">
      {/* Image */}
      <div className="relative cursor-pointer" onClick={() => onView(product)}>
        <img
          src={product.image || displayProduct["Ảnh"] || '/images/products/product_temp.png'}
          alt={product.name || displayProduct["Tên sản phẩm"]}
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
            {product.name || displayProduct["Tên sản phẩm"]}
          </h3>

          <span
            className={`ml-3 px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap ${
              (product.status || displayProduct["Trạng thái"] || '').includes('available')
                ? 'bg-cyan-100 text-brand'
                : 'bg-red-100 text-destructive'
            }`}
          >
            {displayProduct["Trạng thái"] || product.status || 'Đang bán'}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          Thương hiệu: {product.brand || displayProduct["Thương hiệu"]}<br />
          Mô tả: {product.shortDesc || displayProduct["Mô tả ngắn"] || product.description || displayProduct["Mô tả"]}
        </p>

        {/* Hiển thị các thuộc tính khác với nhãn tiếng Việt */}
        <div className="text-gray-600 text-xs space-y-1 mb-3">
          {Object.entries(displayProduct)
            .filter(([vietnameseKey]) =>
              ![
                'id',
                'Tên sản phẩm',
                'Thương hiệu',
                'Danh mục',
                'price',
                'Giá hiện tại',
                'Giá gốc',
                'Giảm giá',
                'Trạng thái',
                'Mô tả',
                'Mô tả ngắn',
                'Ảnh'
              ].includes(vietnameseKey)
            )
            .map(([vietnameseKey, val]) =>
              val && val !== 'null' && val !== 'undefined' && val !== '' ? (
                <div key={vietnameseKey} className="flex justify-between">
                  <span className="font-medium">
                    {vietnameseKey}:
                  </span>
                  <span className="truncate text-right max-w-[120px]" title={val}>
                    {val}
                  </span>
                </div>
              ) : null
            )}
        </div>

        <div className="relative mb-4 h-6">
          {/* Giá */}
          <span className="absolute right-0 top-0 text-lg font-bold text-gray-900 
                   transition-opacity duration-300 ease-in-out 
                   group-hover:opacity-0 
                   group-hover:pointer-events-none
                   ">
            {Number(product.currentPrice ?? displayProduct["Giá hiện tại"] ?? product.price ?? 0).toLocaleString('vi-VN')} VNĐ
          </span>

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
