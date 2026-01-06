import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const createCampaignSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    clientId: z.string().min(1, "Client ID is required"),
});

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // DOUBLE CHECK: Verify user exists in DB to prevent foreign key errors (stale session)
        const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { id: true }
        });

        if (!dbUser) {
            return new NextResponse("Session expired or user not found. Please log out and back in.", { status: 403 });
        }

        const json = await req.json();
        const body = createCampaignSchema.safeParse(json);

        if (!body.success) {
            return new NextResponse(body.error.message, { status: 400 });
        }

        const { name, description, clientId } = body.data;

        // Verify client exists and user has access (optional: add permissions check)
        const client = await db.client.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            return new NextResponse("Client not found", { status: 404 });
        }

        const campaign = await db.campaign.create({
            data: {
                name,
                description,
                clientId,
                status: "DRAFT",
                createdById: user.id,
                updatedById: user.id,
            },
            include: {
                client: { select: { slug: true } }
            }
        });

        // Revalidate for instant UI update
        revalidatePath("/dashboard/campaigns");
        revalidatePath(`/dashboard/clients/${campaign.client.slug}/campaigns`);

        return NextResponse.json(campaign);
    } catch (error: any) {
        console.error("[CAMPAIGN_POST_ERROR]", error);

        // Handle unique constraint or foreign key errors from Prisma
        if (error.code === 'P2003') {
            return new NextResponse("Database constraint error. Your session might be stale - please try logging out and back in.", { status: 500 });
        }

        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }

        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
