import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Find contact to get audienceId before deletion
        const contact = await db.contact.findUnique({
            where: { id },
            select: { audienceId: true }
        });

        if (!contact) {
            return new NextResponse("Contact not found", { status: 404 });
        }

        await db.contact.delete({
            where: { id }
        });

        // Update audience contact count cache
        await db.audience.update({
            where: { id: contact.audienceId },
            data: {
                contactCount: {
                    decrement: 1
                }
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CONTACT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
