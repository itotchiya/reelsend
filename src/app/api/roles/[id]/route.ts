import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userPermissions = (session.user as any)?.permissions as string[] | undefined;

        if (!userPermissions?.includes("roles:manage")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { description, permissions } = body;

        // Get the role
        const role = await db.role.findUnique({
            where: { id },
        });

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        // Update role description
        await db.role.update({
            where: { id },
            data: { description },
        });

        // Get permission IDs from keys
        const permissionRecords = await db.permission.findMany({
            where: { key: { in: permissions } },
        });

        // Delete existing role permissions
        await db.rolePermission.deleteMany({
            where: { roleId: id },
        });

        // Create new role permissions
        await db.rolePermission.createMany({
            data: permissionRecords.map((p) => ({
                roleId: id,
                permissionId: p.id,
            })),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update role:", error);
        return NextResponse.json(
            { error: "Failed to update role" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const role = await db.role.findUnique({
            where: { id },
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
        });

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            userCount: role._count.users,
            permissions: role.permissions.map((rp) => rp.permission.key),
        });
    } catch (error) {
        console.error("Failed to fetch role:", error);
        return NextResponse.json(
            { error: "Failed to fetch role" },
            { status: 500 }
        );
    }
}
