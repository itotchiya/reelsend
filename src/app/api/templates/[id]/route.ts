import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
        const { htmlContent, jsonContent, name, description, clientId } = body;

        // Build update data, only including defined fields
        const updateData: any = {
            updatedById: session.user.id, // Always track who updated
        };
        if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
        if (jsonContent !== undefined) updateData.jsonContent = jsonContent;
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (clientId !== undefined) updateData.clientId = clientId || null;

        const template = await db.template.update({
            where: { id },
            data: updateData,
        });

        // Determine what was changed for activity log
        const isContentUpdate = htmlContent !== undefined || jsonContent !== undefined;
        const isDetailsUpdate = name !== undefined || description !== undefined || clientId !== undefined;

        // Log the activity
        await db.templateActivity.create({
            data: {
                templateId: id,
                userId: session.user.id,
                action: isContentUpdate ? "updated" : "details_updated",
                description: isContentUpdate
                    ? "Template content updated"
                    : "Template details updated",
            },
        });

        // Revalidate the templates list to show updated content
        revalidatePath("/dashboard/templates");

        return NextResponse.json(template);
    } catch (error) {
        console.error("[TEMPLATE_PATCH]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

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

        // Check if template exists and get campaign count
        const template = await db.template.findUnique({
            where: { id },
            include: {
                _count: { select: { campaigns: true } }
            }
        });

        if (!template) {
            return new NextResponse("Template not found", { status: 404 });
        }

        // Check if template is being used in any campaigns
        if (template._count.campaigns > 0) {
            return new NextResponse(
                `This template cannot be deleted because it is being used in ${template._count.campaigns} campaign(s). Please remove it from all campaigns first.`,
                { status: 409 }
            );
        }

        await db.template.delete({
            where: { id },
        });

        // Revalidate the templates list
        revalidatePath("/dashboard/templates");

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[TEMPLATE_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
