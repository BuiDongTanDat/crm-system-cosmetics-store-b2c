import React, { useState } from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    skinType: '',
    concerns: '',
    ageRange: '',
    message: ''
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
          skinType: '',
          concerns: '',
          ageRange: '',
          message: ''
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
            Mỹ Phẩm Cao Cấp - Làm Đẹp Tự Nhiên
          </h1>
          <p className="hero-subtitle">
            Khám phá bộ sưu tập mỹ phẩm thiên nhiên cao cấp với công thức độc quyền, 
            giúp bạn tỏa sáng với vẻ đẹp tự nhiên và rạng rỡ nhất.
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <i className="icon-check"></i>
              <span>100% thành phần tự nhiên</span>
            </div>
            <div className="feature-item">
              <i className="icon-check"></i>
              <span>Được kiểm nghiệm da liễu</span>
            </div>
            <div className="feature-item">
              <i className="icon-check"></i>
              <span>Hiệu quả sau 7 ngày sử dụng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2>Nhận Tư Vấn Chăm Sóc Da Miễn Phí</h2>
            <p>Để lại thông tin để nhận được tư vấn chăm sóc da phù hợp với làn da của bạn</p>
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
                <label htmlFor="ageRange">Độ tuổi</label>
                <select
                  id="ageRange"
                  name="ageRange"
                  value={formData.ageRange}
                  onChange={handleInputChange}
                >
                  <option value="">Chọn độ tuổi</option>
                  <option value="18-25">18-25 tuổi</option>
                  <option value="26-35">26-35 tuổi</option>
                  <option value="36-45">36-45 tuổi</option>
                  <option value="46-55">46-55 tuổi</option>
                  <option value="55+">Trên 55 tuổi</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="skinType">Loại da *</label>
              <select
                id="skinType"
                name="skinType"
                value={formData.skinType}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn loại da của bạn</option>
                <option value="normal">Da bình thường</option>
                <option value="dry">Da khô</option>
                <option value="oily">Da dầu</option>
                <option value="combination">Da hỗn hợp</option>
                <option value="sensitive">Da nhạy cảm</option>
                <option value="acne-prone">Da mụn</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="concerns">Vấn đề da quan tâm *</label>
              <select
                id="concerns"
                name="concerns"
                value={formData.concerns}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn vấn đề bạn muốn cải thiện</option>
                <option value="acne">Mụn và vết thâm</option>
                <option value="aging">Chống lão hóa</option>
                <option value="whitening">Làm trắng da</option>
                <option value="moisturizing">Cấp ẩm</option>
                <option value="sun-protection">Chống nắng</option>
                <option value="dark-spots">Nám và tàn nhang</option>
                <option value="pore-care">Chăm sóc lỗ chân lông</option>
                <option value="overall-care">Chăm sóc tổng thể</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Ghi chú thêm</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="4"
                placeholder="Chia sẻ thêm về tình trạng da hiện tại hoặc sản phẩm bạn đang quan tâm..."
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
          <h2>Tại Sao Chọn Mỹ Phẩm Của Chúng Tôi?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">🌿</div>
              <h3>Thành Phần Tự Nhiên</h3>
              <p>Chiết xuất từ các thảo dược thiên nhiên quý hiếm, an toàn cho mọi loại da</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🧪</div>
              <h3>Công Nghệ Tiên Tiến</h3>
              <p>Ứng dụng công nghệ nano hiện đại giúp thấm sâu và hiệu quả tối ưu</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✨</div>
              <h3>Hiệu Quả Nhanh Chóng</h3>
              <p>Cải thiện tình trạng da rõ rệt chỉ sau 7-14 ngày sử dụng đều đặn</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🏆</div>
              <h3>Chứng Nhận Quốc Tế</h3>
              <p>Được kiểm nghiệm da liễu và có chứng nhận từ các tổ chức uy tín thế giới</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
