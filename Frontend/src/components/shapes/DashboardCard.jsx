import React from 'react';
import { Link } from 'react-router-dom';

const DashboardCard = ({ 
  title, 
  subtitle, 
  icon, 
  path, 
  backgroundImage, 
  className = "",
  size = "large" // large, medium, small
}) => {
  const sizeClasses = {
    large: "w-56 h-56",
    medium: "w-44 h-44", 
    small: "w-36 h-36"
  };

  const textSizeClasses = {
    large: "text-2xl font-bold",
    medium: "text-lg font-bold",
    small: "text-base font-semibold"
  };

  const subtitleSizeClasses = {
    large: "text-sm font-medium",
    medium: "text-xs font-medium", 
    small: "text-xs font-medium"
  };

  const iconSizeClasses = {
    large: "w-16 h-16",
    medium: "w-12 h-12",
    small: "w-8 h-8"
  };

  return (
    <Link to={path} className="block group">
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          relative 
          overflow-hidden 
          shadow-xl 
          hover:shadow-2xl 
          transition-all 
          duration-300 
          transform 
          hover:scale-105
          border-4 
          border-white/40
          ${className}
        `}
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Soft Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-transparent hover:from-white/85 hover:via-white/65 hover:to-white/10 transition-all duration-300" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
          {/* Icon with soft background */}
          {icon && (
            <div className="mb-6 p-3 bg-white/50 rounded-full backdrop-blur-sm">
              {React.cloneElement(icon, { 
                className: `${iconSizeClasses[size]} text-gray-700`
              })}
            </div>
          )}
          
          {/* Title */}
          <h3 className={`${textSizeClasses[size]} text-gray-800 mb-2 leading-tight tracking-wide drop-shadow-sm`}>
            {title}
          </h3>
          
          {/* Subtitle */}
          {subtitle && (
            <p className={`${subtitleSizeClasses[size]} text-gray-600 leading-tight tracking-wider uppercase opacity-90`}>
              {subtitle}
            </p>
          )}

          {/* Small decorative tags */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            <span className="bg-blue-100/80 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
              Quality
            </span>
            <span className="bg-emerald-100/80 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
              Pro
            </span>
          </div>
        </div>

        {/* Subtle inner glow on hover */}
        <div className="absolute inset-2 rounded-full border border-white/20 group-hover:border-white/40 transition-all duration-300 pointer-events-none" />
      </div>
    </Link>
  );
};

export default DashboardCard;