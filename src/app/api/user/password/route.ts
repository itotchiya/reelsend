import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.password) {
            return new NextResponse("User not found or password not set", { status: 404 });
        }

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordCorrect) {
            return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: session.user.id },
            data: {
                password: hashedPassword,
            },
        });

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("[PASSWORD_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
