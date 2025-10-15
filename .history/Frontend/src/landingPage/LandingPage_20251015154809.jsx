import React, { useState } from 'react';
import './LandingPage.css';
import { Star } from 'lucide-react';

const LandingPage = () => {
  // Giữ lại state và hàm xử lý form (mặc dù form được ẩn, nhưng giữ lại cho tính năng liên hệ nếu cần sau này)
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Cập nhật mảng services: chỉ cần 4 đối tượng với cùng một đường dẫn hình ảnh
  const services = [
    { 
      id: 1, 
      image: '/images/landing/Truyen_thong.png',
    },
    { 
      id: 2, 
      image: '/images/landing/Truyen_thong.png',
    },
    { 
      id: 3, 
      image: '/images/landing/Truyen_thong.png',
    },
    { 
      id: 4, 
      image: '/images/landing/Truyen_thong.png',
    }
  ];

  // Giữ lại các hàm xử lý form
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
      
      {/* Loại bỏ phần header */}
      
      <div className="main-content">
        <div className="services-grid">
          {services.map(service => (
            // Chỉ hiển thị service-card và image
            <div key={service.id} ">
              <div>
                <img src={service.image} alt={`Service ${service.id}`} />
              </div>
              {/* Đã loại bỏ service-card-content, title, subtitle, và buttons */}
            </div>
          ))}
        </div>

        {/* Giữ lại Contact Button (chưa được yêu cầu loại bỏ) */}
        <div className="contact-section">
          <button 
            className="contact-button"
            onClick={() => setShowForm(true)}
          >
            LIÊN HỆ VỚI CHÚNG TÔI
          </button>
        </div>
      </div>

      {/* Form Modal (Giữ nguyên) */}
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