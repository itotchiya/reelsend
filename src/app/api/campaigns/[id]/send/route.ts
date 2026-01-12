import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendBulkCampaignEmails, getSmtpConfigFromDb, getDefaultFromEmail } from "@/lib/smtp";

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
                audience: true,
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

        if (!campaign.audience) {
            return NextResponse.json({ error: "Audience is required" }, { status: 400 });
        }

        // Get all contacts from the audience
        const contacts = await db.contact.findMany({
            where: {
                audienceId: campaign.audienceId!,
                status: "ACTIVE",
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
            },
        });

        if (contacts.length === 0) {
            return NextResponse.json(
                { error: "Audience has no active contacts" },
                { status: 400 }
            );
        }

        // 1. Get campaign's linked SMTP profile for this client
        // We look for any profile associated with the client
        const smtpProfile = await db.smtpProfile.findFirst({
            where: { clientId: campaign.clientId }
        });

        let smtpConfig: any;

        if (smtpProfile) {
            console.log(`[SMTP] Found linked profile "${smtpProfile.name}" for client ${campaign.clientId}. Performing lazy update.`);
            // LAZY UPDATE: Copy profile config to client's SMTP fields
            const updatedClient = await db.client.update({
                where: { id: campaign.clientId },
                data: {
                    smtpHost: smtpProfile.host,
                    smtpPort: smtpProfile.port,
                    smtpUser: smtpProfile.user,
                    smtpPassword: smtpProfile.password,
                    smtpSecure: smtpProfile.secure,
                    smtpVerified: true,
                    smtpLastTested: new Date(),
                }
            });

            smtpConfig = {
                host: smtpProfile.host,
                port: smtpProfile.port,
                user: smtpProfile.user,
                password: smtpProfile.password,
                secure: smtpProfile.secure,
            };
        } else {
            console.log(`[SMTP] No linked profile for client ${campaign.clientId}. Using existing client config or system fallback.`);
            // Fallback to client's direct SMTP or system-wide
            const dbConfig = await getSmtpConfigFromDb();

            // If client has its own config, use it, otherwise use system-wide
            smtpConfig = {
                host: campaign.client.smtpHost || dbConfig.host,
                port: campaign.client.smtpPort || dbConfig.port,
                user: campaign.client.smtpUser || dbConfig.user,
                password: campaign.client.smtpPassword || dbConfig.password,
                secure: campaign.client.smtpSecure !== null ? campaign.client.smtpSecure : dbConfig.secure,
            };
        }

        if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.password) {
            return NextResponse.json(
                { error: "SMTP is not configured. Please configure SMTP settings in Settings > Postal Config." },
                { status: 400 }
            );
        }

        // Prepare from address (from database, fallback to campaign, fallback to env)
        const fromName = campaign.fromName || campaign.client.name;
        const defaultFromEmail = await getDefaultFromEmail();
        const fromEmail = campaign.fromEmail || defaultFromEmail || "noreply@reelsend.com";

        console.log(`[SMTP] Using from email: ${fromEmail}, from name: ${fromName}`);

        // Update campaign status to SENDING
        await db.campaign.update({
            where: { id },
            data: { status: "SENDING" },
        });

        console.log(`[SMTP] Starting campaign ${campaign.name} to ${contacts.length} recipients`);

        // Send emails directly via SMTP
        const sendResult = await sendBulkCampaignEmails(
            contacts.map(c => ({
                email: c.email,
                firstName: c.firstName,
                lastName: c.lastName,
                phone: c.phone,
            })),
            {
                from: fromEmail,
                fromName: fromName,
                subject: campaign.subject,
                html: campaign.template.htmlContent,
                replyTo: fromEmail,
            },
            smtpConfig
        );

        // Update campaign status
        const finalStatus = sendResult.failed === sendResult.total ? "FAILED" : "COMPLETED";
        await db.campaign.update({
            where: { id },
            data: {
                status: finalStatus,
                sentAt: new Date(),
                startedById: session.user.id,
            },
        });

        // Create/update analytics record
        await db.campaignAnalytics.upsert({
            where: { campaignId: id },
            update: {
                sent: sendResult.sent,
                delivered: sendResult.sent, // Assume delivered = sent for now
            },
            create: {
                campaignId: id,
                sent: sendResult.sent,
                delivered: sendResult.sent,
                opened: 0,
                clicked: 0,
                bounced: sendResult.failed,
                complained: 0,
                unsubscribed: 0,
            },
        });

        console.log(`[SMTP] Campaign complete: ${sendResult.sent}/${sendResult.total} sent`);

        return NextResponse.json({
            success: true,
            message: `Campaign sent: ${sendResult.sent}/${sendResult.total} emails delivered`,
            sent: sendResult.sent,
            failed: sendResult.failed,
            total: sendResult.total,
        });
    } catch (error: any) {
        console.error("[CAMPAIGN_SEND] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send campaign" },
            { status: 500 }
        );
    }
}

