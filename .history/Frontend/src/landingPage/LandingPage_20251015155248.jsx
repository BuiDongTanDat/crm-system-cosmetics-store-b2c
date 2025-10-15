import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const images = [
    '/images/landing/Chat_luong.png',
    '/images/landing/Thuong_hieu.png',
    '/images/landing/Truyen_thong.png',
    '/images/landing/Truyen_thong.png'
  ];

  return (
    <div className="landing-page">
      <div className="image-row">
        {images.map((img, index) => (
          <div 
            key={index} 
            className={`image-card ${index % 2 === 1 ? 'lower' : ''}`}
          >
            <img src={img} alt={`Ảnh ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
