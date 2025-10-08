// Chỉ cho phép truy cập nếu chưa đăng nhập
// Nếu đã đăng nhập → chuyển hướng về trang chính
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading spinner while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to home page if already authenticated
    return <Navigate to="/" replace />;
  }

  return children;
}