import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const SMTP_CONFIG_KEY = "smtp_config";
const DEFAULT_FROM_EMAIL_KEY = "default_from_email";

interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
}

// Helper to get a setting from database
async function getSetting(key: string): Promise<string | null> {
    const setting = await db.systemSettings.findUnique({
        where: { key },
    });
    return setting?.value || null;
}

// Helper to set a setting in database
async function setSetting(key: string, value: string): Promise<void> {
    await db.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}

// Get SMTP config from database, fallback to env
async function getStoredSmtpConfig(): Promise<SmtpConfig> {
    const storedConfig = await getSetting(SMTP_CONFIG_KEY);

    if (storedConfig) {
        try {
            return JSON.parse(storedConfig);
        } catch {
            // Invalid JSON, fallback to env
        }
    }

    // Fallback to environment variables
    return {
        host: process.env.SMTP_HOST || "",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        user: process.env.SMTP_USER || "",
        password: process.env.SMTP_PASSWORD || "",
        secure: process.env.SMTP_SECURE === "true",
    };
}

// GET /api/postal/config - Get current SMTP configuration
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const config = await getStoredSmtpConfig();
        const defaultFromEmail = await getSetting(DEFAULT_FROM_EMAIL_KEY) || process.env.DEFAULT_FROM_EMAIL || "";

        // Check if there's a stored password
        const hasStoredPassword = !!(config.password && config.password.length > 0);

        // Return the actual password as requested by the user for verification
        const responseConfig = {
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password || "",
            secure: config.secure,
        };

        return NextResponse.json({
            config: responseConfig,
            isConfigured: !!(config.host && config.user && config.password),
            hasStoredPassword,
            defaultFromEmail,
        });
    } catch (error: any) {
        console.error("[POSTAL_CONFIG_GET] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get config" },
            { status: 500 }
        );
    }
}

// POST /api/postal/config - Save SMTP configuration to database
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { config, defaultFromEmail } = body;

        // Validate config
        if (!config.host || !config.user) {
            return NextResponse.json(
                { error: "Missing required SMTP configuration fields" },
                { status: 400 }
            );
        }

        // Get existing config to preserve password if not changed
        const existingConfig = await getStoredSmtpConfig();

        // Debug logging
        console.log("[POSTAL_CONFIG] Password debugging:", {
            receivedPassword: config.password ? `[${config.password.length} chars]` : "[empty]",
            isMasked: config.password === "••••••••••••",
            existingHasPassword: !!existingConfig.password,
        });

        // If password is masked (not changed), use existing password
        // If password is empty, also use existing (user didn't change it)
        let finalPassword = config.password;
        if (!config.password || config.password === "••••••••••••") {
            finalPassword = existingConfig.password;
        }

        console.log("[POSTAL_CONFIG] Final password length:", finalPassword ? finalPassword.length : 0);

        // Build the config to save
        const configToSave: SmtpConfig = {
            host: config.host,
            port: config.port || 587,
            user: config.user,
            password: finalPassword || "",
            secure: config.secure || false,
        };

        // Save to database
        await setSetting(SMTP_CONFIG_KEY, JSON.stringify(configToSave));

        if (defaultFromEmail) {
            await setSetting(DEFAULT_FROM_EMAIL_KEY, defaultFromEmail);
        }

        console.log("[POSTAL_CONFIG] Configuration saved to database:", {
            host: configToSave.host,
            port: configToSave.port,
            user: configToSave.user,
            secure: configToSave.secure,
            defaultFromEmail,
        });

        return NextResponse.json({
            success: true,
            message: "Configuration saved successfully!",
        });
    } catch (error: any) {
        console.error("[POSTAL_CONFIG_POST] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save config" },
            { status: 500 }
        );
    }
}
