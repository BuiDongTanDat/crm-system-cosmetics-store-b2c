import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full relative">
      {/* Background Image */}
      <div
        className="opacity-30 absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />
      
      {/* Content with relative positioning */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}