import { db } from "@/lib/db";
import { AudiencesClient } from "./audiences-client";

export default async function AudiencesPage() {
    const audiences = await db.audience.findMany({
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    logo: true,
                }
            },
            _count: {
                select: {
                    contacts: true,
                    segments: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <AudiencesClient
            initialAudiences={JSON.parse(JSON.stringify(audiences))}
        />
    );
}
