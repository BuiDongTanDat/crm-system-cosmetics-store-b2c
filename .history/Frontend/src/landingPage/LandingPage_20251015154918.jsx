import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const images = [
    '/images/landing/Truyen_thong.png',
    '/images/landing/Truyen_thong.png',
    '/images/landing/Truyen_thong.png',
    '/images/landing/Truyen_thong.png'
  ];

  return (
    <div className="landing-page">
      {/* Background */}
      <div
        className="background-overlay"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />

      {/* Header */}
      <div className="header">
        <h1>SẢN PHẨM</h1>
        <p className="subtitle">PRODUCT MANAGEMENT</p>
      </div>

      {/* 4 Ảnh hiển thị */}
      <div className="image-grid">
        {images.map((img, index) => (
          <div key={index} className="image-card">
            <img src={img} alt={`Ảnh ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
