import { useAuthStore } from '@/store/useAuthStore';
import { PermissionService } from '@/utils/PermissionService';

export default function PermissionGuard({ module, action, children }) {
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);

  // Admin bypass
  if (user?.role_name === 'Admin' || user?.role_name === 'Quản trị viên') return children;

  if (!PermissionService.hasPermission(permissions, module, action)) return null;

  return children;
}
