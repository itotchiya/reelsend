import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/postal/profiles/[id] - Get a specific profile (with password for activation)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const profile = await db.smtpProfile.findUnique({
            where: { id },
        });

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json({ profile });
    } catch (error: any) {
        console.error("[SMTP_PROFILE_GET] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get profile" },
            { status: 500 }
        );
    }
}

// DELETE /api/postal/profiles/[id] - Delete a profile
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const profile = await db.smtpProfile.findUnique({
            where: { id },
        });

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        await db.smtpProfile.delete({
            where: { id },
        });

        console.log("[SMTP_PROFILES] Deleted profile:", profile.name);

        return NextResponse.json({
            success: true,
            message: `Profile "${profile.name}" deleted`,
        });
    } catch (error: any) {
        console.error("[SMTP_PROFILE_DELETE] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete profile" },
            { status: 500 }
        );
    }
}

// PATCH /api/postal/profiles/[id] - Update a profile (name)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const profile = await db.smtpProfile.findUnique({
            where: { id },
        });

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const updatedProfile = await db.smtpProfile.update({
            where: { id },
            data: { name: name.trim() },
        });

        console.log("[SMTP_PROFILES] Updated profile name:", profile.name, "->", updatedProfile.name);

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
        });
    } catch (error: any) {
        console.error("[SMTP_PROFILE_PATCH] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update profile" },
            { status: 500 }
        );
    }
}
