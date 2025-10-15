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
    { id: 1, name: 'Phấn Mắt Ánh Kim', currentPrice: 299000, brand: 'Premium Brand', rating: 4.5, image: '/images/products/product_temp.png' },
    { id: 2, name: 'Son Môi Lì', currentPrice: 199000, brand: 'Premium Brand', rating: 4.3, image: '/images/products/product_temp.png' },
    { id: 3, name: 'Kem Nền Cao Cấp', currentPrice: 450000, brand: 'Premium Brand', rating: 4.7, image: '/images/products/product_temp.png' },
    { id: 4, name: 'Mascara Chống Thấm', currentPrice: 350000, brand: 'Premium Brand', rating: 4.6, image: '/images/products/product_temp.png' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

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
        <h1>SẢN PHẨM</h1>
        <p className="subtitle">PRODUCT MANAGEMENT</p>
      </div>

      <div className="main-content">
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <img src={product.image} alt={product.name} />
              </div>
              
              <div className="product-card-content">
                <div className="product-header">
                  <h3 className="product-name">{product.name}</h3>
                  <span className="product-status">Đang bán</span>
                </div>
                
                <p className="product-description">
                  Thương hiệu: {product.brand}<br />
                  Mô tả: Sản phẩm chất lượng cao, được nhiều khách hàng tin dùng
                </p>

                <div className="product-footer">
                  <div className="product-info">
                    <span className="product-rating">
                      <Star className="star-icon" fill="currentColor" /> {product.rating}
                    </span>
                    <div className="product-pricing">
                      <div className="product-current-price">
                        {formatCurrency(product.currentPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Button */}
        <div className="contact-section">
          <button 
            className="contact-button"
            onClick={() => setShowForm(true)}
          >
            LIÊN HỆ VỚI CHÚNG TÔI
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <button 
              className="close-button"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
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
        </div>
      )}
    </div>
  );
};

export default LandingPage;
