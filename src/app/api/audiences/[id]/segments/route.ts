"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/audiences/[id]/segments - List all segments for an audience
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: audienceId } = await params;

        const segments = await db.segment.findMany({
            where: { audienceId },
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

// POST /api/audiences/[id]/segments - Create a new segment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: audienceId } = await params;
        const body = await request.json();
        const { name, description, rules } = body;

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
                rules: rules || {},
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
