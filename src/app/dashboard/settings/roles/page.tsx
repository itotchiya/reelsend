import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RolesClient } from "./roles-client";

export default async function RolesPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    // Check if user has permission to manage roles
    if (!userPermissions?.includes("roles:manage")) {
        redirect("/dashboard");
    }

    // Fetch all roles with their permissions
    const roles = await db.role.findMany({
        include: {
            permissions: {
                include: {
                    permission: true,
                },
            },
            _count: {
                select: {
                    users: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    // Fetch all permissions grouped by category
    const permissions = await db.permission.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Group permissions by category
    const permissionsByCategory: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
        if (!permissionsByCategory[perm.category]) {
            permissionsByCategory[perm.category] = [];
        }
        permissionsByCategory[perm.category].push(perm);
    }

    // Transform roles data for client
    const rolesData = roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        userCount: role._count.users,
        permissions: role.permissions.map((rp) => rp.permission.key),
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                <p className="text-muted-foreground">
                    Manage user roles and their access permissions
                </p>
            </div>

            <RolesClient
                initialRoles={rolesData}
                permissionsByCategory={permissionsByCategory}
            />
        </div>
    );
}
