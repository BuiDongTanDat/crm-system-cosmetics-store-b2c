import React, { useState } from 'react';
import './LandingPage.css';
import { Star } from 'lucide-react';

const LandingPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const products = [
    { id: 1, name: 'Phấn Mắt Ánh Kim', price: '299,000đ', image: '/images/products/product_temp.png' },
    { id: 2, name: 'Son Môi Lì', price: '199,000đ', image: '/images/products/product_temp.png' },
    { id: 3, name: 'Kem Nền Cao Cấp', price: '450,000đ', image: '/images/products/product_temp.png' },
    { id: 4, name: 'Mascara Chống Thấm', price: '350,000đ', image: '/images/products/product_temp.png' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data:', formData);
    alert('Cảm ơn bạn đã để lại thông tin!');
    setShowForm(false);
    setFormData({ name: '', email: '', phone: '', notes: '' });
  };

  return (
    <div className="landing-page">
      {/* Background Image */}
      <div
        className="background-overlay"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />
      
      <div className="header">
        <h1>Cửa Hàng Của Chúng Tôi</h1>
        <p>Khám phá những sản phẩm tuyệt vời</p>
      </div>

      <div className="main-content">
        {/* Form Section - Left */}
        <div className="form-section">
          <h3>Thông Tin Liên Hệ</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Họ và tên *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Ghi chú</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <button type="submit" className="submit-button">
              Gửi Thông Tin
            </button>
          </form>
        </div>

        {/* Products Section - Right */}
        <div className="products-section">
          <h2>Sản Phẩm Nổi Bật</h2>
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <div className="product-card-content">
                  <div className="flex items-center justify-between mb-2">
                    <h3>{product.name}</h3>
                    <span className="product-status">Đang bán</span>
                  </div>
                  
                  <p className="product-description">
                    Thương hiệu: Premium Brand<br />
                    Mô tả: Sản phẩm chất lượng cao, được nhiều khách hàng tin dùng
                  </p>

                  <div className="product-footer">
                    <div className="product-info">
                      <span className="product-rating">
                        <Star/> 4.5
                      </span>
                      <div className="product-pricing">
                        <div className="product-current-price">
                          {product.price}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
