import React from 'react';
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  const {
    'Ảnh': image,
    'Tên sản phẩm': name,
    'Thương hiệu': brand,
    'Giá hiện tại': price,
    'Giá gốc': origPrice,
    'Giảm giá': discount,
    'Rating': rating,
    'Đánh giá': reviews,
    'Mua/tháng': monthly,
    'Link sản phẩm': link,
    'Mô tả ngắn': shortDesc,
  } = product;

  return (
    <div className="bg-white border-gray-200 overflow-hidden rounded-sm
                hover:scale-105 hover:shadow-md shadow-sm
                transition-all duration-150 animate-fade-in group"
                style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fff' }}>
      <div className="relative cursor-pointer" onClick={() => onView(product)} style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 80, height: 80, flexShrink: 0 }}>
          {image ? (
            <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#f5f5f5', borderRadius: 6 }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name || '—'}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{brand}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 700, color: '#d32f2f' }}>{price || '—'}</span>
            {origPrice ? <span style={{ marginLeft: 8, textDecoration: 'line-through', color: '#888' }}>{origPrice}</span> : null}
            {discount ? <span style={{ marginLeft: 8, color: '#388e3c' }}>{discount}</span> : null}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>
            {rating ? <span>⭐ {rating}</span> : null}
            {reviews ? <span style={{ marginLeft: 8 }}>{reviews}</span> : null}
            {monthly ? <span style={{ marginLeft: 8 }}>• {monthly} /tháng</span> : null}
          </div>
          {shortDesc ? <div style={{ marginTop: 8, color: '#555', fontSize: 12 }}>{shortDesc.slice(0, 120)}{shortDesc.length > 120 ? '…' : ''}</div> : null}
  {/* Render các feature bổ sung từ CSV */}
+          <div style={{ marginTop: 8 }}>
+            {Object.entries(product)
+              .filter(([key]) =>
+                ![
+                  'Ảnh',
+                  'Tên sản phẩm',
+                  'Thương hiệu',
+                  'Giá hiện tại',
+                  'Giá gốc',
+                  'Giảm giá',
+                  'Rating',
+                  'Đánh giá',
+                  'Mua/tháng',
+                  'Link sản phẩm',
+                  'Mô tả ngắn',
+                  'id'
+                ].includes(key)
+              )
+              .map(([key, val]) => (
+                val ? (
+                  <div key={key} style={{ fontSize: 11, color: '#666' }}>
+                    <strong>{key}:</strong> {val}
+                  </div>
+                ) : null
+              ))}
+          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <div>
          {link ? (
            <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
              Xem sản phẩm
            </a>
          ) : null}
        </div>
        <div>
          <button onClick={onEdit} style={{ padding: '6px 10px', cursor: 'pointer' }}>
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
export default ProductCard
