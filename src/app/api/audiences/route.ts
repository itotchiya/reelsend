import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/audiences - Fetch all audiences
export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    try {
        const audiences = await db.audience.findMany({
            where: {
                ...(clientId && { clientId })
            },
            include: {
                client: true,
                _count: {
                    select: {
                        contacts: true,
                        segments: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(audiences);
    } catch (error) {
        console.error("[AUDIENCES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/audiences - Create a new audience
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the user exists in the database
    const userExists = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
    });

    if (!userExists) {
        console.error("[AUDIENCE_POST] User ID from session doesn't exist in database:", session.user.id);
        return new NextResponse("User not found in database. Please log out and log back in.", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, clientId } = body;

        if (!name || !clientId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Fetch client for revalidation path
        const client = await db.client.findUnique({
            where: { id: clientId },
            select: { slug: true }
        });

        if (!client) {
            return new NextResponse("Client not found", { status: 404 });
        }

        // Create audience in database
        const audience = await db.audience.create({
            data: {
                name,
                description,
                clientId,
                createdById: session.user.id
            },
            include: {
                client: { select: { slug: true } }
            }
        });

        // Revalidate for instant UI update
        revalidatePath("/dashboard/audiences");
        revalidatePath(`/dashboard/clients/${audience.client.slug}/audiences`);

        return NextResponse.json(audience);
    } catch (error) {
        console.error("[AUDIENCE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
