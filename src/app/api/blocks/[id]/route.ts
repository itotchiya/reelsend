import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/blocks/[id] - Get a single block
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const block = await db.savedBlock.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        brandColors: true,
                    },
                },
            },
        });

        if (!block) {
            return NextResponse.json({ error: "Block not found" }, { status: 404 });
        }

        return NextResponse.json(block);
    } catch (error) {
        console.error("[BLOCK_GET]", error);
        return NextResponse.json(
            { error: "Failed to fetch block" },
            { status: 500 }
        );
    }
}

// PATCH /api/blocks/[id] - Update a block
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description, category, clientId, jsonContent, thumbnail } = body;

        const block = await db.savedBlock.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(category !== undefined && { category }),
                ...(clientId !== undefined && { clientId: clientId || null }),
                ...(jsonContent !== undefined && { jsonContent }),
                ...(thumbnail !== undefined && { thumbnail }),
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        brandColors: true,
                    },
                },
            },
        });

        return NextResponse.json(block);
    } catch (error) {
        console.error("[BLOCK_PATCH]", error);
        return NextResponse.json(
            { error: "Failed to update block" },
            { status: 500 }
        );
    }
}

// DELETE /api/blocks/[id] - Delete a block
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await db.savedBlock.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[BLOCK_DELETE]", error);
        return NextResponse.json(
            { error: "Failed to delete block" },
            { status: 500 }
        );
    }
}
