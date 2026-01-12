import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/postal/profiles - Get all saved SMTP profiles
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profiles = await db.smtpProfile.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        brandColors: true,
                    }
                },
                campaigns: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        return NextResponse.json({ profiles });
    } catch (error: any) {
        console.error("[SMTP_PROFILES_GET] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get profiles" },
            { status: 500 }
        );
    }
}

// POST /api/postal/profiles - Create a new SMTP profile
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, host, port, user, password, secure, defaultFromEmail, clientId } = body;

        // Validate required fields
        if (!name || !host || !user || !password) {
            return NextResponse.json(
                { error: "Name, host, user, and password are required" },
                { status: 400 }
            );
        }

        // Create the profile
        const profile = await db.smtpProfile.create({
            data: {
                name,
                host,
                port: port || 587,
                user,
                password,
                secure: secure || false,
                defaultFromEmail: defaultFromEmail || null,
                clientId: clientId || null,
            },
        });

        console.log("[SMTP_PROFILES] Created profile:", profile.name);

        return NextResponse.json({
            success: true,
            profile: {
                id: profile.id,
                name: profile.name,
                host: profile.host,
                port: profile.port,
                user: profile.user,
                secure: profile.secure,
                defaultFromEmail: profile.defaultFromEmail,
                clientId: profile.clientId,
                createdAt: profile.createdAt,
            },
        });
    } catch (error: any) {
        console.error("[SMTP_PROFILES_POST] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create profile" },
            { status: 500 }
        );
    }
}
