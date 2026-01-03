import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AudiencesClient } from "./audiences-client";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; search?: string; pageSize?: string }>;
}

export default async function ClientAudiencesPage({ params, searchParams }: PageProps) {
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
    const where: any = { clientId: client.id };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    // Fetch audiences with pagination
    const [audiences, totalCount] = await Promise.all([
        db.audience.findMany({
            where,
            take: pageSize,
            skip: (pageNum - 1) * pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { contacts: true, segments: true } },
                campaigns: { select: { id: true, name: true }, take: 3 },
            },
        }),
        db.audience.count({ where }),
    ]);

    const serializedAudiences = audiences.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
    }));

    return (
        <AudiencesClient
            client={client}
            audiences={serializedAudiences}
            totalCount={totalCount}
            currentPage={pageNum}
            pageSize={pageSize}
            searchValue={search}
        />
    );
}
