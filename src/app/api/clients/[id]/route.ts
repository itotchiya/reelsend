import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/clients/:id - Get single client
export async function GET(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    if (!hasPermission(userPermissions, "clients:view")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const client = await db.client.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        audiences: true,
                        campaigns: true,
                        templates: true,
                        domains: true,
                    },
                },
                smtpTestLogs: {
                    orderBy: { testedAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!client) {
            return new NextResponse("Client not found", { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("[CLIENT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH /api/clients/:id - Update client
export async function PATCH(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    if (!hasPermission(userPermissions, "clients:edit")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            name,
            slug,
            logo,
            brandColors,
            active,
            status,
            isPublic,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpSecure
        } = body;

        // Check if client exists
        const existingClient = await db.client.findUnique({
            where: { id },
        });

        if (!existingClient) {
            return new NextResponse("Client not found", { status: 404 });
        }

        // If slug is being changed, check for conflicts
        if (slug && slug !== existingClient.slug) {
            const slugConflict = await db.client.findUnique({
                where: { slug },
            });
            if (slugConflict) {
                return new NextResponse("A client with this slug already exists", { status: 400 });
            }
        }

        const client = await db.client.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, "-") }),
                ...(logo !== undefined && { logo }),
                ...(brandColors !== undefined && { brandColors }),
                ...(active !== undefined && { active }),
                ...(status !== undefined && { status }),
                ...(isPublic !== undefined && { isPublic }),
                ...(smtpHost !== undefined && { smtpHost }),
                ...(smtpPort !== undefined && { smtpPort }),
                ...(smtpUser !== undefined && { smtpUser }),
                ...(smtpPassword !== undefined && { smtpPassword }),
                ...(smtpSecure !== undefined && { smtpSecure }),
            },
            include: {
                _count: {
                    select: {
                        audiences: true,
                        campaigns: true,
                        templates: true,
                    },
                },
            },
        });

        return NextResponse.json(client);
    } catch (error) {
        console.error("[CLIENT_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE /api/clients/:id - Delete client
export async function DELETE(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    if (!hasPermission(userPermissions, "clients:delete")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        // Check if client exists
        const existingClient = await db.client.findUnique({
            where: { id },
        });

        if (!existingClient) {
            return new NextResponse("Client not found", { status: 404 });
        }

        await db.client.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CLIENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
