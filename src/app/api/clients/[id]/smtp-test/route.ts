import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// POST /api/clients/:id/smtp-test - Test SMTP connection
export async function POST(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    let smtpConfig: any = {};
    try {
        const body = await req.json();
        const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure } = body;
        smtpConfig = { smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure };

        if (!smtpHost || !smtpUser || !smtpPassword) {
            return new NextResponse("Missing required SMTP settings", { status: 400 });
        }

        // Create a transporter with the provided settings
        // Port 465 = implicit SSL (secure: true)
        // Port 587 = STARTTLS (secure: false, but still encrypted after upgrade)
        const useSecure = smtpPort === 465;

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort || 587,
            secure: useSecure, // true for 465, false for 587 (uses STARTTLS)
            auth: {
                user: smtpUser,
                pass: smtpPassword,
            },
        });

        // Verify the connection
        await transporter.verify();

        // Persist the settings and verification status
        await db.client.update({
            where: { id },
            data: {
                ...smtpConfig,
                smtpVerified: true,
                smtpLastTested: new Date(),
            },
        });

        // Log the successful test
        await db.smtpTestLog.create({
            data: {
                clientId: id,
                smtpHost,
                smtpPort: smtpPort || 587,
                smtpUser,
                smtpSecure: useSecure,
                success: true,
            },
        });

        return NextResponse.json({ success: true, message: "SMTP connection verified" });
    } catch (error: any) {
        console.error("[SMTP_TEST]", error);

        const errorMessage = error.message || "Failed to connect to SMTP server";

        // Mark as unverified on failure but still save settings
        if (smtpConfig.smtpHost) {
            await db.client.update({
                where: { id },
                data: {
                    ...smtpConfig,
                    smtpVerified: false,
                    smtpLastTested: new Date(),
                },
            }).catch(() => { });

            // Log the failed test
            await db.smtpTestLog.create({
                data: {
                    clientId: id,
                    smtpHost: smtpConfig.smtpHost,
                    smtpPort: smtpConfig.smtpPort || 587,
                    smtpUser: smtpConfig.smtpUser,
                    smtpSecure: smtpConfig.smtpSecure ?? true,
                    success: false,
                    errorMessage,
                },
            }).catch(() => { });
        }

        return new NextResponse(errorMessage, { status: 500 });
    }
}
