import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - List saved blocks (optionally filter by clientId)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const category = searchParams.get("category");

        // Get blocks for this client OR global blocks (clientId = null)
        const savedBlocks = await db.savedBlock.findMany({
            where: {
                OR: [
                    { clientId: clientId || undefined },
                    { clientId: null }, // Global blocks
                ],
                ...(category && { category }),
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(savedBlocks);
    } catch (error) {
        console.error("[SAVED_BLOCKS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST - Create a new saved block
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { name, description, category, jsonContent, thumbnail, clientId } = body;

        if (!name || !jsonContent) {
            return new NextResponse("Name and content are required", { status: 400 });
        }

        const savedBlock = await db.savedBlock.create({
            data: {
                name,
                description,
                category,
                jsonContent,
                thumbnail,
                clientId: clientId || null, // null = global block
            },
        });

        return NextResponse.json(savedBlock);
    } catch (error) {
        console.error("[SAVED_BLOCKS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
