import { NextRequest, NextResponse } from "next/server";
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

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
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
            },
        });

        return NextResponse.json(campaign);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }

        return new NextResponse(null, { status: 500 });
    }
}
