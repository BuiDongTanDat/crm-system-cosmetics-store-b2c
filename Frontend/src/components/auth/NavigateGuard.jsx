import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { PermissionService } from "@/utils/PermissionService";

export default function NavigateGuard({ module, children }) {
  const location = useLocation();
  const { permissions, loading } = useAuthStore();

  // 1. Đợi fetchMe xong
  if (loading) return null; // hoặc spinner

  // 2. Không có quyền nào trong module
  const hasAccess = PermissionService.hasAnyPermission(permissions, module);

  if (!hasAccess) {
    return <Navigate to="/404" replace state={{ from: location }} />;
  }

  // 3. Có quyền → render page
  return children;
}
