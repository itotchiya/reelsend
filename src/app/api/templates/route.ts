import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { name, description, clientId } = body;

        if (!name || !clientId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Check if template name already exists for this client
        const existingTemplate = await db.template.findFirst({
            where: {
                clientId,
                name,
            },
        });

        if (existingTemplate) {
            return new NextResponse("Template name already exists for this client", { status: 409 });
        }

        const template = await db.template.create({
            data: {
                name,
                description,
                clientId,
                htmlContent: "", // Initial empty content
                jsonContent: {}, // Initial empty JSON for builder
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("[TEMPLATES_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const templates = await db.template.findMany({
            include: {
                client: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("[TEMPLATES_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
