import Mailgun from "mailgun.js";
import formData from "form-data";
import crypto from "crypto";

// Initialize Mailgun client
const mailgun = new Mailgun(formData);

// Mailgun EU endpoint for EU region domains
const MAILGUN_API_URL = process.env.MAILGUN_REGION === "EU"
    ? "https://api.eu.mailgun.net"
    : "https://api.mailgun.net";

const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY || "",
    url: MAILGUN_API_URL,
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "";

export interface SendEmailOptions {
    to: string | string[];
    from: string;
    subject: string;
    html: string;
    text?: string;
    tags?: string[];
    customVariables?: Record<string, string>;
    trackingClicks?: boolean;
    trackingOpens?: boolean;
}

export interface SendCampaignOptions {
    campaignId: string;
    recipients: Array<{
        email: string;
        variables?: Record<string, string>;
    }>;
    fromName: string;
    fromEmail: string;
    subject: string;
    html: string;
    tags?: string[];
}

/**
 * Send a single email via Mailgun
 */
export async function sendEmail(options: SendEmailOptions) {
    const {
        to,
        from,
        subject,
        html,
        text,
        tags = [],
        customVariables = {},
        trackingClicks = true,
        trackingOpens = true,
    } = options;

    try {
        const messageData: any = {
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            "o:tracking-clicks": trackingClicks ? "yes" : "no",
            "o:tracking-opens": trackingOpens ? "yes" : "no",
        };

        if (text) {
            messageData.text = text;
        }

        // Add tags for tracking
        if (tags.length > 0) {
            messageData["o:tag"] = tags;
        }

        // Add custom variables for webhooks
        Object.entries(customVariables).forEach(([key, value]) => {
            messageData[`v:${key}`] = value;
        });

        const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

        console.log("[MAILGUN] Email sent:", result.id);
        return { success: true, messageId: result.id };
    } catch (error: any) {
        console.error("[MAILGUN] Send error:", error);
        return { success: false, error: error.message || "Failed to send email" };
    }
}

/**
 * Send a campaign to multiple recipients with personalization
 */
export async function sendCampaign(options: SendCampaignOptions) {
    const {
        campaignId,
        recipients,
        fromName,
        fromEmail,
        subject,
        html,
        tags = [],
    } = options;

    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];

    // Send emails in batches to avoid rate limits
    const BATCH_SIZE = 100;
    const batches = [];

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
        const promises = batch.map(async (recipient) => {
            // Replace variables in HTML content
            let personalizedHtml = html;
            if (recipient.variables) {
                Object.entries(recipient.variables).forEach(([key, value]) => {
                    personalizedHtml = personalizedHtml.replace(
                        new RegExp(`{{${key}}}`, "g"),
                        value || ""
                    );
                });
            }

            const result = await sendEmail({
                to: recipient.email,
                from: `${fromName} <${fromEmail}>`,
                subject,
                html: personalizedHtml,
                tags: [...tags, `campaign:${campaignId}`],
                customVariables: {
                    campaign_id: campaignId,
                    recipient_email: recipient.email,
                },
                trackingClicks: true,
                trackingOpens: true,
            });

            return {
                email: recipient.email,
                success: result.success,
                messageId: result.messageId,
                error: result.error,
            };
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (batches.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[MAILGUN] Campaign ${campaignId}: ${sent} sent, ${failed} failed`);

    return {
        success: failed === 0,
        sent,
        failed,
        results,
    };
}

/**
 * Verify webhook signature from Mailgun
 */
export function verifyWebhookSignature(
    timestamp: string,
    token: string,
    signature: string
): boolean {
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY || "";

    const encodedToken = crypto
        .createHmac("sha256", signingKey)
        .update(timestamp.concat(token))
        .digest("hex");

    return encodedToken === signature;
}
