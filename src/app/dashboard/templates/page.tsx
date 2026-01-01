import { db } from "@/lib/db";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
    const templates = await db.template.findMany({
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            campaigns: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return <TemplatesClient initialTemplates={templates} />;
}
