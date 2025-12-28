"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { hasPermission, hasAnyPermission, Permission } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, Loader2 } from "lucide-react";

interface PermissionGuardProps {
    children: ReactNode;
    permission?: Permission;
    permissions?: Permission[];
    requireAll?: boolean; // If true, requires all permissions; otherwise, any
    fallback?: ReactNode;
    showAccessDenied?: boolean;
}

export function PermissionGuard({
    children,
    permission,
    permissions = [],
    requireAll = false,
    fallback,
    showAccessDenied = true,
}: PermissionGuardProps) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const userPermissions = (session?.user as any)?.permissions as string[] | undefined;

    // Check permissions
    let hasAccess = false;

    if (permission) {
        hasAccess = hasPermission(userPermissions, permission);
    } else if (permissions.length > 0) {
        if (requireAll) {
            hasAccess = permissions.every(p => hasPermission(userPermissions, p));
        } else {
            hasAccess = hasAnyPermission(userPermissions, permissions);
        }
    } else {
        // No permission requirement, allow access if authenticated
        hasAccess = !!session;
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showAccessDenied) {
        return (
            <Card className="border-destructive/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShieldX className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                        You don&apos;t have permission to access this content.
                        Please contact your administrator if you believe this is an error.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return null;
}

/**
 * Hook to check permissions in components
 */
export function usePermission(permission: Permission): boolean {
    const { data: session } = useSession();
    const userPermissions = (session?.user as any)?.permissions as string[] | undefined;
    return hasPermission(userPermissions, permission);
}

/**
 * Hook to get all user permissions
 */
export function usePermissions(): string[] {
    const { data: session } = useSession();
    return (session?.user as any)?.permissions || [];
}

/**
 * Hook to get user role
 */
export function useRole(): string | null {
    const { data: session } = useSession();
    return (session?.user as any)?.role || null;
}
