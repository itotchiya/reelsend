import { db } from "@/lib/db";

export type Permission =
    | "clients:view" | "clients:create" | "clients:edit" | "clients:delete"
    | "campaigns:view" | "campaigns:create" | "campaigns:edit" | "campaigns:send" | "campaigns:delete"
    | "templates:view" | "templates:create" | "templates:edit" | "templates:delete"
    | "audiences:view" | "audiences:create" | "audiences:import" | "audiences:edit" | "audiences:delete"
    | "domains:view" | "domains:create" | "domains:verify" | "domains:delete"
    | "analytics:view" | "analytics:export"
    | "settings:view" | "settings:edit" | "roles:manage" | "users:manage"
    | "portal:share" | "portal:view_own";

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
    userPermissions: string[] | undefined,
    requiredPermission: Permission
): boolean {
    if (!userPermissions) return false;
    return userPermissions.includes(requiredPermission);
}

/**
 * Check if a user has ALL of the required permissions
 */
export function hasAllPermissions(
    userPermissions: string[] | undefined,
    requiredPermissions: Permission[]
): boolean {
    if (!userPermissions) return false;
    return requiredPermissions.every(p => userPermissions.includes(p));
}

/**
 * Check if a user has ANY of the required permissions
 */
export function hasAnyPermission(
    userPermissions: string[] | undefined,
    requiredPermissions: Permission[]
): boolean {
    if (!userPermissions) return false;
    return requiredPermissions.some(p => userPermissions.includes(p));
}

/**
 * Get all permissions for a role from the database
 */
export async function getPermissionsForRole(roleId: string): Promise<string[]> {
    const rolePermissions = await db.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
    });
    return rolePermissions.map(rp => rp.permission.key);
}

/**
 * Get all permissions grouped by category
 */
export async function getAllPermissionsGrouped() {
    const permissions = await db.permission.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
        if (!grouped[perm.category]) {
            grouped[perm.category] = [];
        }
        grouped[perm.category].push(perm);
    }
    return grouped;
}
