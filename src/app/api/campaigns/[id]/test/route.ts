import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mailgun";

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
        const { email, contactId } = await request.json();

        if (!email && !contactId) {
            return NextResponse.json({ error: "Email or Contact ID is required" }, { status: 400 });
        }

        // Fetch campaign with related data
        const campaign = await db.campaign.findUnique({
            where: { id },
            include: {
                client: true,
                template: true,
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (!campaign.template) {
            return NextResponse.json({ error: "Campaign has no template" }, { status: 400 });
        }

        let targetEmail = email;
        let personalizationData = {};

        // If contact ID is provided, fetch contact for personalization
        if (contactId) {
            const contact = await db.contact.findUnique({
                where: { id: contactId },
            });
            if (contact) {
                targetEmail = contact.email;
                personalizationData = {
                    firstName: contact.firstName || "",
                    lastName: contact.lastName || "",
                    email: contact.email,
                    companyName: campaign.client.name,
                };
            }
        } else if (email) {
            // Manual email case - limited personalization
            personalizationData = {
                firstName: "Test",
                lastName: "User",
                email: email,
                companyName: campaign.client.name,
            };
        }

        let personalizedHtml = campaign.template.htmlContent;
        if (personalizationData) {
            Object.entries(personalizationData).forEach(([key, value]) => {
                personalizedHtml = personalizedHtml.replace(
                    new RegExp(`{{${key}}}`, "g"),
                    String(value || "")
                );
            });
        }

        // Send test email using Mailgun
        const result = await sendEmail({
            to: targetEmail,
            subject: `[TEST] ${campaign.subject || campaign.name}`,
            html: personalizedHtml,
            from: `${campaign.fromName || campaign.client.name} <${campaign.fromEmail || "test@reelsend.com"}>`,
            customVariables: {
                campaign_id: campaign.id,
                is_test: "true",
            },
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent to ${targetEmail}`,
            result,
        });
    } catch (error: any) {
        console.error("[CAMPAIGN_TEST_SEND] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send test email" },
            { status: 500 }
        );
    }
}
