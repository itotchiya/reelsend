import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

// GET /api/clients - List all clients
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    if (!hasPermission(userPermissions, "clients:view")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const clients = await db.client.findMany({
            include: {
                _count: {
                    select: {
                        audiences: true,
                        campaigns: true,
                        templates: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(clients);
    } catch (error) {
        console.error("[CLIENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/clients - Create new client
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    if (!hasPermission(userPermissions, "clients:create")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            name,
            slug,
            logo,
            brandColors,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpSecure,
            isPublic
        } = body;

        if (!name || !slug) {
            return new NextResponse("Name and slug are required", { status: 400 });
        }

        // Check if slug already exists
        const existingClient = await db.client.findUnique({
            where: { slug },
        });

        if (existingClient) {
            return new NextResponse("A client with this slug already exists", { status: 400 });
        }

        const client = await db.client.create({
            data: {
                name,
                slug: slug.toLowerCase().replace(/\s+/g, "-"),
                logo,
                brandColors,
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPassword,
                smtpSecure: smtpSecure ?? true,
                isPublic: isPublic ?? false,
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

        // Revalidate clients list for instant UI update
        revalidatePath("/dashboard/clients");

        return NextResponse.json(client);
    } catch (error) {
        console.error("[CLIENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
