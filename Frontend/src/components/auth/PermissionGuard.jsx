import { useAuthStore } from '@/store/useAuthStore';
import { PermissionService } from '@/utils/PermissionService';

export default function PermissionGuard({ module, action, children }) {
  const permissions = useAuthStore((state) => state.permissions);

  if (!PermissionService.hasPermission(permissions, module, action)) return null;

  return children;
}
