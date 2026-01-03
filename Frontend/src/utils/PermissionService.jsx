export const PermissionService = {
  hasAnyPermission(permissions, module) {
    if (!Array.isArray(permissions)) return false;

    const perm = permissions.find((p) => p.name === module);
    if (!perm) return false;

    return Object.entries(perm)
      .filter(([key]) => key !== "name")
      .some(([, value]) => value === true);
  },

  hasPermission(permissions, module, action) {
    if (!Array.isArray(permissions)) return false;

    const perm = permissions.find((p) => p.name === module);
    return perm?.[action] === true;
  },
};
