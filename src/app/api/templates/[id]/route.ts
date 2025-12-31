import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const template = await db.template.findUnique({
            where: { id },
            include: {
                client: true,
            },
        });

        if (!template) {
            return new NextResponse("Template not found", { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error("[TEMPLATE_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

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
        const { htmlContent, jsonContent, name, description } = body;

        const template = await db.template.update({
            where: { id },
            data: {
                htmlContent,
                jsonContent,
                name,
                description,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("[TEMPLATE_PATCH]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
