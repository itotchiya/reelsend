import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Note: For test emails, we'll create a test subscriber in Acelle
// or just validate the campaign setup without sending

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
                audience: true,
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (!campaign.template) {
            return NextResponse.json({ error: "Campaign has no template" }, { status: 400 });
        }

        if (!campaign.audience) {
            return NextResponse.json({ error: "Campaign has no audience" }, { status: 400 });
        }

        let targetEmail = email;
        let personalizationData: Record<string, string> = {};

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

        // For now, we return a preview of what would be sent
        // The user should use the full campaign send in Acelle
        // Test emails can be sent by adding a single contact to a test list

        return NextResponse.json({
            success: true,
            message: `Test preview generated for ${targetEmail}`,
            preview: {
                to: targetEmail,
                subject: `[TEST] ${campaign.subject || campaign.name}`,
                from: `${campaign.fromName || campaign.client.name} <${campaign.fromEmail || "noreply@reelsend.com"}>`,
                htmlPreview: personalizedHtml.substring(0, 500) + "...",
            },
            note: "To send actual test emails, add the test recipient to your audience and use Acelle's built-in test feature.",
        });
    } catch (error: any) {
        console.error("[CAMPAIGN_TEST_SEND] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate test preview" },
            { status: 500 }
        );
    }
}
