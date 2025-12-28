import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

// PATCH /api/team/[id] - Update user role or status
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    const canManageUsers = hasPermission(userPermissions, "users:manage");
    if (!canManageUsers) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const { roleId, status } = body;

        const user = await db.user.update({
            where: { id: id },
            data: {
                roleId,
                status,
            },
            include: {
                role: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[TEAM_ID_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE /api/team/[id] - Remove user from team
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    const userRole = (session.user as any)?.role;
    console.log("[TEAM_DELETE] Request by:", session.user.email, "Role:", userRole);

    const canManageUsers = hasPermission(userPermissions, "users:manage");
    if (!canManageUsers) {
        console.log("[TEAM_DELETE] Forbidden: Missing users:manage permission");
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        // Prevent deleting yourself
        if (id === session.user.id) {
            return new NextResponse("Cannot remove yourself", { status: 400 });
        }

        // Check if target user is superadmin
        const targetUser = await db.user.findUnique({
            where: { id: id },
            include: { role: true },
        });

        if (targetUser?.role?.name === "SUPER_ADMIN") {
            // Only SUPER_ADMIN can remove another SUPER_ADMIN
            const isCurrentSuperAdmin = (session.user as any).role === "SUPER_ADMIN";
            if (!isCurrentSuperAdmin) {
                return new NextResponse("Cannot remove a SuperAdmin", { status: 403 });
            }
        }

        console.log("[TEAM_DELETE] Successfully deleted user:", id);
        await db.user.delete({
            where: { id: id },
        });

        return new NextResponse("User deleted", { status: 200 });
    } catch (error) {
        console.error("[TEAM_ID_DELETE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
