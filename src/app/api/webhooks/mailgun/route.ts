import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/mailgun";

// Mailgun event types
type MailgunEventType =
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "dropped"
    | "complained"
    | "unsubscribed";

// Map Mailgun events to our EventType enum
const eventTypeMap: Record<MailgunEventType, string> = {
    delivered: "DELIVERED",
    opened: "OPENED",
    clicked: "CLICKED",
    bounced: "BOUNCED",
    dropped: "BOUNCED",
    complained: "COMPLAINED",
    unsubscribed: "UNSUBSCRIBED",
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract signature data
        const timestamp = formData.get("timestamp") as string;
        const token = formData.get("token") as string;
        const signature = formData.get("signature") as string;

        // Verify webhook signature (skip in development if key not set)
        if (process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
            const isValid = verifyWebhookSignature(timestamp, token, signature);
            if (!isValid) {
                console.error("[MAILGUN_WEBHOOK] Invalid signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        // Extract event data
        const eventData = formData.get("event-data");
        let event: any;

        if (typeof eventData === "string") {
            event = JSON.parse(eventData);
        } else {
            // Legacy format - build from form data
            event = {
                event: formData.get("event"),
                recipient: formData.get("recipient"),
                "user-variables": {
                    campaign_id: formData.get("campaign_id") || formData.get("X-Mailgun-Variables"),
                    recipient_email: formData.get("recipient_email"),
                },
                "client-info": {
                    "client-os": formData.get("client-os"),
                    "client-name": formData.get("client-name"),
                    "device-type": formData.get("device-type"),
                },
                geolocation: {
                    country: formData.get("country"),
                    city: formData.get("city"),
                },
                url: formData.get("url"),
                ip: formData.get("ip"),
            };
        }

        const eventType = event.event as MailgunEventType;
        const recipientEmail = event.recipient;

        // Get campaign ID from custom variables
        const campaignId = event["user-variables"]?.campaign_id;

        if (!campaignId) {
            console.log("[MAILGUN_WEBHOOK] No campaign_id in event, skipping");
            return NextResponse.json({ success: true, skipped: true });
        }

        console.log(`[MAILGUN_WEBHOOK] ${eventType} for campaign ${campaignId}, recipient: ${recipientEmail}`);

        // Find the contact
        const contact = await db.contact.findFirst({
            where: { email: recipientEmail },
        });

        if (!contact) {
            console.log(`[MAILGUN_WEBHOOK] Contact not found: ${recipientEmail}`);
            return NextResponse.json({ success: true, skipped: true });
        }

        // Map to our event type
        const mappedEventType = eventTypeMap[eventType];
        if (!mappedEventType) {
            console.log(`[MAILGUN_WEBHOOK] Unknown event type: ${eventType}`);
            return NextResponse.json({ success: true, skipped: true });
        }

        // Create campaign event
        await db.campaignEvent.create({
            data: {
                campaignId,
                contactId: contact.id,
                type: mappedEventType as any,
                metadata: {
                    ip: event.ip,
                    userAgent: event["client-info"]?.["client-name"],
                    deviceType: event["client-info"]?.["device-type"],
                    country: event.geolocation?.country,
                    city: event.geolocation?.city,
                    url: event.url,
                    timestamp: event.timestamp,
                },
            },
        });

        // Update campaign analytics
        const analyticsUpdate: Record<string, { increment: number }> = {};

        switch (mappedEventType) {
            case "DELIVERED":
                analyticsUpdate.delivered = { increment: 1 };
                break;
            case "OPENED":
                analyticsUpdate.opened = { increment: 1 };
                break;
            case "CLICKED":
                analyticsUpdate.clicked = { increment: 1 };
                break;
            case "BOUNCED":
                analyticsUpdate.bounced = { increment: 1 };
                // Mark contact as bounced
                await db.contact.update({
                    where: { id: contact.id },
                    data: { status: "BOUNCED" },
                });
                break;
            case "UNSUBSCRIBED":
                analyticsUpdate.unsubscribed = { increment: 1 };
                // Mark contact as unsubscribed
                await db.contact.update({
                    where: { id: contact.id },
                    data: { status: "UNSUBSCRIBED" },
                });
                break;
            case "COMPLAINED":
                analyticsUpdate.complained = { increment: 1 };
                // Mark contact as blacklisted after complaint
                await db.contact.update({
                    where: { id: contact.id },
                    data: { status: "BLACKLISTED" },
                });
                break;
        }

        if (Object.keys(analyticsUpdate).length > 0) {
            await db.campaignAnalytics.upsert({
                where: { campaignId },
                update: analyticsUpdate,
                create: {
                    campaignId,
                    sent: 0,
                    delivered: mappedEventType === "DELIVERED" ? 1 : 0,
                    opened: mappedEventType === "OPENED" ? 1 : 0,
                    clicked: mappedEventType === "CLICKED" ? 1 : 0,
                    bounced: mappedEventType === "BOUNCED" ? 1 : 0,
                    unsubscribed: mappedEventType === "UNSUBSCRIBED" ? 1 : 0,
                    complained: mappedEventType === "COMPLAINED" ? 1 : 0,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[MAILGUN_WEBHOOK] Error:", error);
        return NextResponse.json(
            { error: error.message || "Webhook processing failed" },
            { status: 500 }
        );
    }
}

// Mailgun expects a 200 response quickly, so we handle GET for verification
export async function GET() {
    return NextResponse.json({ status: "Mailgun webhook endpoint active" });
}
