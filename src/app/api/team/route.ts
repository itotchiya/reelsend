import { NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { sendInvitationEmail } from "@/lib/email";
import crypto from "crypto";

// GET /api/team - List all users
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    const canManageUsers = hasPermission(userPermissions, "users:manage");
    if (!canManageUsers) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const users = await db.user.findMany({
            include: {
                role: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[TEAM_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/team - Invite a new user
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userPermissions = (session.user as any)?.permissions;
    const canManageUsers = hasPermission(userPermissions, "users:manage");
    if (!canManageUsers) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const { email, roleId } = body;

        if (!email || !roleId) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 400 });
        }

        // Create invitation token
        const inviteToken = crypto.randomBytes(32).toString("hex");
        const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create pending user
        const newUser = await db.user.create({
            data: {
                email,
                roleId,
                status: "INVITED",
                inviteToken,
                inviteExpires,
                invitedBy: session.user.name || session.user.email || undefined,
                invitationSentAt: new Date(),
            },
            include: {
                role: true,
            },
        });


        // Send invitation email in background
        after(async () => {
            const roleName = (newUser as any).role?.name || "Member";
            const emailResult = await sendInvitationEmail({
                to: email,
                inviterName: session?.user?.name || session?.user?.email || "A team member",
                roleName,
                inviteToken,
            });

            if (!emailResult.success) {
                console.error("[TEAM_INVITE_EMAIL_ERROR]", emailResult.error);
            }
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error("[TEAM_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
