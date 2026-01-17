import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsedInClient } from "./used-in-client";

interface UsedInPageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        search?: string;
        status?: string;
    }>;
}

export default async function UsedInPage({ params, searchParams }: UsedInPageProps) {
    const session = await auth();
    const { slug, id } = await params;
    const { page = "1", pageSize: pageSizeParam, search = "", status = "all" } = await searchParams;

    if (!session?.user?.id) {
        redirect("/login");
    }

    const audience = await db.audience.findUnique({
        where: { id },
        include: {
            client: true,
        }
    });

    if (!audience || audience.client.slug !== slug) {
        redirect(`/dashboard/clients/${slug}`);
    }

    const pageSize = parseInt(pageSizeParam || "20", 10);
    const currentPage = parseInt(page, 10) || 1;

    const where: any = {
        OR: [
            { audienceId: id },
            { segment: { audienceId: id } }
        ]
    };

    if (search) {
        where.name = { contains: search, mode: "insensitive" };
    }

    if (status !== "all") {
        where.status = status.toUpperCase();
    }

    const [campaigns, totalCount] = await Promise.all([
        db.campaign.findMany({
            where,
            include: {
                template: {
                    select: {
                        name: true,
                    }
                },
                audience: {
                    select: {
                        name: true,
                    }
                },
                segment: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        }),
        db.campaign.count({ where }),
    ]);

    return (
        <UsedInClient
            audience={JSON.parse(JSON.stringify(audience))}
            campaigns={JSON.parse(JSON.stringify(campaigns))}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            searchValue={search}
            statusFilter={status}
        />
    );
}
