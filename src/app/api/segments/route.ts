import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { audienceId, name, description, contactIds } = body;

        if (!audienceId || !name) {
            return new NextResponse("Audience ID and name are required", { status: 400 });
        }

        if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
            return new NextResponse("At least one contact must be selected", { status: 400 });
        }

        // Verify audience exists
        const audience = await db.audience.findUnique({
            where: { id: audienceId },
            select: { id: true, clientId: true, client: { select: { slug: true } } }
        });

        if (!audience) {
            return new NextResponse("Audience not found", { status: 404 });
        }

        // Check for duplicate segment name
        const existing = await db.segment.findUnique({
            where: { audienceId_name: { audienceId, name } }
        });

        if (existing) {
            return new NextResponse("A segment with this name already exists in this audience", { status: 409 });
        }

        // Create segment with contacts
        const segment = await db.segment.create({
            data: {
                audienceId,
                name,
                description,
                createdById: session.user.id,
                contacts: {
                    createMany: {
                        data: contactIds.map((contactId: string) => ({ contactId })),
                        skipDuplicates: true
                    }
                }
            },
            include: {
                _count: { select: { contacts: true } }
            }
        });

        revalidatePath(`/dashboard/clients/${audience.client.slug}/audiences/${audienceId}/segments`);

        return NextResponse.json(segment);
    } catch (error: any) {
        console.error("[SEGMENTS_POST]", error);

        if (error.code === "P2002") {
            return new NextResponse("A segment with this name already exists", { status: 409 });
        }

        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
