"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/audiences/[id]/segments - List all segments for an audience
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: audienceId } = await params;

        const segments = await db.segment.findMany({
            where: { audienceId },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true }
                },
                campaigns: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { contacts: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(segments);
    } catch (error) {
        console.error("Error fetching segments:", error);
        return NextResponse.json(
            { error: "Failed to fetch segments" },
            { status: 500 }
        );
    }
}

// POST /api/audiences/[id]/segments - Create a new segment (legacy endpoint)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: audienceId } = await params;
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        // Check if segment already exists in this audience
        const existingSegment = await db.segment.findUnique({
            where: {
                audienceId_name: {
                    audienceId,
                    name,
                },
            },
        });

        if (existingSegment) {
            return NextResponse.json(
                { error: "Segment name already exists in this audience" },
                { status: 409 }
            );
        }

        const segment = await db.segment.create({
            data: {
                audienceId,
                name,
                description,
                createdById: session.user.id,
            },
        });

        return NextResponse.json(segment, { status: 201 });
    } catch (error) {
        console.error("Error creating segment:", error);
        return NextResponse.json(
            { error: "Failed to create segment" },
            { status: 500 }
        );
    }
}
