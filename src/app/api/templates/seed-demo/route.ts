import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Professional demo email template HTML with all anti-spam best practices
const DEMO_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no, address=no, email=no, date=no">
    <title>Your Monthly Update</title>
    <!--[if mso]>
    <style type="text/css">
        table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    </style>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        
        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background-color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        /* Responsive styles */
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 20px !important; }
            .content { padding: 24px !important; }
            .hero-image { height: 180px !important; }
            .button { width: 100% !important; }
            .footer { padding: 24px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
    <!-- Preview Text (preheader) -->
    <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #ffffff;">
        Your personalized monthly update is here! Check out what's new and exciting this month.
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
    </div>

    <!-- Main Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Email Content Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 32px 40px 24px; text-align: center;">
                            <!-- Replace with your logo -->
                            <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 24px; border-radius: 8px; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                                {{companyName}}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Hero Image -->
                    <tr>
                        <td style="padding: 0;">
                            <div class="hero-image" style="height: 220px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td align="center" style="color: white; padding: 40px;">
                                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">Hello, {{firstName}}!</h1>
                                            <p style="margin: 12px 0 0; font-size: 16px; opacity: 0.9;">Your monthly update is here</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td class="content" style="padding: 40px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                                We're excited to share the latest news and updates with you. Here's a summary of what's been happening and what's coming next.
                            </p>
                            
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                                We've been working hard on new features and improvements that we think you'll love. Click the button below to explore what's new.
                            </p>
                            
                            <!-- Primary CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px;">
                                        <a href="{{ctaUrl}}" class="button" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
                                            View Updates
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                If you have any questions or need assistance, our support team is always ready to help.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td class="footer" style="padding: 32px 40px; text-align: center;">
                            <!-- Why you're receiving this -->
                            <p style="margin: 0 0 16px; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                                You're receiving this email because you subscribed to updates from {{companyName}}.
                            </p>
                            
                            <!-- Unsubscribe and Preferences -->
                            <p style="margin: 0 0 16px; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                                <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                                &nbsp;&bull;&nbsp;
                                <a href="{{preferencesUrl}}" style="color: #6b7280; text-decoration: underline;">Manage Preferences</a>
                                &nbsp;&bull;&nbsp;
                                <a href="mailto:{{supportEmail}}" style="color: #6b7280; text-decoration: underline;">Contact Support</a>
                            </p>
                            
                            <!-- Company Info (Required for CAN-SPAM) -->
                            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                                {{companyName}}<br>
                                {{companyAddress}}<br>
                                {{companyCity}}, {{companyCountry}}
                            </p>
                            
                            <!-- Copyright -->
                            <p style="margin: 16px 0 0; font-size: 11px; color: #d1d5db;">
                                © 2024 {{companyName}}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>`;

const DEMO_TEMPLATE_JSON = {
    root: {
        type: "EmailLayout",
        data: {
            backdropColor: "#f4f4f5",
            contentWidth: 600,
        },
        children: [
            {
                type: "Container",
                data: { style: { padding: "32px 40px 24px" } },
                children: [
                    { type: "Logo", data: { text: "{{companyName}}" } }
                ]
            },
            {
                type: "Hero",
                data: {
                    title: "Hello, {{firstName}}!",
                    subtitle: "Your monthly update is here",
                    backgroundColor: "#667eea"
                }
            },
            {
                type: "Container",
                data: { style: { padding: "40px" } },
                children: [
                    { type: "Text", data: { text: "We're excited to share the latest news and updates with you." } },
                    { type: "Button", data: { text: "View Updates", url: "{{ctaUrl}}" } }
                ]
            },
            {
                type: "Footer",
                data: {
                    companyName: "{{companyName}}",
                    address: "{{companyAddress}}",
                    unsubscribeUrl: "{{unsubscribeUrl}}"
                }
            }
        ]
    }
};

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if demo template already exists
        const existingTemplate = await db.template.findFirst({
            where: {
                name: "Campaign Demo Template",
                isRecommended: true,
            },
        });

        if (existingTemplate) {
            return NextResponse.json({
                message: "Demo template already exists",
                template: existingTemplate,
            });
        }

        // Create the demo template
        const template = await db.template.create({
            data: {
                name: "Campaign Demo Template",
                description: "A professional email template with all anti-spam best practices. Includes preheader, clear CTA, balanced text/image ratio, and CAN-SPAM compliant footer with unsubscribe link and physical address.",
                htmlContent: DEMO_TEMPLATE_HTML,
                jsonContent: DEMO_TEMPLATE_JSON,
                isRecommended: true,
                createdById: session.user.id,
                // No clientId = global template available to all
            },
        });

        return NextResponse.json({
            success: true,
            message: "Demo template created successfully",
            template,
        });
    } catch (error: any) {
        console.error("[SEED_DEMO_TEMPLATE] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create demo template" },
            { status: 500 }
        );
    }
}

// GET endpoint to check if demo template exists
export async function GET() {
    try {
        const template = await db.template.findFirst({
            where: { isRecommended: true },
        });

        return NextResponse.json({
            exists: !!template,
            template,
        });
    } catch (error: any) {
        console.error("[GET_DEMO_TEMPLATE] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch demo template" },
            { status: 500 }
        );
    }
}
