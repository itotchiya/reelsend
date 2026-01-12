import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as acelle from "@/lib/acelle";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/contacts/[id] - Get contact details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const contact = await db.contact.findUnique({
            where: { id },
            include: {
                audience: {
                    include: { client: true }
                }
            }
        });

        if (!contact) {
            return new NextResponse("Contact not found", { status: 404 });
        }

        return NextResponse.json(contact);
    } catch (error) {
        console.error("[CONTACT_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PATCH /api/contacts/[id] - Update contact
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const contact = await db.contact.findUnique({
            where: { id },
            include: { audience: { include: { client: true } } }
        });

        if (!contact) {
            return new NextResponse("Contact not found", { status: 404 });
        }

        const {
            email,
            firstName,
            lastName,
            phone,
            country,
            city,
            street,
            birthday,
            gender,
            maritalStatus,
            metadata,
            status,
        } = body;

        const updated = await db.contact.update({
            where: { id },
            data: {
                ...(email !== undefined && { email }),
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(phone !== undefined && { phone }),
                ...(country !== undefined && { country }),
                ...(city !== undefined && { city }),
                ...(street !== undefined && { street }),
                ...(birthday !== undefined && { birthday }),
                ...(gender !== undefined && { gender }),
                ...(maritalStatus !== undefined && { maritalStatus }),
                ...(metadata !== undefined && { metadata }),
                ...(status !== undefined && { status }),
            }
        });

        // Sync with Acelle if subscriber ID exists
        if (contact.acelleSubscriberId) {
            try {
                await acelle.updateSubscriber(contact.acelleSubscriberId, {
                    email: updated.email,
                    FIRST_NAME: updated.firstName || undefined,
                    LAST_NAME: updated.lastName || undefined,
                    PHONE: updated.phone || undefined,
                    COUNTRY: updated.country || undefined,
                    CITY: updated.city || undefined,
                    ADDRESS: updated.street || undefined,
                    status: updated.status === "ACTIVE" ? "subscribed" : "unsubscribed",
                });
                console.log(`[ACELLE] Updated subscriber ${contact.acelleSubscriberId}`);
            } catch (acelleError) {
                console.error("[ACELLE] Subscriber update error:", acelleError);
            }
        }

        revalidatePath(`/dashboard/clients/${contact.audience.client.slug}/audiences/${contact.audienceId}/contacts`);

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("[CONTACT_PATCH]", error);

        if (error.code === "P2002") {
            return new NextResponse("A contact with this email already exists", { status: 409 });
        }

        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const contact = await db.contact.findUnique({
            where: { id },
            include: { audience: { include: { client: true } } }
        });

        if (!contact) {
            return new NextResponse("Contact not found", { status: 404 });
        }

        // Delete from Acelle first if subscriber ID exists
        if (contact.acelleSubscriberId) {
            try {
                await acelle.deleteSubscriber(contact.acelleSubscriberId);
                console.log(`[ACELLE] Deleted subscriber ${contact.acelleSubscriberId}`);
            } catch (acelleError) {
                console.error("[ACELLE] Subscriber delete error:", acelleError);
            }
        }

        await db.contact.delete({ where: { id } });

        // Update audience contact count
        await db.audience.update({
            where: { id: contact.audienceId },
            data: { contactCount: { decrement: 1 } }
        });

        revalidatePath(`/dashboard/clients/${contact.audience.client.slug}/audiences/${contact.audienceId}/contacts`);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CONTACT_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

