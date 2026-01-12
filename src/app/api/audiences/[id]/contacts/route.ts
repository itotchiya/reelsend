import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const audience = await db.audience.findUnique({
            where: { id },
            include: {
                contacts: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                    orderBy: {
                        email: "asc",
                    },
                },
            },
        });

        if (!audience) {
            return NextResponse.json({ error: "Audience not found" }, { status: 404 });
        }

        return NextResponse.json({
            contacts: audience.contacts,
        });
    } catch (error: any) {
        console.error("[AUDIENCE_CONTACTS_GET] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch audience contacts" },
            { status: 500 }
        );
    }
}

// POST /api/audiences/[id]/contacts - Create a new contact
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: audienceId } = await params;
        const body = await request.json();

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
        } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Verify audience exists and get client slug for revalidation
        const audience = await db.audience.findUnique({
            where: { id: audienceId },
            include: { client: { select: { slug: true } } }
        });

        if (!audience) {
            return NextResponse.json({ error: "Audience not found" }, { status: 404 });
        }

        // Create contact
        const contact = await db.contact.create({
            data: {
                audienceId,
                email,
                firstName: firstName || null,
                lastName: lastName || null,
                phone: phone || null,
                country: country || null,
                city: city || null,
                street: street || null,
                birthday: birthday ? new Date(birthday) : null,
                gender: gender || null,
                maritalStatus: maritalStatus || null,
            }
        });

        // Update audience contact count
        await db.audience.update({
            where: { id: audienceId },
            data: { contactCount: { increment: 1 } }
        });

        // Revalidate paths
        revalidatePath(`/dashboard/clients/${audience.client.slug}/audiences/${audienceId}/contacts`);

        return NextResponse.json(contact, { status: 201 });
    } catch (error: any) {
        console.error("[AUDIENCE_CONTACTS_POST] Error:", error);

        // Handle duplicate email error
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A contact with this email already exists in this audience" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to create contact" },
            { status: 500 }
        );
    }
}

