import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

        const audience = await db.audience.findUnique({
            where: { id },
            include: {
                contacts: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                    orderBy: {
                        email: "asc",
                    },
                },
            },
        });

        if (!audience) {
            return NextResponse.json({ error: "Audience not found" }, { status: 404 });
        }

        return NextResponse.json({
            contacts: audience.contacts,
        });
    } catch (error: any) {
        console.error("[AUDIENCE_CONTACTS_GET] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch audience contacts" },
            { status: 500 }
        );
    }
}
