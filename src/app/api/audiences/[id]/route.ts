import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/audiences/[id] - Fetch audience details
export async function GET(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const audience = await db.audience.findUnique({
            where: { id },
            include: {
                client: true,
                _count: {
                    select: { contacts: true }
                }
            }
        });

        if (!audience) {
            return new NextResponse("Audience not found", { status: 404 });
        }

        return NextResponse.json(audience);
    } catch (error) {
        console.error("[AUDIENCE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH /api/audiences/[id] - Update audience metadata
export async function PATCH(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description } = body;

        // Get existing audience for client slug
        const existing = await db.audience.findUnique({
            where: { id },
            include: { client: { select: { slug: true } } }
        });

        if (!existing) {
            return new NextResponse("Audience not found", { status: 404 });
        }

        const audience = await db.audience.update({
            where: { id },
            data: { name, description }
        });

        // Revalidate for instant UI update
        revalidatePath("/dashboard/audiences");
        revalidatePath(`/dashboard/clients/${existing.client.slug}/audiences`);
        revalidatePath(`/dashboard/clients/${existing.client.slug}/audiences/${id}`);

        return NextResponse.json(audience);
    } catch (error) {
        console.error("[AUDIENCE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE /api/audiences/[id] - Delete an audience
export async function DELETE(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Get existing for client slug before deleting
        const existing = await db.audience.findUnique({
            where: { id },
            include: { client: { select: { slug: true } } }
        });

        if (!existing) {
            return new NextResponse("Audience not found", { status: 404 });
        }

        await db.audience.delete({
            where: { id }
        });

        // Revalidate for instant UI update
        revalidatePath("/dashboard/audiences");
        revalidatePath(`/dashboard/clients/${existing.client.slug}/audiences`);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[AUDIENCE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
