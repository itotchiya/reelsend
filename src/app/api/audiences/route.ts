import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/audiences - Fetch all audiences
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const audiences = await db.audience.findMany({
            include: {
                client: true,
                _count: {
                    select: { contacts: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(audiences);
    } catch (error) {
        console.error("[AUDIENCES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/audiences - Create a new audience
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, clientId } = body;

        if (!name || !clientId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const audience = await db.audience.create({
            data: {
                name,
                description,
                clientId
            }
        });

        return NextResponse.json(audience);
    } catch (error) {
        console.error("[AUDIENCE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
