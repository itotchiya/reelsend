import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userPermissions = (session.user as any)?.permissions as string[] | undefined;

        if (!userPermissions?.includes("roles:manage")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, icon, color, permissions } = body;

        if (!name || name.length < 2) {
            return NextResponse.json(
                { error: "Role name must be at least 2 characters" },
                { status: 400 }
            );
        }

        // Check if role already exists
        const existingRole = await db.role.findFirst({
            where: { name: name.toUpperCase() },
        });

        if (existingRole) {
            return NextResponse.json(
                { error: "A role with this name already exists" },
                { status: 400 }
            );
        }

        // Create the role
        const role = await db.role.create({
            data: {
                name: name.toUpperCase(),
                description: null,
                isSystem: false,
                icon: icon || null,
                color: color || null,
            },
        });

        // Get permission IDs from keys
        if (permissions && permissions.length > 0) {
            const permissionRecords = await db.permission.findMany({
                where: { key: { in: permissions } },
            });

            // Create role permissions
            await db.rolePermission.createMany({
                data: permissionRecords.map((p) => ({
                    roleId: role.id,
                    permissionId: p.id,
                })),
            });
        }

        return NextResponse.json({
            id: role.id,
            name: role.name,
            icon: role.icon,
            color: role.color,
        });
    } catch (error) {
        console.error("Failed to create role:", error);
        return NextResponse.json(
            { error: "Failed to create role" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
            orderBy: { name: "asc" },
        });

        return NextResponse.json(
            roles.map((role) => ({
                id: role.id,
                name: role.name,
                description: role.description,
                isSystem: role.isSystem,
                icon: role.icon,
                color: role.color,
                userCount: role._count.users,
                permissions: role.permissions.map((rp) => rp.permission.key),
            }))
        );
    } catch (error) {
        console.error("Failed to fetch roles:", error);
        return NextResponse.json(
            { error: "Failed to fetch roles" },
            { status: 500 }
        );
    }
}
