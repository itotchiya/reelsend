import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const updateCampaignSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    subject: z.string().optional(),
    previewText: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().optional(),
    templateId: z.string().optional().nullable(),
    audienceId: z.string().optional().nullable(),
    status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Context) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;

        const campaign = await db.campaign.findUnique({
            where: { id },
            include: {
                client: true,
                template: true,
                audience: {
                    include: {
                        _count: {
                            select: { contacts: true },
                        },
                    },
                },
                analytics: true,
            },
        });

        if (!campaign) {
            return new NextResponse("Campaign not found", { status: 404 });
        }

        return NextResponse.json(campaign);
    } catch (error) {
        return new NextResponse(null, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Context) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const json = await req.json();
        const body = updateCampaignSchema.safeParse(json);

        if (!body.success) {
            return new NextResponse(body.error.message, { status: 400 });
        }

        const { templateId, audienceId, ...rest } = body.data;

        // Verify campaign exists
        const existingCampaign = await db.campaign.findUnique({
            where: { id },
        });

        if (!existingCampaign) {
            return new NextResponse("Campaign not found", { status: 404 });
        }

        // Logic to handle relation updates or disconnections
        const data: any = { ...rest };

        if (templateId !== undefined) {
            data.template = templateId ? { connect: { id: templateId } } : { disconnect: true };
        }

        if (audienceId !== undefined) {
            data.audience = audienceId ? { connect: { id: audienceId } } : { disconnect: true };
        }

        const campaign = await db.campaign.update({
            where: { id },
            data,
        });

        return NextResponse.json(campaign);
    } catch (error) {
        console.error("Campaign update error:", error);
        return new NextResponse(null, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Context) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;

        // Verify campaign exists
        const existingCampaign = await db.campaign.findUnique({
            where: { id },
        });

        if (!existingCampaign) {
            return new NextResponse("Campaign not found", { status: 404 });
        }

        // Don't allow deletion of campaigns that are currently sending
        if (existingCampaign.status === "SENDING") {
            return new NextResponse("Cannot delete a campaign that is currently sending", { status: 400 });
        }

        await db.campaign.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Campaign delete error:", error);
        return new NextResponse(null, { status: 500 });
    }
}
