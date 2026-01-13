import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { TemplatesClient } from "./templates-client";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; search?: string; pageSize?: string }>;
}

export default async function ClientTemplatesPage({ params, searchParams }: PageProps) {
    const session = await auth();
    const { slug } = await params;
    const { page = "1", search = "", pageSize: pageSizeParam = "16" } = await searchParams;

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;
    if (!userPermissions?.includes("clients:view")) {
        redirect("/dashboard");
    }

    // Fetch client
    const client = await db.client.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true, brandColors: true },
    });

    if (!client) {
        notFound();
    }

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(pageSizeParam) || 16;

    // Build where clause
    const where: any = { clientId: client.id, category: null };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    // Fetch templates with pagination
    const [templates, totalCount] = await Promise.all([
        db.template.findMany({
            where,
            take: pageSize,
            skip: (pageNum - 1) * pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                campaigns: { select: { id: true, name: true }, take: 3 },
            },
        }),
        db.template.count({ where }),
    ]);

    const serializedTemplates = templates.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));

    return (
        <TemplatesClient
            client={client}
            templates={serializedTemplates}
            totalCount={totalCount}
            currentPage={pageNum}
            pageSize={pageSize}
            searchValue={search}
        />
    );
}
