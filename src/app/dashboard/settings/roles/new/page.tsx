import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewRoleWizard } from "./new-role-wizard";

export default async function NewRolePage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    // Check if user has permission to manage roles
    if (!userPermissions?.includes("roles:manage")) {
        redirect("/dashboard/settings/roles");
    }

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

    return <NewRoleWizard permissionsByCategory={permissionsByCategory} />;
}
