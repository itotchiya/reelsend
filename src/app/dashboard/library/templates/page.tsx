import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TemplatesClient } from "../../templates/templates-client";
import { TemplateCardData } from "@/components/ui-kit/template-card";

export default async function LibraryTemplatesPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    // library templates have a category
    const templates = await db.template.findMany({
        where: {
            category: { not: null }
        },
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

    const transformedTemplates = templates.map((template: any) => ({
        ...template,
        client: template.client
            ? {
                ...template.client,
                primaryColor: (template.client.brandColors as any)?.primary || null,
            }
            : null,
    }));

    return (
        <TemplatesClient
            initialTemplates={transformedTemplates}
            mode="library"
        />
    );
}
