import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { PermissionService } from "@/utils/PermissionService";

export default function NavigateGuard({ module, children }) {
  const location = useLocation();
  const { permissions, loading } = useAuthStore();

  // 1. Đợi fetchMe xong
  if (loading) return null; // hoặc spinner

  const isOAuthCallback = useSearchParams("youtube_auth");

  // Nếu là OAuth callback, bỏ qua kiểm tra permission để xử lý callback
  if (isOAuthCallback) {
    return children;
  }
  // 2. Không có quyền nào trong module
  const hasAccess = PermissionService.hasAnyPermission(permissions, module);

  if (!hasAccess) {
    return <Navigate to="/404" replace state={{ from: location }} />;
  }

  // 3. Có quyền → render page
  return children;
}
