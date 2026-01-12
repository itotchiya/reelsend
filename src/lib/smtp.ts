import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { db } from "@/lib/db";

export interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    secure?: boolean;
}

export interface CampaignEmailOptions {
    from: string;
    fromName?: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

const SMTP_CONFIG_KEY = "smtp_config";
const DEFAULT_FROM_EMAIL_KEY = "default_from_email";

/**
 * Get SMTP configuration from environment variables (sync version)
 * Uses POSTAL_* prefix to avoid conflict with Resend SMTP variables
 */
export function getSmtpConfig(): SmtpConfig {
    return {
        host: process.env.POSTAL_SMTP_HOST || "",
        port: parseInt(process.env.POSTAL_SMTP_PORT || "587", 10),
        user: process.env.POSTAL_SMTP_USER || "",
        password: process.env.POSTAL_SMTP_PASSWORD || "",
        secure: process.env.POSTAL_SMTP_SECURE === "true",
    };
}

/**
 * Get SMTP configuration from database, fallback to env (async version)
 * Use this for campaign sending to respect UI-configured settings
 */
export async function getSmtpConfigFromDb(): Promise<SmtpConfig> {
    try {
        const setting = await db.systemSettings.findUnique({
            where: { key: SMTP_CONFIG_KEY },
        });

        if (setting?.value) {
            const parsed = JSON.parse(setting.value);
            if (parsed.host && parsed.user && parsed.password) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("[SMTP] Error reading config from database:", error);
    }

    // Fallback to environment variables
    return getSmtpConfig();
}

/**
 * Get default from email from database, fallback to env
 */
export async function getDefaultFromEmail(): Promise<string> {
    try {
        const setting = await db.systemSettings.findUnique({
            where: { key: DEFAULT_FROM_EMAIL_KEY },
        });

        if (setting?.value) {
            return setting.value;
        }
    } catch (error) {
        console.error("[SMTP] Error reading default email from database:", error);
    }

    return process.env.DEFAULT_FROM_EMAIL || "";
}

/**
 * Create a nodemailer transporter from SMTP config
 */
export function createSmtpTransporter(config?: SmtpConfig): Transporter {
    const smtpConfig = config || getSmtpConfig();

    const transportOptions: SMTPTransport.Options = {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure, // true for 465, false for other ports
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
        },
        // TLS options for servers with self-signed certs or STARTTLS
        tls: {
            rejectUnauthorized: false, // Accept self-signed certs
            minVersion: "TLSv1", // Allow older TLS versions
        },
        // For port 25, don't require TLS upgrade
        requireTLS: false,
        // Connection timeout
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
    };

    return nodemailer.createTransport(transportOptions);
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(config?: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    try {
        const transporter = createSmtpTransporter(config);
        await transporter.verify();
        return { success: true };
    } catch (error: any) {
        console.error("[SMTP] Connection test failed:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send a single campaign email
 */
export async function sendCampaignEmail(options: CampaignEmailOptions, config?: SmtpConfig): Promise<SendResult> {
    try {
        const transporter = createSmtpTransporter(config);

        // For Postal SMTP, try just the email address without display name
        // Some SMTP servers are very strict about the "from" format
        const fromAddress = options.from;

        console.log(`[SMTP] Sending from: ${fromAddress} to: ${options.to}`);

        const result = await transporter.sendMail({
            from: fromAddress,
            to: options.to,
            replyTo: options.replyTo || options.from,
            subject: options.subject,
            html: options.html,
            text: options.text || stripHtml(options.html),
        });

        console.log(`[SMTP] Email sent to ${options.to}, messageId: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
    } catch (error: any) {
        console.error(`[SMTP] Failed to send email to ${options.to}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send bulk campaign emails to multiple recipients
 * Returns summary of results
 */
export async function sendBulkCampaignEmails(
    recipients: Array<{ email: string; firstName?: string | null; lastName?: string | null;[key: string]: any }>,
    baseOptions: Omit<CampaignEmailOptions, "to">,
    config?: SmtpConfig
): Promise<{
    total: number;
    sent: number;
    failed: number;
    results: Array<{ email: string; success: boolean; error?: string }>;
}> {
    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    console.log(`[SMTP] Starting bulk send to ${recipients.length} recipients`);

    for (const recipient of recipients) {
        // Personalize the HTML content with merge tags
        const personalizedHtml = personalizeMergeTags(baseOptions.html, recipient);
        const personalizedSubject = personalizeMergeTags(baseOptions.subject, recipient);

        const result = await sendCampaignEmail(
            {
                ...baseOptions,
                html: personalizedHtml,
                subject: personalizedSubject,
                to: recipient.email,
            },
            config
        );

        results.push({
            email: recipient.email,
            success: result.success,
            error: result.error,
        });

        if (result.success) {
            sent++;
        } else {
            failed++;
        }

        // Small delay between emails to avoid rate limiting
        await sleep(100);
    }

    console.log(`[SMTP] Bulk send complete: ${sent} sent, ${failed} failed`);

    return {
        total: recipients.length,
        sent,
        failed,
        results,
    };
}

/**
 * Replace merge tags in content with recipient data
 */
function personalizeMergeTags(content: string, data: Record<string, any>): string {
    let result = content;

    // Common merge tag patterns: {FIRST_NAME}, {{firstName}}, {!firstName}
    const replacements: Record<string, string> = {
        "{FIRST_NAME}": data.firstName || "",
        "{LAST_NAME}": data.lastName || "",
        "{EMAIL}": data.email || "",
        "{PHONE}": data.phone || "",
        "{{firstName}}": data.firstName || "",
        "{{lastName}}": data.lastName || "",
        "{{email}}": data.email || "",
        "{!firstName}": data.firstName || "",
        "{!lastName}": data.lastName || "",
        "{!email}": data.email || "",
    };

    for (const [tag, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(escapeRegExp(tag), "gi"), value);
    }

    return result;
}

/**
 * Strip HTML tags to get plain text
 */
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
