import React, { useState } from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    interest: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call API to save lead
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitMessage('Cảm ơn bạn đã để lại thông tin! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          company: '',
          message: '',
          interest: ''
        });
      } else {
        setSubmitMessage('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } catch (error) {
      setSubmitMessage('Có lỗi xảy ra. Vui lòng thử lại sau.');
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Giải Pháp Công Nghệ Hàng Đầu Cho Doanh Nghiệp
          </h1>
          <p className="hero-subtitle">
            Chúng tôi cung cấp các giải pháp công nghệ tiên tiến giúp doanh nghiệp của bạn 
            tăng trưởng mạnh mẽ và tối ưu hóa quy trình kinh doanh.
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <i className="icon-check"></i>
              <span>Tăng hiệu quả làm việc lên 300%</span>
            </div>
            <div className="feature-item">
              <i className="icon-check"></i>
              <span>Giảm chi phí vận hành 40%</span>
            </div>
            <div className="feature-item">
              <i className="icon-check"></i>
              <span>Hỗ trợ 24/7 chuyên nghiệp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2>Nhận Tư Vấn Miễn Phí Ngay Hôm Nay</h2>
            <p>Để lại thông tin để nhận được tư vấn chi tiết từ chuyên gia của chúng tôi</p>
          </div>

          <form className="lead-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập địa chỉ email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="form-group">
                <label htmlFor="company">Công ty</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Tên công ty của bạn"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="interest">Lĩnh vực quan tâm *</label>
              <select
                id="interest"
                name="interest"
                value={formData.interest}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn lĩnh vực quan tâm</option>
                <option value="web-development">Phát triển Website</option>
                <option value="mobile-app">Ứng dụng Mobile</option>
                <option value="erp-system">Hệ thống ERP</option>
                <option value="crm-system">Hệ thống CRM</option>
                <option value="ecommerce">Thương mại điện tử</option>
                <option value="digital-transformation">Chuyển đổi số</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Tin nhắn</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="4"
                placeholder="Mô tả chi tiết nhu cầu của bạn..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Nhận Tư Vấn Miễn Phí'}
            </button>

            {submitMessage && (
              <div className={`submit-message ${submitMessage.includes('Cảm ơn') ? 'success' : 'error'}`}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <h2>Tại Sao Chọn Chúng Tôi?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">⚡</div>
              <h3>Triển Khai Nhanh Chóng</h3>
              <p>Cam kết triển khai dự án trong thời gian ngắn nhất với chất lượng cao</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🔧</div>
              <h3>Tùy Chỉnh Linh Hoạt</h3>
              <p>Giải pháp được thiết kế riêng phù hợp với nhu cầu cụ thể của từng doanh nghiệp</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">💎</div>
              <h3>Chất Lượng Cao</h3>
              <p>Sử dụng công nghệ hiện đại và quy trình phát triển chuẩn quốc tế</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🛡️</div>
              <h3>Bảo Mật Tuyệt Đối</h3>
              <p>Đảm bảo an toàn dữ liệu với các biện pháp bảo mật tiên tiến nhất</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
