import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, name, password } = body;

        if (!token || !name || !password) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Find user by invite token
        const user = await db.user.findUnique({
            where: { inviteToken: token },
        });

        if (!user) {
            return new NextResponse("Invalid or expired invitation", { status: 400 });
        }

        // Check if token has expired
        if (user.inviteExpires && new Date() > user.inviteExpires) {
            return new NextResponse("Invitation has expired", { status: 400 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update the user
        await db.user.update({
            where: { id: user.id },
            data: {
                name,
                password: hashedPassword,
                status: "ACTIVE",
                inviteToken: null,
                inviteExpires: null,
            },
        });

        return NextResponse.json({ success: true, email: user.email });
    } catch (error) {
        console.error("[SETUP_ACCOUNT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
