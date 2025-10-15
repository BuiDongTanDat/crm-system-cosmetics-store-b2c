import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const images = [
    '/images/landing/CL_rmb.png',
    '/images/landing/TH_rmb.png',
    '/images/landing/TT_rmb.png',
    '/images/landing/DV_rmb.png'
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
