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

  const services = [
    { 
      id: 1, 
      title: 'TRUYỀN THÔNG', 
      subtitle: 'QUẢNG BÁ ĐA DẠNG HÌNH THỨC',
      image: '/images/landing/',
      buttons: ['Sản phẩm', 'Liên hệ']
    },
    { 
      id: 2, 
      title: 'THƯƠNG HIỆU', 
      subtitle: 'XÂY DỰNG HÌNH ẢNH VÀ UY TÍN RÕ RÀNG',
      image: '/images/services/thuong-hieu.jpg',
      buttons: ['Quảng bá', 'Liên hệ']
    },
    { 
      id: 3, 
      title: 'DỊCH VỤ', 
      subtitle: 'TẬN TỤY CHĂM SÓC KHÁCH HÀNG CHU ĐÁO',
      image: '/images/services/dich-vu.jpg',
      buttons: ['CRM', 'Hỗ trợ']
    },
    { 
      id: 4, 
      title: 'CHẤT LƯỢNG', 
      subtitle: 'SẢN PHẨM TỐT, AN TOÀN, HIỆU QUẢ',
      image: '/images/services/chat-luong.jpg',
      buttons: ['Sản phẩm', 'Liên hệ']
    }
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
        <div className="services-grid">
          {services.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-image-container">
                <img src={service.image} alt={service.title} />
              </div>
              
              <div className="service-card-content">
                <h2 className="service-title">{service.title}</h2>
                <p className="service-subtitle">{service.subtitle}</p>
                
                <div className="service-buttons">
                  {service.buttons.map((button, index) => (
                    <button key={index} className="service-button">
                      {button}
                    </button>
                  ))}
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
