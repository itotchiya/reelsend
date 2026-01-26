import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
    }

    if ((session?.user as { requiresLogout?: boolean })?.requiresLogout) {
        return NextResponse.json({ status: "requires_logout" });
    }

    return NextResponse.json({ status: "ok" });
}
