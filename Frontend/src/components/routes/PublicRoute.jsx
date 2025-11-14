// Chỉ cho phép truy cập nếu chưa đăng nhập (Trang đăng nhập, quên mật khẩu)
// Nếu đã đăng nhập → chuyển hướng về trang chính
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  // Nếu đã đăng nhập, chuyển hướng về trang chính
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
