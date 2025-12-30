import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PortalClient } from "./portal-client";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function PortalPage({ params }: PageProps) {
    const { slug } = await params;

    // Fetch client with related data (public only)
    const client = await db.client.findUnique({
        where: { slug },
        include: {
            _count: {
                select: {
                    audiences: true,
                    campaigns: true,
                    templates: true,
                },
            },
        },
    });

    // Check if client exists
    if (!client) {
        notFound();
    }

    const c = client as any;

    // Serialize basic data
    const serializedClient = {
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        brandColors: c.brandColors,
        isPublic: c.isPublic,
        _count: c._count,
    };

    return <PortalClient client={serializedClient} />;
}
