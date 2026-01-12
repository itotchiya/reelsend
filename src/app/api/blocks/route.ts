import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/blocks - List all blocks with optional filters
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get("category");
        const clientId = searchParams.get("clientId");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (category && category !== "all") {
            where.category = category;
        }

        if (clientId) {
            if (clientId === "global") {
                where.clientId = null;
            } else {
                where.clientId = clientId;
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        const [blocks, total] = await Promise.all([
            db.savedBlock.findMany({
                where,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            brandColors: true,
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
            }),
            db.savedBlock.count({ where }),
        ]);

        // Get unique categories for filters
        const categories = await db.savedBlock.findMany({
            select: { category: true },
            distinct: ["category"],
            where: { category: { not: null } },
        });

        // Get clients for filter dropdown
        const clients = await db.client.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            blocks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            filters: {
                categories: categories.map((c) => c.category).filter(Boolean),
                clients,
            },
        });
    } catch (error) {
        console.error("[BLOCKS_GET]", error);
        return NextResponse.json(
            { error: "Failed to fetch blocks" },
            { status: 500 }
        );
    }
}

// POST /api/blocks - Create a new block
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, category, clientId, jsonContent, thumbnail } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const block = await db.savedBlock.create({
            data: {
                name,
                description,
                category,
                clientId: clientId || null, // null = global block
                jsonContent: jsonContent || {},
                thumbnail,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        brandColors: true,
                    },
                },
            },
        });

        return NextResponse.json(block, { status: 201 });
    } catch (error) {
        console.error("[BLOCKS_POST]", error);
        return NextResponse.json(
            { error: "Failed to create block" },
            { status: 500 }
        );
    }
}
