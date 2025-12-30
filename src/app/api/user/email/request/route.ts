import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOTPEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { email } = body;

        if (!email) {
            return new NextResponse("Email is required", { status: 400 });
        }

        // Check if email is already taken
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ message: "Email already in use" }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Upsert verification token
        await db.verificationToken.upsert({
            where: {
                identifier_token: {
                    identifier: email,
                    token: otp,
                },
            },
            update: {
                expires,
            },
            create: {
                identifier: email,
                token: otp,
                expires,
            },
        });

        // Send OTP email
        const result = await sendOTPEmail({ to: email, otp });

        if (!result.success) {
            return NextResponse.json({ message: "Failed to send OTP email" }, { status: 500 });
        }

        return NextResponse.json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("[EMAIL_REQUEST_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
