// Bypass auth redirects when VITE_DISABLE_AUTH_REDIRECTS is "true"
const DISABLE_AUTH_REDIRECT = import.meta.env.VITE_DISABLE_AUTH_REDIRECTS === 'true';

//CHỉ cho phép truy cập nếu đã đăng nhập (Các trang chính)
// Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function PrivateRoute({ children }) {
  if (DISABLE_AUTH_REDIRECT) {
    return children;
  }

  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}
