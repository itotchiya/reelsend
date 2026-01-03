import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { CampaignsClient } from "./campaigns-client";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; search?: string; status?: string; pageSize?: string }>;
}

export default async function ClientCampaignsPage({ params, searchParams }: PageProps) {
    const session = await auth();
    const { slug } = await params;
    const { page = "1", search = "", status = "all", pageSize: pageSizeParam = "16" } = await searchParams;

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
            { subject: { contains: search, mode: "insensitive" } },
        ];
    }
    if (status && status !== "all") {
        where.status = status.toUpperCase();
    }

    // Fetch campaigns with pagination
    const [campaigns, totalCount] = await Promise.all([
        db.campaign.findMany({
            where,
            take: pageSize,
            skip: (pageNum - 1) * pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                template: { select: { id: true, name: true } },
                audience: { select: { id: true, name: true } },
            },
        }),
        db.campaign.count({ where }),
    ]);

    const serializedCampaigns = campaigns.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        scheduledAt: c.scheduledAt?.toISOString() || null,
        sentAt: c.sentAt?.toISOString() || null,
    }));

    return (
        <CampaignsClient
            client={client}
            campaigns={serializedCampaigns}
            totalCount={totalCount}
            currentPage={pageNum}
            pageSize={pageSize}
            searchValue={search}
            statusFilter={status}
        />
    );
}
