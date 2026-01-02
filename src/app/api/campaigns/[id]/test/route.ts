import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import nodemailer from "nodemailer";

const testSendSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Context) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const json = await req.json();
        const body = testSendSchema.safeParse(json);

        if (!body.success) {
            return new NextResponse(body.error.message, { status: 400 });
        }

        const { email } = body.data;

        const campaign = await db.campaign.findUnique({
            where: { id },
            include: {
                client: true,
                template: true,
            },
        });

        if (!campaign) {
            return new NextResponse("Campaign not found", { status: 404 });
        }

        // Validate requirements
        if (!campaign.client.smtpHost) {
            return new NextResponse("SMTP settings missing for this client", { status: 400 });
        }

        if (!campaign.template?.htmlContent) {
            return new NextResponse("Template content is empty", { status: 400 });
        }

        // Configure Transporter
        const transporter = nodemailer.createTransport({
            host: campaign.client.smtpHost,
            port: campaign.client.smtpPort || 587,
            secure: campaign.client.smtpSecure,
            auth: {
                user: campaign.client.smtpUser || undefined,
                pass: campaign.client.smtpPassword || undefined,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Send Test Email
        await transporter.sendMail({
            from: `"${campaign.fromName || campaign.client.name}" <${campaign.fromEmail || campaign.client.smtpUser}>`,
            to: email,
            subject: `[TEST] ${campaign.subject || campaign.name}`,
            html: campaign.template.htmlContent,
        });

        return NextResponse.json({ success: true, message: "Test email sent" });
    } catch (error: any) {
        console.error("Test send error:", error);
        return new NextResponse(error.message || "Failed to send test email", { status: 500 });
    }
}
