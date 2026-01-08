import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendCampaign } from "@/lib/mailgun";
import { Contact } from "@prisma/client";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get campaign with all required data
        const campaign = await db.campaign.findUnique({
            where: { id },
            include: {
                client: true,
                template: true,
                audience: {
                    include: {
                        contacts: {
                            where: { status: "ACTIVE" },
                        },
                    },
                },
                segment: {
                    include: {
                        contacts: {
                            include: {
                                contact: true,
                            },
                        },
                    },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Validate campaign is ready to send
        if (!campaign.subject) {
            return NextResponse.json({ error: "Campaign subject is required" }, { status: 400 });
        }

        if (!campaign.template?.htmlContent) {
            return NextResponse.json({ error: "Campaign template is required" }, { status: 400 });
        }

        // Get recipients from segment or audience
        let contacts: Contact[] = [];

        if (campaign.segment?.contacts) {
            // Get contacts from segment
            contacts = campaign.segment.contacts
                .map((sc) => sc.contact)
                .filter((c): c is Contact => c !== null && c.status === "ACTIVE");
        } else if (campaign.audience?.contacts) {
            contacts = campaign.audience.contacts;
        }

        if (contacts.length === 0) {
            return NextResponse.json({ error: "No recipients found" }, { status: 400 });
        }

        // Prepare from address
        const fromName = campaign.fromName || campaign.client.name;
        const fromEmail = campaign.fromEmail || `noreply@${process.env.MAILGUN_DOMAIN}`;

        // Update campaign status to SENDING
        await db.campaign.update({
            where: { id },
            data: { status: "SENDING" },
        });

        // Prepare recipients with variables for personalization
        const recipients = contacts.map((contact) => ({
            email: contact.email,
            variables: {
                firstName: contact.firstName || "",
                lastName: contact.lastName || "",
                email: contact.email,
                contactId: contact.id,
            },
        }));

        // Send campaign via Mailgun
        const result = await sendCampaign({
            campaignId: id,
            recipients,
            fromName,
            fromEmail,
            subject: campaign.subject,
            html: campaign.template.htmlContent,
            tags: [campaign.client.slug, campaign.name.replace(/\s+/g, "-").toLowerCase()],
        });

        // Update campaign with results
        const finalStatus = result.failed === 0 ? "COMPLETED" : result.sent > 0 ? "COMPLETED" : "FAILED";

        await db.campaign.update({
            where: { id },
            data: {
                status: finalStatus,
                sentAt: new Date(),
            },
        });

        // Create or update analytics
        await db.campaignAnalytics.upsert({
            where: { campaignId: id },
            update: {
                sent: result.sent,
            },
            create: {
                campaignId: id,
                sent: result.sent,
                delivered: 0,
                opened: 0,
                clicked: 0,
                bounced: result.failed,
                complained: 0,
                unsubscribed: 0,
            },
        });

        // Log send events for each recipient
        const sentResults = result.results.filter((r) => r.success);
        if (sentResults.length > 0) {
            await db.campaignEvent.createMany({
                data: sentResults.map((r) => ({
                    campaignId: id,
                    contactId: contacts.find((c) => c.email === r.email)?.id || "",
                    type: "SENT" as const,
                    metadata: { messageId: r.messageId },
                })),
                skipDuplicates: true,
            });
        }

        return NextResponse.json({
            success: true,
            sent: result.sent,
            failed: result.failed,
            status: finalStatus,
        });
    } catch (error: any) {
        console.error("[CAMPAIGN_SEND] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send campaign" },
            { status: 500 }
        );
    }
}
