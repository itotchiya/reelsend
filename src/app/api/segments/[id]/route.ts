import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const segment = await db.segment.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                campaigns: { select: { id: true, name: true } },
                contacts: {
                    include: {
                        contact: true
                    }
                },
                _count: { select: { contacts: true } }
            }
        });

        if (!segment) {
            return new NextResponse("Segment not found", { status: 404 });
        }

        return NextResponse.json(segment);
    } catch (error) {
        console.error("[SEGMENT_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description } = body;

        const segment = await db.segment.findUnique({
            where: { id },
            include: { audience: { include: { client: true } } }
        });

        if (!segment) {
            return new NextResponse("Segment not found", { status: 404 });
        }

        const updated = await db.segment.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
            }
        });

        revalidatePath(`/dashboard/clients/${segment.audience.client.slug}/audiences/${segment.audienceId}/segments`);

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("[SEGMENT_PATCH]", error);

        if (error.code === "P2002") {
            return new NextResponse("A segment with this name already exists", { status: 409 });
        }

        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const segment = await db.segment.findUnique({
            where: { id },
            include: { audience: { include: { client: true } } }
        });

        if (!segment) {
            return new NextResponse("Segment not found", { status: 404 });
        }

        await db.segment.delete({ where: { id } });

        revalidatePath(`/dashboard/clients/${segment.audience.client.slug}/audiences/${segment.audienceId}/segments`);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[SEGMENT_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
