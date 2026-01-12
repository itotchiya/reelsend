import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlocksClient } from "./blocks-client";

interface BlocksPageProps {
    searchParams: Promise<{
        category?: string;
        clientId?: string;
        search?: string;
        page?: string;
    }>;
}

export default async function BlocksPage({ searchParams }: BlocksPageProps) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const params = await searchParams;
    const category = params.category;
    const clientId = params.clientId;
    const search = params.search;
    const page = parseInt(params.page || "1");
    const limit = 12;
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

    const [blocksRaw, total] = await Promise.all([
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

    // Transform blocks to include primaryColor extracted from brandColors
    const blocks = blocksRaw.map((block) => ({
        ...block,
        client: block.client ? {
            ...block.client,
            primaryColor: (block.client.brandColors as any)?.primary || null,
        } : null,
    }));

    // Get unique categories for filters
    const categoriesRaw = await db.savedBlock.findMany({
        select: { category: true },
        distinct: ["category"],
        where: { category: { not: null } },
    });

    // Get clients for filter dropdown
    const clients = await db.client.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
    });

    return (
        <BlocksClient
            blocks={JSON.parse(JSON.stringify(blocks))}
            pagination={{
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }}
            filters={{
                categories: categoriesRaw.map((c) => c.category).filter(Boolean) as string[],
                clients,
            }}
            currentFilters={{
                category: category || "all",
                clientId: clientId || "",
                search: search || "",
            }}
        />
    );
}
