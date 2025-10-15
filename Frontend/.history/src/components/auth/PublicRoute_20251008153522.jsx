// Chỉ cho phép truy cập nếu chưa đăng nhập
// Nếu đã đăng nhập → chuyển hướng về trang chính
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}