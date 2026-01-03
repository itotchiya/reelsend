import { db } from "@/lib/db";
import { Suspense } from "react";
import { AudiencesClient } from "./audiences-client";

export default async function AudiencesPage() {
    const [audiences, clients] = await Promise.all([
        db.audience.findMany({
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo: true,
                        brandColors: true,
                    },
                },
                campaigns: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        contacts: true,
                        segments: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        db.client.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: { name: "asc" },
        }),
    ]);

    // Transform audiences to match AudienceCardData interface
    const transformedAudiences = audiences.map((audience) => ({
        ...audience,
        client: audience.client
            ? {
                ...audience.client,
                brandColors: audience.client.brandColors as { primary?: string; secondary?: string } | null,
            }
            : null,
    })) as any[];

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AudiencesClient initialAudiences={transformedAudiences} clients={clients} />
        </Suspense>
    );
}
