"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/audiences/[id]/contacts - Get all contacts for an audience (with pagination & search)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: audienceId } = await params;
        const { searchParams } = new URL(request.url);

        // Parse pagination params
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        // Build where clause
        const where: {
            audienceId: string;
            OR?: { email?: { contains: string; mode: "insensitive" }; firstName?: { contains: string; mode: "insensitive" }; lastName?: { contains: string; mode: "insensitive" } }[];
        } = { audienceId };

        if (search) {
            where.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
            ];
        }

        // Get total count for pagination
        const total = await db.contact.count({ where });

        // Get paginated contacts
        const contacts = await db.contact.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        const pages = Math.ceil(total / limit) || 1;

        return NextResponse.json({
            contacts,
            total,
            pages,
            page,
        });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
            { error: "Failed to fetch contacts" },
            { status: 500 }
        );
    }
}

// POST /api/audiences/[id]/contacts - Add a contact to an audience
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: audienceId } = await params;
        const body = await request.json();
        const { email, firstName, lastName, metadata } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if audience exists
        const audience = await db.audience.findUnique({
            where: { id: audienceId },
        });

        if (!audience) {
            return NextResponse.json(
                { error: "Audience not found" },
                { status: 404 }
            );
        }

        // Check if contact already exists in this audience
        const existingContact = await db.contact.findUnique({
            where: {
                audienceId_email: {
                    audienceId,
                    email: email.toLowerCase(),
                },
            },
        });

        if (existingContact) {
            return NextResponse.json(
                { error: "Contact already exists in this audience" },
                { status: 409 }
            );
        }

        // Create the contact
        const contact = await db.contact.create({
            data: {
                audienceId,
                email: email.toLowerCase(),
                firstName: firstName || null,
                lastName: lastName || null,
                metadata: metadata || null,
            },
        });

        return NextResponse.json(contact, { status: 201 });
    } catch (error) {
        console.error("Error creating contact:", error);
        return NextResponse.json(
            { error: "Failed to create contact" },
            { status: 500 }
        );
    }
}

// DELETE /api/audiences/[id]/contacts - Delete a contact (with query param ?contactId=xxx)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: audienceId } = await params;
        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get("contactId");

        if (!contactId) {
            return NextResponse.json(
                { error: "Contact ID is required" },
                { status: 400 }
            );
        }

        // Verify contact belongs to this audience
        const contact = await db.contact.findFirst({
            where: {
                id: contactId,
                audienceId,
            },
        });

        if (!contact) {
            return NextResponse.json(
                { error: "Contact not found in this audience" },
                { status: 404 }
            );
        }

        await db.contact.delete({
            where: { id: contactId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting contact:", error);
        return NextResponse.json(
            { error: "Failed to delete contact" },
            { status: 500 }
        );
    }
}
