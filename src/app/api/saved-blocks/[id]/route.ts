import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// DELETE - Delete a saved block
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        await db.savedBlock.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[SAVED_BLOCK_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PATCH - Update a saved block
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description, category, jsonContent, thumbnail } = body;

        const savedBlock = await db.savedBlock.update({
            where: { id },
            data: {
                name,
                description,
                category,
                jsonContent,
                thumbnail,
            },
        });

        return NextResponse.json(savedBlock);
    } catch (error) {
        console.error("[SAVED_BLOCK_PATCH]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
