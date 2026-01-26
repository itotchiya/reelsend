import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const createCampaignSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    clientId: z.string().min(1, "Client ID is required"),
    // Optional fields from wizard
    templateId: z.string().optional().nullable(),
    audienceId: z.string().optional().nullable(),
    segmentId: z.string().optional().nullable(),
    smtpProfileId: z.string().optional().nullable(),
    subject: z.string().optional(),
    previewText: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().optional(),
    senderName: z.string().optional(), // alias for fromName from wizard
    replyTo: z.string().optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED", "CANCELLED"]).optional(),
    scheduledAt: z.string().optional().nullable(),
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

        const {
            name,
            description,
            clientId,
            templateId,
            audienceId,
            segmentId,
            smtpProfileId,
            subject,
            previewText,
            fromName,
            fromEmail,
            senderName,
            replyTo,
            status,
            scheduledAt,
        } = body.data;

        // Verify client exists and user has access (optional: add permissions check)
        const client = await db.client.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            return new NextResponse("Client not found", { status: 404 });
        }

        // Determine the final status
        let finalStatus = status || "DRAFT";

        // Use senderName as fromName if fromName not provided
        const finalFromName = fromName || senderName || null;

        const campaign = await db.campaign.create({
            data: {
                name,
                description,
                clientId,
                templateId: templateId || null,
                audienceId: audienceId || null,
                segmentId: segmentId || null,
                smtpProfileId: smtpProfileId || null,
                subject: subject || null,
                previewText: previewText || null,
                fromName: finalFromName,
                fromEmail: fromEmail || replyTo || null,
                status: finalStatus,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
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
