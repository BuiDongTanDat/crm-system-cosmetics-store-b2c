import React, { useState } from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const products = [
    { id: 1, name: 'Sản phẩm 1', price: '199,000đ', image: '/api/placeholder/200/200' },
    { id: 2, name: 'Sản phẩm 2', price: '299,000đ', image: '/api/placeholder/200/200' },
    { id: 3, name: 'Sản phẩm 3', price: '399,000đ', image: '/api/placeholder/200/200' },
    { id: 4, name: 'Sản phẩm 4', price: '499,000đ', image: '/api/placeholder/200/200' }
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
      <div className="header">
        <h1>Cửa Hàng Của Chúng Tôi</h1>
        <p>Khám phá những sản phẩm tuyệt vời</p>
      </div>

      <div className="products-section">
        <h2>Sản Phẩm Nổi Bật</h2>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p className="price">{product.price}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-section">
        <h2>Quan Tâm Đến Sản Phẩm?</h2>
        <p>Để lại thông tin để được tư vấn miễn phí</p>
        <button 
          className="cta-button"
          onClick={() => setShowForm(true)}
        >
          Đăng Ký Tư Vấn
        </button>
      </div>

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
