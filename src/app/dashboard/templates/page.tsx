import { db } from "@/lib/db";
import { Suspense } from "react";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
    const [templates, clients] = await Promise.all([
        db.template.findMany({
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

    // Transform templates to match TemplateCardData interface
    const transformedTemplates = templates.map((template) => ({
        ...template,
        client: template.client
            ? {
                ...template.client,
                primaryColor: (template.client.brandColors as any)?.primary || null,
            }
            : null,
    })) as any[];

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TemplatesClient initialTemplates={transformedTemplates} clients={clients} />
        </Suspense>
    );
}

