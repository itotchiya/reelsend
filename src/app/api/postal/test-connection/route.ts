import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testSmtpConnection, getSmtpConfigFromDb } from "@/lib/smtp";

// POST /api/postal/test-connection - Test SMTP connection
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formConfig = await request.json();

        // Get stored config from database for password fallback
        const storedConfig = await getSmtpConfigFromDb();

        // Use form values, but fall back to stored password if not provided
        const config = {
            host: formConfig.host || storedConfig.host,
            port: formConfig.port || storedConfig.port || 587,
            user: formConfig.user || storedConfig.user,
            password: formConfig.password || storedConfig.password,
            secure: formConfig.secure ?? storedConfig.secure ?? false,
        };

        // Validate required fields
        if (!config.host || !config.user || !config.password) {
            return NextResponse.json(
                { success: false, error: "Missing required SMTP configuration fields. Please enter password." },
                { status: 400 }
            );
        }

        console.log(`[POSTAL_TEST] Testing connection to ${config.host}:${config.port}`);

        const result = await testSmtpConnection(config);

        if (result.success) {
            console.log("[POSTAL_TEST] Connection successful");
            return NextResponse.json({
                success: true,
                message: "SMTP connection successful!",
            });
        } else {
            console.log("[POSTAL_TEST] Connection failed:", result.error);
            return NextResponse.json({
                success: false,
                error: result.error,
            });
        }
    } catch (error: any) {
        console.error("[POSTAL_TEST] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to test connection" },
            { status: 500 }
        );
    }
}
