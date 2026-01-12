import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendCampaignEmail, getSmtpConfigFromDb } from "@/lib/smtp";

// POST /api/postal/send-test - Send a test email
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { config: formConfig, to, from, fromName } = body;

        // Get stored config from database for fallback values
        const storedConfig = await getSmtpConfigFromDb();

        // Use form values, but fall back to stored values if not provided
        const config = {
            host: formConfig?.host || storedConfig.host,
            port: formConfig?.port || storedConfig.port || 587,
            user: formConfig?.user || storedConfig.user,
            password: formConfig?.password || storedConfig.password,
            secure: formConfig?.secure ?? storedConfig.secure ?? false,
        };

        // Validate required fields
        if (!config.host || !config.user || !config.password) {
            return NextResponse.json(
                { success: false, error: "Missing SMTP configuration. Please save your SMTP settings first." },
                { status: 400 }
            );
        }

        if (!to || !from) {
            return NextResponse.json(
                { success: false, error: "Missing recipient or sender email" },
                { status: 400 }
            );
        }

        console.log(`[POSTAL_SEND_TEST] Sending test email from ${from} to ${to}`);

        const result = await sendCampaignEmail(
            {
                from: from,
                fromName: fromName || "Reelsend Test",
                to: to,
                subject: "🚀 Reelsend Test Email - SMTP Configuration Working!",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 40px; text-align: center; color: white;">
                            <h1 style="margin: 0 0 16px 0; font-size: 28px;">✅ SMTP Test Successful!</h1>
                            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Your Postal SMTP configuration is working correctly.</p>
                        </div>
                        
                        <div style="background: white; border-radius: 16px; padding: 32px; margin-top: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 20px;">Configuration Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">SMTP Host</td>
                                    <td style="padding: 8px 0; color: #1a1a2e; text-align: right; border-bottom: 1px solid #eee; font-family: monospace;">${config.host}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">Port</td>
                                    <td style="padding: 8px 0; color: #1a1a2e; text-align: right; border-bottom: 1px solid #eee; font-family: monospace;">${config.port}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">From Email</td>
                                    <td style="padding: 8px 0; color: #1a1a2e; text-align: right; border-bottom: 1px solid #eee; font-family: monospace;">${from}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Sent At</td>
                                    <td style="padding: 8px 0; color: #1a1a2e; text-align: right; font-family: monospace;">${new Date().toISOString()}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="text-align: center; margin-top: 32px; color: #888; font-size: 14px;">
                            <p>This is a test email from <strong>Reelsend</strong></p>
                            <p style="margin-top: 8px;">You can now start sending campaigns! 🎉</p>
                        </div>
                    </body>
                    </html>
                `,
            },
            config
        );

        if (result.success) {
            console.log(`[POSTAL_SEND_TEST] Email sent successfully! MessageId: ${result.messageId}`);
            return NextResponse.json({
                success: true,
                messageId: result.messageId,
            });
        } else {
            console.log(`[POSTAL_SEND_TEST] Failed to send: ${result.error}`);
            return NextResponse.json({
                success: false,
                error: result.error,
            });
        }
    } catch (error: any) {
        console.error("[POSTAL_SEND_TEST] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to send test email" },
            { status: 500 }
        );
    }
}
