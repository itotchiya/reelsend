import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { name, description, clientId, duplicateFromId, htmlContent: providedHtml, category, jsonContent: providedJson } = body;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        let htmlContent = providedHtml || "";
        let jsonContent = providedJson || {};

        // If duplicating from another template, copy its content
        if (duplicateFromId) {
            const sourceTemplate = await db.template.findUnique({
                where: { id: duplicateFromId },
                select: { htmlContent: true, jsonContent: true },
            });

            if (sourceTemplate) {
                htmlContent = sourceTemplate.htmlContent || "";
                jsonContent = sourceTemplate.jsonContent || {};
            }
        }

        const template = await db.template.create({
            data: {
                name,
                description,
                category: (category as string) || null,
                clientId: clientId || null,
                htmlContent,
                jsonContent,
                createdById: session.user.id,
                updatedById: session.user.id,
            },
        });

        // Log the activity
        await db.templateActivity.create({
            data: {
                templateId: template.id,
                userId: session.user.id,
                action: duplicateFromId ? "duplicated" : "created",
                description: duplicateFromId
                    ? `Duplicated from another template`
                    : `Template created`,
            },
        });

        // Revalidate the templates list page
        revalidatePath("/dashboard/templates");

        return NextResponse.json(template);
    } catch (error: any) {
        console.error("[TEMPLATES_POST]", error);

        // Check for Prisma unique constraint violation
        if (error.code === "P2002") {
            return new NextResponse("A template with this name already exists for this client.", { status: 409 });
        }

        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const hasCategory = searchParams.get("hasCategory") === "true";

        const templates = await db.template.findMany({
            where: {
                ...(clientId && { clientId }),
                ...(hasCategory && { category: { not: null } }),
            },
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
