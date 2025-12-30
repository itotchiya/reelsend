import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return new NextResponse("Email and OTP are required", { status: 400 });
        }

        // Verify token
        const verificationToken = await db.verificationToken.findUnique({
            where: {
                identifier_token: {
                    identifier: email,
                    token: otp,
                },
            },
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
            return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
        }

        // Update user email
        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                email,
                emailVerified: new Date(),
            },
        });

        // Delete the token
        await db.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email,
                    token: otp,
                },
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[EMAIL_VERIFY_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
