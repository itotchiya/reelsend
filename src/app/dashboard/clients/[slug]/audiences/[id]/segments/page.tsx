import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SegmentsClient } from "./segments-client";

interface SegmentsPageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
    }>;
}

export default async function SegmentsPage({ params, searchParams }: SegmentsPageProps) {
    const session = await auth();
    const { slug, id } = await params;
    const { page = "1", pageSize: pageSizeParam } = await searchParams;

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

    const segments = await db.segment.findMany({
        where: { audienceId: id },
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

    return (
        <SegmentsClient
            audience={JSON.parse(JSON.stringify(audience))}
            segments={JSON.parse(JSON.stringify(segments))}
            pageSize={pageSize}
            currentPage={currentPage}
        />
    );
}
