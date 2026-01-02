import { db } from "@/lib/db";
import { TemplatesClient, type Template } from "./templates-client";

export default async function TemplatesPage() {
    const templates = await db.template.findMany({
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    brandColors: true,
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

    // Cast to expected type (brandColors from Prisma is JsonValue, we know it matches our shape)
    return <TemplatesClient initialTemplates={templates as unknown as Template[]} />;
}
